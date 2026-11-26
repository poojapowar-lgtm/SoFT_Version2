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
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "");
    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({ storage }).fields([
  { name: "files", maxCount: 10 },
  { name: "doc", maxCount: 1 },
]);

const ENTITY_TYPE = "upcoming_events";

// ================= HELPER: SAVE CHANGE REQUEST =================
const saveChangeRequest = (
  entityType,
  recordId,
  operation,
  proposedData,
  originalData,
  submittedBy,
  res
) => {
  db.query(
    `INSERT INTO content_change_requests
    (entity_type, record_id, operation, proposed_data,
     original_data, status, submitted_by)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [
      entityType,
      recordId || null,
      operation,
      proposedData != null ? JSON.stringify(proposedData) : null,
      originalData != null ? JSON.stringify(originalData) : null,
      submittedBy,
    ],
    (err, result) => {
      if (err) {
        console.error("Error saving event change request:", err);

        return res.status(500).json({
          message: "Failed to submit event change request",
          error: err.message,
        });
      }

      const requestId = result.insertId;

      res.status(201).json({
        message: "Event change request submitted for approval",
        requestId,
        status: "pending",
      });

      // Look up the submitting admin's registered email.
      db.query(
        "SELECT email FROM admins WHERE id = ? LIMIT 1",
        [submittedBy],
        async (adminError, adminRows) => {
          if (adminError) {
            console.error(
              "Failed to fetch submitting admin email:",
              adminError.message
            );
            return;
          }

          const adminEmail = adminRows?.[0]?.email;

          // 1. Notify the Super Admin.
          try {
            await sendApprovalNotification({
              requestId,
              entityType: entityType || "upcoming_events",
              operation,
              requestedBy: adminEmail || `Admin ID: ${submittedBy}`,
            });
          } catch (emailError) {
            console.error(
              "Event superadmin notification failed:",
              emailError.message
            );
          }

          // 2. Send confirmation to the submitting admin.
          if (!adminEmail) {
            console.error(
              `No email found for submitting admin ID: ${submittedBy}`
            );
            return;
          }

          try {
            await sendSubmissionConfirmation({
              adminEmail,
              requestId,
              entityType: entityType || "upcoming_events",
              operation,
            });
          } catch (emailError) {
            console.error(
              "Event submitter confirmation failed:",
              emailError.message
            );
          }
        }
      );
    }
  );
};


// ================= CREATE EVENT =================
router.post("/", auth, upload, (req, res) => {
  const { title, date, description, link_text, link_url } = req.body;

  const file_path = req.files?.files?.length
    ? JSON.stringify(
      req.files.files.map((file) => `/uploads/${file.filename}`)
    )
    : null;

  const doc_path = req.files?.doc?.length
    ? `/uploads/${req.files.doc[0].filename}`
    : null;

  const proposedData = {
    title,
    date,
    description,
    file_path,
    doc_path,
    link_text,
    link_url,
  };

  // Admin: submit for approval
  if (req.admin?.role !== "superadmin") {
    return saveChangeRequest(
      ENTITY_TYPE,
      null,
      "create",
      proposedData,
      null,
      req.admin.id,
      res
    );
  }

  // Superadmin: insert directly
  db.query(
    `INSERT INTO upcoming_events
      (title, date, description, file_path, doc_path, link_text, link_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      date,
      description,
      file_path,
      doc_path,
      link_text,
      link_url,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to create event",
          error: err.message,
        });
      }

      res.status(201).json({
        message: "Event added successfully",
        id: result.insertId,
      });
    }
  );
});

// ================= GET ALL PUBLISHED EVENTS =================
router.get("/", (req, res) => {
  db.query("SELECT * FROM upcoming_events ORDER BY id DESC", (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch upcoming_events",
        error: err.message,
      });
    }

    res.json(result);
  });
});

// ================= GET CURRENT ADMIN'S REQUESTS =================
router.get("/my-requests", auth, (req, res) => {
  db.query(
    `SELECT *
     FROM content_change_requests
     WHERE entity_type = ?
       AND submitted_by = ?
     ORDER BY created_at DESC`,
    [ENTITY_TYPE, req.admin.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch event change requests",
          error: err.message,
        });
      }

      res.json(result);
    }
  );
});

// ================= UPDATE EVENT =================
router.put("/:id", auth, upload, (req, res) => {
  const eventId = req.params.id;

  // Fetch the original event first
  db.query(
    "SELECT * FROM upcoming_events WHERE id = ?",
    [eventId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch event",
          error: err.message,
        });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "Event not found" });
      }

      const originalData = rows[0];

      const title =
        req.body.title !== undefined
          ? req.body.title
          : originalData.title;

      const date =
        req.body.date !== undefined
          ? req.body.date
          : originalData.date;

      const description =
        req.body.description !== undefined
          ? req.body.description
          : originalData.description;

      const link_text =
        req.body.link_text !== undefined
          ? req.body.link_text
          : originalData.link_text;

      const link_url =
        req.body.link_url !== undefined
          ? req.body.link_url
          : originalData.link_url;

      const file_path = req.files?.files?.length
        ? JSON.stringify(
          req.files.files.map((file) => `/uploads/${file.filename}`)
        )
        : req.body.file_path !== undefined
          ? req.body.file_path
          : originalData.file_path;

      const doc_path = req.files?.doc?.length
        ? `/uploads/${req.files.doc[0].filename}`
        : req.body.doc_path !== undefined
          ? req.body.doc_path
          : originalData.doc_path;

      const proposedData = {
        title,
        date,
        description,
        file_path,
        doc_path,
        link_text,
        link_url,
      };

      // Admin: submit update for approval
      if (req.admin?.role !== "superadmin") {
        return saveChangeRequest(
          ENTITY_TYPE,
          eventId,
          "update",
          proposedData,
          originalData,
          req.admin.id,
          res
        );
      }

      // Superadmin: update live event directly
      db.query(
        `UPDATE upcoming_events
         SET title = ?, date = ?, description = ?, file_path = ?,
             doc_path = ?, link_text = ?, link_url = ?
         WHERE id = ?`,
        [
          title,
          date,
          description,
          file_path,
          doc_path,
          link_text,
          link_url,
          eventId,
        ],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({
              message: "Failed to update event",
              error: updateErr.message,
            });
          }

          res.json({ message: "Event updated successfully" });
        }
      );
    }
  );
});

// ================= DELETE EVENT =================
router.delete("/:id", auth, (req, res) => {
  const eventId = req.params.id;

  // Fetch original event before deletion or request submission
  db.query(
    "SELECT * FROM upcoming_events WHERE id = ?",
    [eventId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch event",
          error: err.message,
        });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "Event not found" });
      }

      const originalData = rows[0];

      // Admin: submit deletion for approval
      if (req.admin?.role !== "superadmin") {
        return saveChangeRequest(
          ENTITY_TYPE,
          eventId,
          "delete",
          { id: Number(eventId) },
          originalData,
          req.admin.id,
          res
        );
      }

      // Superadmin: delete directly
      db.query(
        "DELETE FROM upcoming_events WHERE id = ?",
        [eventId],
        (deleteErr) => {
          if (deleteErr) {
            return res.status(500).json({
              message: "Failed to delete event",
              error: deleteErr.message,
            });
          }

          res.json({ message: "Event deleted successfully" });
        }
      );
    }
  );
});

module.exports = router;
