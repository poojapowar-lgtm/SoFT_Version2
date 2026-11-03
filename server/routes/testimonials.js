const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");
const multer = require("multer");

const {
  sendApprovalNotification,
  sendSubmissionConfirmation,
} = require("../utils/mailer");


// ================= STORAGE =================
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, "uploads/testimonials/"),

  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      ""
    );

    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({ storage }).single("video");

// ================= CONSTANTS =================
const ENTITY_TYPE = "testimonials";

// ================= HELPERS =================
const isSuperAdmin = (req) =>
  req.admin?.role === "superadmin";

const generateText = (input) => {
  if (!input) return null;

  let name = input;

  if (input.startsWith("http")) {
    name = input.split("/").pop().split("?")[0];
  }

  return name
    .replace(/^\d+-/, "")
    .split(".")[0]
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const buildTestimonialData = (body, existing = null, file = null) => {
  let video_path = existing?.video_path || null;
  let video_url =
    body.video_url !== undefined
      ? body.video_url || null
      : existing?.video_url || null;

  if (body.video_path !== undefined) {
    video_path = body.video_path || null;
  }

  if (file) {
    video_path = `/uploads/testimonials/${file.filename}`;
  }

  const source = video_path || video_url;

  const title =
    body.title?.trim() ||
    generateText(source);

  return {
    title: title || null,
    video_path,
    video_url,
  };
};

const createChangeRequest = (
  req,
  res,
  {
    recordId = null,
    operation,
    proposedData,
    originalData = null,
    message,
  }
) => {
  const sql = `
    INSERT INTO content_change_requests
    (
      entity_type,
      record_id,
      operation,
      proposed_data,
      original_data,
      status,
      submitted_by
    )
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `;

  db.query(
    sql,
    [
      ENTITY_TYPE,
      recordId,
      operation,
      JSON.stringify(proposedData),
      originalData == null ? null : JSON.stringify(originalData),
      req.admin.id,
    ],
    (err, result) => {
      if (err) {
        console.error("TESTIMONIAL REQUEST ERROR:", err);

        return res.status(500).json({
          message: "Failed to submit testimonial change request.",
        });
      }

      const requestId = result.insertId;
      const adminId = req.admin.id;
      const adminEmail = req.admin.email;
      const entityType = ENTITY_TYPE || "testimonials";

      res.status(201).json({
        message,
        requestId,
        status: "pending",
      });

      // 1. Notify Super Admin.
      sendApprovalNotification({
        requestId,
        entityType,
        operation,
        requestedBy: adminEmail || `Admin ID: ${adminId}`,
      }).catch((emailError) => {
        console.error(
          "Testimonial approval notification failed:",
          emailError.message
        );
      });

      // 2. Confirm submission to the requesting admin.
      if (!adminEmail) {
        console.error(
          `Testimonial request ${requestId}: submitting admin email is missing.`
        );
        return;
      }

      sendSubmissionConfirmation({
        adminEmail,
        requestId,
        entityType,
        operation,
      }).catch((emailError) => {
        console.error(
          "Testimonial submission confirmation failed:",
          emailError.message
        );
      });
    }
  );
};

const getTestimonialById = (id, callback) => {
  db.query(
    "SELECT * FROM testimonials WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return callback(err, null);

      if (!results.length) {
        return callback(null, null);
      }

      return callback(null, results[0]);
    }
  );
};

const validateVideo = (data) =>
  Boolean(data.video_path || data.video_url);

// ================= GET MY CHANGE REQUESTS =================
// Keep this before GET /:id if adding a single-record GET route.

