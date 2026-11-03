const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");

const {
  sendApprovalNotification,
  sendSubmissionConfirmation,
} = require("../utils/mailer");


// Define entity type for FAQ approval requests.
const ENTITY_TYPE = "faq";

// ================= HELPER: SAVE CHANGE REQUEST =================

const saveChangeRequest = (
  recordId,
  operation,
  proposedData,
  originalData,
  submittedBy,
  res
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
      ENTITY_TYPE,
      recordId ?? null,
      operation,
      proposedData == null ? null : JSON.stringify(proposedData),
      originalData == null ? null : JSON.stringify(originalData),
      submittedBy,
    ],
    (err, result) => {
      if (err) {
        console.error("Error saving FAQ change request:", err);

        return res.status(500).json({
          error: "Failed to submit FAQ change request.",
        });
      }

      const requestId = result.insertId;

      res.status(201).json({
        message: "FAQ change request submitted for approval.",
        requestId,
        status: "pending",
      });

      // Fetch the submitting admin's registered email.
      db.query(
        "SELECT email FROM admins WHERE id = ? LIMIT 1",
        [submittedBy],
        async (adminError, adminRows) => {
          if (adminError) {
            console.error(
              "Failed to fetch FAQ submitter email:",
              adminError.message
            );
          }

          const adminEmail = adminRows?.[0]?.email;

          // 1. Notify Super Admin.
          try {
            await sendApprovalNotification({
              requestId,
              entityType: ENTITY_TYPE,
              operation,
              requestedBy: adminEmail || `Admin ID: ${submittedBy}`,
            });
          } catch (emailError) {
            console.error(
              "FAQ superadmin notification failed:",
              emailError.message
            );
          }

          // 2. Confirm submission to the requesting admin.
          if (!adminEmail) {
            console.error(
              `No email found for FAQ submitting admin ID: ${submittedBy}`
            );
            return;
          }

          try {
            await sendSubmissionConfirmation({
              adminEmail,
              requestId,
              entityType: ENTITY_TYPE,
              operation,
            });
          } catch (emailError) {
            console.error(
              "FAQ submitter confirmation failed:",
              emailError.message
            );
          }
        }
      );
    }
  );
};

// ================= VALIDATE FAQ =================
const validateFAQ = (sr_no, question, answer) => {
  return (
    sr_no !== undefined &&
    sr_no !== null &&
    String(sr_no).trim() !== "" &&
    Number.isInteger(Number(sr_no)) &&
    Number(sr_no) >= 1 &&
    typeof question === "string" &&
    question.trim().length > 0 &&
    typeof answer === "string" &&
    answer.replace(/<[^>]*>/g, "").trim().length > 0
  );
};

// ================= GET ALL FAQs =================
router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM faqs ORDER BY sr_no ASC, id ASC",
    (err, result) => {
      if (err) {
        console.error("Error fetching FAQs:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json(result);
    }
  );
});

// ================= GET FAQ BY ID =================
router.get("/:id", (req, res) => {
  // Prevent this route from treating "my-requests" as an ID.
  if (req.params.id === "my-requests") {
    return res.status(404).json({ error: "FAQ not found" });
  }

  db.query(
    "SELECT * FROM faqs WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error("Error fetching FAQ:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "FAQ not found" });
      }

      res.json(result[0]);
    }
  );
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
        console.error("Error fetching FAQ requests:", err);
        return res.status(500).json({
          error: "Failed to fetch FAQ change requests.",
        });
      }

      res.json(result);
    }
  );
});

