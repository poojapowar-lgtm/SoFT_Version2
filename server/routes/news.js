
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");
const multer = require("multer");
const path = require("path");

const {
  sendApprovalNotification,
  sendSubmissionConfirmation,
} = require("../utils/mailer");

// ================= FILE UPLOAD =================
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );
    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({ storage });

const getRole = (req) => req.admin?.role;

const submitApprovalRequest = (
  { recordId = null, operation, proposedData, originalData = null },
  adminId,
  res,
  successMessage
) => {
  db.query(
    `INSERT INTO content_change_requests
    (
      entity_type,
      record_id,
      operation,
      proposed_data,
      original_data,
      status,
      submitted_by
    )
    VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [
      "news",
      recordId,
      operation,
      JSON.stringify(proposedData),
      originalData === null ? null : JSON.stringify(originalData),
      adminId,
    ],
    (err, result) => {
      if (err) {
        console.error("Approval request error:", err);

        return res.status(500).json({
          message: "Failed to submit the request for approval.",
        });
      }

      const requestId = result.insertId;

      res.status(202).json({
        message: successMessage,
        requestId,
        status: "pending",
      });

      // Get the submitting admin's email.
      db.query(
        "SELECT email FROM admins WHERE id = ? LIMIT 1",
        [adminId],
        (adminErr, adminRows) => {
          if (adminErr) {
            console.error(
              "Failed to retrieve submitting admin email:",
              adminErr.message
            );
          }

          const adminEmail = adminRows?.[0]?.email;

          // 1. Notify Super Admin.
          sendApprovalNotification({
            requestId,
            entityType: "news",
            operation,
            requestedBy: adminEmail || `Admin ID: ${adminId}`,
          }).catch((emailError) => {
            console.error(
              "News approval notification failed:",
              emailError.message
            );
          });

          // 2. Confirm submission to the requesting admin.
          if (!adminEmail) {
            console.error(
              `News request ${requestId}: submitting admin email is missing.`
            );
            return;
          }

          sendSubmissionConfirmation({
            adminEmail,
            requestId,
            entityType: "news",
            operation,
          }).catch((emailError) => {
            console.error(
              "News submission confirmation failed:",
              emailError.message
            );
          });
        }
      );
    }
  );
};

// ================= CREATE NEWS =================
router.post("/", auth, upload.single("file"), (req, res) => {
  const { title, date, link_text, link_url, category } = req.body;
  const role = getRole(req);

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Title is required." });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({ message: "Access denied." });
  }

  const proposedData = {
    title: title.trim(),
    date: date || null,
    file_path: req.file ? "/uploads/" + req.file.filename : null,
    link_text: link_text || "",
    link_url: link_url || "",
    category: category || "admission",
  };

  // Admin: save as a pending request only.
  if (role === "admin") {
    return submitApprovalRequest(
      {
        operation: "create",
        proposedData,
      },
      req.admin.id,
      res,
      "News submitted for superadmin approval."
    );
  }

  // Superadmin: publish immediately.
  db.query(
    `INSERT INTO news
      (title, date, file_path, link_text, link_url, category)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      proposedData.title,
      proposedData.date,
      proposedData.file_path,
      proposedData.link_text,
      proposedData.link_url,
      proposedData.category,
    ],
    (err, result) => {
      if (err) {
        console.error("Create news error:", err);
        return res.status(500).json({
          message: "Failed to publish news.",
        });
      }

      return res.status(201).json({
        message: "News published successfully.",
        id: result.insertId,
        status: "published",
      });
    }
  );
});

// ================= GET PUBLISHED NEWS =================
router.get("/", (req, res) => {
  const { type } = req.query;

  let query = "SELECT * FROM news";
  const params = [];

  if (type) {
    query += " WHERE category = ?";
    params.push(type);
  }

  query += " ORDER BY id DESC";

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Fetch news error:", err);
      return res.status(500).json({
        message: "Failed to fetch news.",
      });
    }

    return res.json(results);
  });
});