router.get("/my-requests", auth, (req, res) => {
  const sql = `
    SELECT *
    FROM content_change_requests
    WHERE entity_type = ? AND submitted_by = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [ENTITY_TYPE, req.admin.id], (err, results) => {
    if (err) {
      console.error("GET TESTIMONIAL REQUESTS ERROR:", err);

      return res.status(500).json({
        message: "Failed to load your change requests.",
      });
    }

    return res.json(results);
  });
});

// ================= GET ALL PUBLISHED TESTIMONIALS =================

router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM testimonials ORDER BY id DESC",
    (err, results) => {
      if (err) {
        console.error("GET TESTIMONIALS ERROR:", err);

        return res.status(500).json({
          message: "Failed to fetch testimonials.",
        });
      }

      return res.json(results);
    }
  );
});

// ================= CREATE TESTIMONIAL =================

router.post("/", auth, upload, (req, res) => {
  const data = buildTestimonialData(
    req.body,
    null,
    req.file
  );

  if (!validateVideo(data)) {
    return res.status(400).json({
      message: "Video file or URL is required.",
    });
  }

  // Regular admins submit a request for approval.
  if (!isSuperAdmin(req)) {
    return createChangeRequest(req, res, {
      operation: "create",
      proposedData: data,
      message: "Testimonial creation submitted for approval.",
    });
  }

  // Superadmin creates the record directly.
  db.query(
    `INSERT INTO testimonials (title, video_path, video_url)
     VALUES (?, ?, ?)`,
    [data.title, data.video_path, data.video_url],
    (err, result) => {
      if (err) {
        console.error("CREATE TESTIMONIAL ERROR:", err);

        return res.status(500).json({
          message: "Failed to add testimonial.",
        });
      }

      return res.status(201).json({
        message: "Testimonial added successfully.",
        id: result.insertId,
      });
    }
  );
});

// ================= UPDATE TESTIMONIAL =================

router.put("/:id", auth, upload, (req, res) => {
  const id = req.params.id;

  getTestimonialById(id, (err, existing) => {
    if (err) {
      console.error("GET TESTIMONIAL ERROR:", err);

      return res.status(500).json({
        message: "Database error.",
      });
    }

    if (!existing) {
      return res.status(404).json({
        message: "Testimonial not found.",
      });
    }

    const data = buildTestimonialData(
      req.body,
      existing,
      req.file
    );

    if (!validateVideo(data)) {
      return res.status(400).json({
        message: "Video file or URL is required.",
      });
    }

    // Regular admins submit a request for approval.
    if (!isSuperAdmin(req)) {
      return createChangeRequest(req, res, {
        recordId: id,
        operation: "update",
        proposedData: data,
        originalData: existing,
        message: "Testimonial update submitted for approval.",
      });
    }

    // Superadmin updates the record directly.
    db.query(
      `UPDATE testimonials
       SET title = ?, video_path = ?, video_url = ?
       WHERE id = ?`,
      [
        data.title,
        data.video_path,
        data.video_url,
        id,
      ],
      (updateErr) => {
        if (updateErr) {
          console.error("UPDATE TESTIMONIAL ERROR:", updateErr);

          return res.status(500).json({
            message: "Failed to update testimonial.",
          });
        }

        return res.json({
          message: "Testimonial updated successfully.",
        });
      }
    );
  });
});

// ================= DELETE TESTIMONIAL =================

router.delete("/:id", auth, (req, res) => {
  const id = req.params.id;

  getTestimonialById(id, (err, existing) => {
    if (err) {
      console.error("GET TESTIMONIAL ERROR:", err);

      return res.status(500).json({
        message: "Database error.",
      });
    }

    if (!existing) {
      return res.status(404).json({
        message: "Testimonial not found.",
      });
    }

    // Regular admins submit a request for approval.
    if (!isSuperAdmin(req)) {
      return createChangeRequest(req, res, {
        recordId: id,
        operation: "delete",
        proposedData: { id: Number(id) },
        originalData: existing,
        message: "Testimonial deletion submitted for approval.",
      });
    }

    // Superadmin deletes the record directly.
    db.query(
      "DELETE FROM testimonials WHERE id = ?",
      [id],
      (deleteErr, result) => {
        if (deleteErr) {
          console.error("DELETE TESTIMONIAL ERROR:", deleteErr);

          return res.status(500).json({
            message: "Failed to delete testimonial.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Testimonial not found.",
          });
        }

        return res.json({
          message: "Testimonial deleted successfully.",
        });
      }
    );
  });
});

module.exports = router;
