const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");
const multer = require("multer");

const {
  sendApprovalNotification,
  sendSubmissionConfirmation,
} = require("../utils/mailer");


// ================= FILE UPLOAD =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      ""
    );
    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({ storage });

// ================= CONSTANTS =================
const ENTITY_TYPE = "faculty";

const isSuperAdmin = (req) =>
  req.admin?.role === "superadmin";

// ================= HELPERS =================
const buildFacultyData = (body, image) => ({
  name: body.name?.trim(),
  designation: body.designation?.trim(),
  area_of_expertise: body.area_of_expertise || null,
  image: image || null,
});


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
      originalData != null ? JSON.stringify(originalData) : null,
      req.admin.id,
    ],
    async (err, result) => {
      if (err) {
        console.error("Faculty request submission error:", err);

        return res.status(500).json({
          message: "Failed to submit faculty change request.",
        });
      }

      const requestId = result.insertId;
      const adminId = req.admin.id;
      const adminEmail = req.admin.email;

      res.status(201).json({
        message,
        requestId,
        status: "pending",
      });

      // 1. Notify Super Admin.
      try {
        await sendApprovalNotification({
          requestId,
          entityType: ENTITY_TYPE || "faculty",
          operation,
          requestedBy: adminEmail || `Admin ID: ${adminId}`,
        });
      } catch (emailError) {
        console.error(
          "Faculty superadmin notification failed:",
          emailError.message
        );
      }

      // 2. Confirm submission to the requesting admin.
      if (!adminEmail) {
        console.error(
          `Faculty request ${requestId}: submitting admin email is missing.`
        );
        return;
      }

      try {
        await sendSubmissionConfirmation({
          adminEmail,
          requestId,
          entityType: ENTITY_TYPE || "faculty",
          operation,
        });
      } catch (emailError) {
        console.error(
          "Faculty submitter confirmation failed:",
          emailError.message
        );
      }
    }
  );
};


const getFacultyById = (id, callback) => {
  db.query(
    "SELECT * FROM faculty WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return callback(err, null);
      return callback(null, results[0] || null);
    }
  );
};

// ================= GET MY CHANGE REQUESTS =================
// Keep before GET /:id.

router.get("/my-requests", auth, (req, res) => {
  const sql = `
    SELECT *
    FROM content_change_requests
    WHERE entity_type = ? AND submitted_by = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [ENTITY_TYPE, req.admin.id], (err, results) => {
    if (err) {
      console.error("Faculty requests fetch error:", err);

      return res.status(500).json({
        message: "Failed to fetch faculty change requests.",
      });
    }

    return res.json(results);
  });
});

// ================= GET ALL FACULTY =================

router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM faculty ORDER BY id DESC",
    (err, results) => {
      if (err) {
        console.error("Get faculty error:", err);
        return res.status(500).json({
          message: "Database error",
        });
      }

      return res.json(results);
    }
  );
});

// ================= CREATE FACULTY =================

router.post("/", auth, upload.single("image"), (req, res) => {
  const { name, designation } = req.body;

  if (!name?.trim() || !designation?.trim()) {
    return res.status(400).json({
      message: "Name and Designation are required.",
    });
  }

  const data = buildFacultyData(
    req.body,
    req.file ? req.file.filename : null
  );

  // Regular admins submit for approval.
  if (!isSuperAdmin(req)) {
    return createChangeRequest(req, res, {
      operation: "create",
      proposedData: data,
      message: "Faculty creation submitted for approval.",
    });
  }

  // Superadmin creates directly.
  const sql = `
    INSERT INTO faculty
    (name, designation, area_of_expertise, image)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      data.name,
      data.designation,
      data.area_of_expertise,
      data.image,
    ],
    (err, result) => {
      if (err) {
        console.error("Create faculty error:", err);
        return res.status(500).json({
          message: "Failed to add faculty.",
        });
      }

      return res.status(201).json({
        message: "Faculty added successfully.",
        id: result.insertId,
      });
    }
  );
});

// ================= GET SINGLE FACULTY =================

router.get("/:id", (req, res) => {
  getFacultyById(req.params.id, (err, faculty) => {
    if (err) {
      console.error("Get single faculty error:", err);
      return res.status(500).json({
        message: "Database error",
      });
    }

    if (!faculty) {
      return res.status(404).json({
        message: "Faculty not found.",
      });
    }

    return res.json(faculty);
  });
});

// ================= UPDATE FACULTY =================

router.put("/:id", auth, upload.single("image"), (req, res) => {
  const id = req.params.id;
  const { name, designation } = req.body;

  if (!name?.trim() || !designation?.trim()) {
    return res.status(400).json({
      message: "Name and Designation are required.",
    });
  }

  getFacultyById(id, (err, existingFaculty) => {
    if (err) {
      console.error("Find faculty error:", err);
      return res.status(500).json({
        message: "Database error",
      });
    }

    if (!existingFaculty) {
      return res.status(404).json({
        message: "Faculty not found.",
      });
    }

    const image = req.file
      ? req.file.filename
      : existingFaculty.image;

    const data = buildFacultyData(req.body, image);

    // Regular admins submit for approval.
    if (!isSuperAdmin(req)) {
      return createChangeRequest(req, res, {
        recordId: id,
        operation: "update",
        proposedData: data,
        originalData: existingFaculty,
        message: "Faculty update submitted for approval.",
      });
    }

    // Superadmin updates directly.
    const sql = `
      UPDATE faculty
      SET name = ?,
          designation = ?,
          area_of_expertise = ?,
          image = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        data.name,
        data.designation,
        data.area_of_expertise,
        data.image,
        id,
      ],
      (updateErr) => {
        if (updateErr) {
          console.error("Update faculty error:", updateErr);
          return res.status(500).json({
            message: "Update failed.",
          });
        }

        return res.json({
          message: "Faculty updated successfully.",
        });
      }
    );
  });
});

// ================= DELETE FACULTY =================

router.delete("/:id", auth, (req, res) => {
  const id = req.params.id;

  getFacultyById(id, (err, existingFaculty) => {
    if (err) {
      console.error("Find faculty for deletion error:", err);
      return res.status(500).json({
        message: "Database error",
      });
    }

    if (!existingFaculty) {
      return res.status(404).json({
        message: "Faculty not found.",
      });
    }

    // Regular admins submit for approval.
    if (!isSuperAdmin(req)) {
      return createChangeRequest(req, res, {
        recordId: id,
        operation: "delete",
        proposedData: { id: Number(id) },
        originalData: existingFaculty,
        message: "Faculty deletion submitted for approval.",
      });
    }

    // Superadmin deletes directly.
    db.query(
      "DELETE FROM faculty WHERE id = ?",
      [id],
      (deleteErr, result) => {
        if (deleteErr) {
          console.error("Delete faculty error:", deleteErr);
          return res.status(500).json({
            message: "Delete failed.",
          });
        }

        if (!result.affectedRows) {
          return res.status(404).json({
            message: "Faculty not found.",
          });
        }

        return res.json({
          message: "Faculty deleted successfully.",
        });
      }
    );
  });
});

module.exports = router;