// ================= ADD FAQ =================
router.post("/", auth, (req, res) => {
  const { sr_no, question, answer } = req.body;

  if (!validateFAQ(sr_no, question, answer)) {
    return res.status(400).json({
      error: "Valid serial number, question, and answer are required.",
    });
  }

  const proposedData = {
    sr_no: Number(sr_no),
    question: question.trim(),
    answer,
  };

  // Admin: submit for approval
  if (req.admin?.role !== "superadmin") {
    return saveChangeRequest(
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
    "INSERT INTO faqs (sr_no, question, answer) VALUES (?, ?, ?)",
    [proposedData.sr_no, proposedData.question, proposedData.answer],
    (err, result) => {
      if (err) {
        console.error("Error adding FAQ:", err);
        return res.status(500).json({ error: "Insert failed" });
      }

      res.status(201).json({
        message: "FAQ added successfully",
        id: result.insertId,
      });
    }
  );
});

// ================= UPDATE FAQ =================
router.put("/:id", auth, (req, res) => {
  const { sr_no, question, answer } = req.body;
  const { id } = req.params;

  if (!validateFAQ(sr_no, question, answer)) {
    return res.status(400).json({
      error: "Valid serial number, question, and answer are required.",
    });
  }

  db.query("SELECT * FROM faqs WHERE id = ?", [id], (err, rows) => {
    if (err) {
      console.error("Error fetching FAQ:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!rows.length) {
      return res.status(404).json({ error: "FAQ not found" });
    }

    const originalData = rows[0];

    const proposedData = {
      sr_no: Number(sr_no),
      question: question.trim(),
      answer,
    };

    // Admin: submit update for approval
    if (req.admin?.role !== "superadmin") {
      return saveChangeRequest(
        id,
        "update",
        proposedData,
        originalData,
        req.admin.id,
        res
      );
    }

    // Superadmin: update directly
    db.query(
      "UPDATE faqs SET sr_no = ?, question = ?, answer = ? WHERE id = ?",
      [proposedData.sr_no, proposedData.question, proposedData.answer, id],
      (updateErr, result) => {
        if (updateErr) {
          console.error("Error updating FAQ:", updateErr);
          return res.status(500).json({ error: "Update failed" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "FAQ not found" });
        }

        res.json({ message: "FAQ updated successfully" });
      }
    );
  });
});

// ================= DELETE ALL FAQs =================
// IMPORTANT: Keep this route before DELETE /:id.
router.delete("/delete-all", auth, (req, res) => {
  db.query("SELECT * FROM faqs", (err, rows) => {
    if (err) {
      console.error("Error fetching FAQs:", err);
      return res.status(500).json({
        error: "Failed to fetch FAQs.",
      });
    }

    if (!rows.length) {
      return res.json({
        message: "No FAQs available to delete.",
        deletedCount: 0,
      });
    }

    // Admin: submit delete-all request for approval
    if (req.admin?.role !== "superadmin") {
      return saveChangeRequest(
        null,
        "delete_all",
        { ids: rows.map((faq) => faq.id) },
        rows,
        req.admin.id,
        res
      );
    }

    // Superadmin: delete all directly
    db.query("DELETE FROM faqs", (deleteErr, result) => {
      if (deleteErr) {
        console.error("Error deleting all FAQs:", deleteErr);
        return res.status(500).json({
          error: "Failed to delete all FAQs.",
        });
      }

      res.json({
        message: "All FAQs deleted successfully.",
        deletedCount: result.affectedRows,
      });
    });
  });
});

// ================= DELETE FAQ BY ID =================
router.delete("/:id", auth, (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM faqs WHERE id = ?", [id], (err, rows) => {
    if (err) {
      console.error("Error fetching FAQ:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!rows.length) {
      return res.status(404).json({ error: "FAQ not found" });
    }

    const originalData = rows[0];

    // Admin: submit deletion for approval
    if (req.admin?.role !== "superadmin") {
      return saveChangeRequest(
        id,
        "delete",
        { id: Number(id) },
        originalData,
        req.admin.id,
        res
      );
    }

    // Superadmin: delete directly
    db.query("DELETE FROM faqs WHERE id = ?", [id], (deleteErr, result) => {
      if (deleteErr) {
        console.error("Error deleting FAQ:", deleteErr);
        return res.status(500).json({ error: "Delete failed" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "FAQ not found" });
      }

      res.json({ message: "FAQ deleted successfully" });
    });
  });
});

module.exports = router;