// GET approval requests submitted by the logged-in admin
router.get("/my-requests", auth, (req, res) => {
  const adminId = req.admin.id;

  db.query(
    `SELECT
       id,
       entity_type,
       record_id,
       operation,
       proposed_data,
       original_data,
       status,
       submitted_by,
       reviewed_by,
       review_comment,
       submitted_at,
       reviewed_at
     FROM content_change_requests
     WHERE submitted_by = ?
       AND entity_type = 'news'
     ORDER BY id DESC`,
    [adminId],
    (err, results) => {
      if (err) {
        console.error("Fetch news requests error:", err);
        return res.status(500).json({
          message: "Failed to fetch news approval requests.",
        });
      }

      return res.json({ requests: results });
    }
  );
});


// ================= UPDATE NEWS =================
router.put("/:id", auth, upload.single("file"), (req, res) => {
  const id = Number(req.params.id);
  const role = getRole(req);
  const { title, date, link_text, link_url, category } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid news ID." });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({ message: "Access denied." });
  }

  db.query(
    "SELECT * FROM news WHERE id = ?",
    [id],
    (findErr, rows) => {
      if (findErr) {
        console.error("Find news error:", findErr);
        return res.status(500).json({
          message: "Failed to retrieve news.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "News not found." });
      }

      const originalData = rows[0];

      const proposedData = {
        title:
          title !== undefined ? title.trim() : originalData.title,
        date: date !== undefined ? date : originalData.date,
        file_path: req.file
          ? "/uploads/" + req.file.filename
          : originalData.file_path,
        link_text:
          link_text !== undefined
            ? link_text
            : originalData.link_text,
        link_url:
          link_url !== undefined
            ? link_url
            : originalData.link_url,
        category:
          category !== undefined
            ? category
            : originalData.category,
      };

      if (!proposedData.title) {
        return res.status(400).json({
          message: "Title is required.",
        });
      }

      // Admin: submit proposed changes; do not update live news.
      if (role === "admin") {
        return submitApprovalRequest(
          {
            recordId: id,
            operation: "update",
            proposedData,
            originalData,
          },
          req.admin.id,
          res,
          "News update submitted for superadmin approval."
        );
      }

      // Superadmin: update published news immediately.
      db.query(
        `UPDATE news
         SET title = ?, date = ?, file_path = ?,
             link_text = ?, link_url = ?, category = ?
         WHERE id = ?`,
        [
          proposedData.title,
          proposedData.date,
          proposedData.file_path,
          proposedData.link_text,
          proposedData.link_url,
          proposedData.category,
          id,
        ],
        (updateErr) => {
          if (updateErr) {
            console.error("Update news error:", updateErr);
            return res.status(500).json({
              message: "Failed to update news.",
            });
          }

          return res.json({
            message: "News updated and published.",
            status: "published",
          });
        }
      );
    }
  );
});

// ================= DELETE NEWS =================
router.delete("/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const role = getRole(req);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid news ID." });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({ message: "Access denied." });
  }

  db.query(
    "SELECT * FROM news WHERE id = ?",
    [id],
    (findErr, rows) => {
      if (findErr) {
        console.error("Find news error:", findErr);
        return res.status(500).json({
          message: "Failed to retrieve news.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "News not found." });
      }

      const originalData = rows[0];

      // Admin: request deletion; keep published news unchanged.
      if (role === "admin") {
        return submitApprovalRequest(
          {
            recordId: id,
            operation: "delete",
            proposedData: { id },
            originalData,
          },
          req.admin.id,
          res,
          "News deletion submitted for superadmin approval."
        );
      }

      // Superadmin: delete immediately.
      db.query(
        "DELETE FROM news WHERE id = ?",
        [id],
        (deleteErr) => {
          if (deleteErr) {
            console.error("Delete news error:", deleteErr);
            return res.status(500).json({
              message: "Failed to delete news.",
            });
          }

          return res.json({
            message: "News deleted successfully.",
            status: "published",
          });
        }
      );
    }
  );
});

module.exports = router;
