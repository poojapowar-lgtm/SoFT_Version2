const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const {
  sendApprovalNotification,
  sendSubmissionConfirmation,
} = require("../utils/mailer");


// ================= FILE UPLOAD CONFIG =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({ storage });

const getRole = (req) => req.admin?.role;


// ================= APPROVAL REQUEST HELPER =================
const submitApprovalRequest = (
  {
    recordId = null,
    operation,
    proposedData,
    originalData = null,
  },
  adminId,
  res,
  successMessage
) => {
  db.query(
    `INSERT INTO content_change_requests
    (entity_type, record_id, operation, proposed_data,
     original_data, status, submitted_by)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [
      "academic_calendar",
      recordId,
      operation,
      JSON.stringify(proposedData),
      originalData === null
        ? null
        : JSON.stringify(originalData),
      adminId,
    ],
    async (err, result) => {
      if (err) {
        console.error("Academic calendar approval error:", err);

        return res.status(500).json({
          message: "Failed to submit the request for approval.",
        });
      }

      const requestId = result.insertId;

      // Return success after the request is saved.
      res.status(202).json({
        message: successMessage,
        requestId,
        status: "pending",
      });

      // Fetch the submitting admin's email.
      db.query(
        "SELECT email FROM admins WHERE id = ? LIMIT 1",
        [adminId],
        async (adminError, adminRows) => {
          if (adminError) {
            console.error(
              "Failed to fetch submitting admin email:",
              adminError.message
            );
            return;
          }

          const adminEmail = adminRows?.[0]?.email;

          // Notify the superadmin.
          try {
            await sendApprovalNotification({
              requestId,
              entityType: "academic_calendar",
              operation,
              requestedBy: adminEmail || `Admin ID: ${adminId}`,
            });
          } catch (emailError) {
            console.error(
              "Superadmin notification failed:",
              emailError.message
            );
          }

          // Notify the submitting admin.
          if (!adminEmail) {
            console.error(
              `No email found for submitting admin ID: ${adminId}`
            );
            return;
          }

          try {
            await sendSubmissionConfirmation({
              adminEmail,
              requestId,
              entityType: "academic_calendar",
              operation,
            });
          } catch (emailError) {
            console.error(
              "Submitting admin confirmation failed:",
              emailError.message
            );
          }
        }
      );
    }
  );
};


// ================= CREATE MANUAL ENTRY =================
router.post("/", auth, (req, res) => {
  const { sr_no, program_name, date_and_event } = req.body;
  const role = getRole(req);

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  if (!program_name || !String(program_name).trim()) {
    return res.status(400).json({
      message: "Program name is required.",
    });
  }

  const proposedData = {
    sr_no: sr_no === "" || sr_no == null ? null : Number(sr_no),
    program_name: String(program_name).trim(),
    date_and_event: date_and_event || "",
  };

  if (
    proposedData.sr_no !== null &&
    !Number.isFinite(proposedData.sr_no)
  ) {
    return res.status(400).json({
      message: "Sr. No. must be a valid number.",
    });
  }

  // ADMIN: Submit for approval.
  if (role === "admin") {
    return submitApprovalRequest(
      {
        operation: "create",
        proposedData,
      },
      req.admin.id,
      res,
      "Academic calendar entry submitted for superadmin approval."
    );
  }

  // SUPERADMIN: Publish immediately.
  db.query(
    `INSERT INTO academic_calendar
      (sr_no, program_name, date_and_event)
     VALUES (?, ?, ?)`,
    [
      proposedData.sr_no,
      proposedData.program_name,
      proposedData.date_and_event,
    ],
    (err, result) => {
      if (err) {
        console.error("Create academic calendar error:", err);

        return res.status(500).json({
          message: "Failed to add academic calendar entry.",
        });
      }

      return res.status(201).json({
        message: "Academic calendar entry published successfully.",
        id: result.insertId,
        status: "published",
      });
    }
  );
});

// ================= GET ALL PUBLISHED RECORDS =================
router.get("/", (req, res) => {
  db.query(
    `SELECT * FROM academic_calendar
     ORDER BY sr_no ASC, id ASC`,
    (err, results) => {
      if (err) {
        console.error("Fetch academic calendar error:", err);

        return res.status(500).json({
          message: "Failed to fetch academic calendar.",
        });
      }

      return res.json(results);
    }
  );
});

// ================= GET MY APPROVAL REQUESTS =================
router.get("/my-requests", auth, (req, res) => {
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
       AND entity_type = 'academic_calendar'
     ORDER BY id DESC`,
    [req.admin.id],
    (err, results) => {
      if (err) {
        console.error("Fetch calendar requests error:", err);

        return res.status(500).json({
          message: "Failed to fetch approval requests.",
        });
      }

      return res.json({ requests: results });
    }
  );
});

// ================= EXCEL UPLOAD =================
router.post(
  "/upload-excel",
  auth,
  upload.single("file"),
  (req, res) => {
    const role = getRole(req);

    if (!["admin", "superadmin"].includes(role)) {
      if (req.file) fs.unlink(req.file.path, () => { });

      return res.status(403).json({
        message: "Access denied.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded.",
      });
    }

    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        fs.unlink(req.file.path, () => { });

        return res.status(400).json({
          message: "Excel worksheet not found.",
        });
      }

      const rows = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });

      // Excel columns:
      // Sr. No. | Name of the Program | Date and Event

      const dataRows = rows
        .slice(1)
        .filter((row) =>
          row.some((cell) => String(cell).trim() !== "")
        );

      const records = [];

      for (let index = 0; index < dataRows.length; index++) {
        const row = dataRows[index];

        const rawSrNo = row[0];
        const programName = String(row[1] ?? "").trim();
        const dateAndEvent = String(row[2] ?? "");

        if (!programName) {
          continue;
        }

        let srNo = null;

        if (String(rawSrNo).trim() !== "") {
          srNo = Number(rawSrNo);

          if (!Number.isFinite(srNo)) {
            fs.unlink(req.file.path, () => { });

            return res.status(400).json({
              message: `Invalid Sr. No. at Excel row ${index + 2}.`,
            });
          }
        }

        records.push({
          sr_no: srNo,
          program_name: programName,
          date_and_event: dateAndEvent,
        });
      }

      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Excel file cleanup error:", unlinkErr);
        }
      });

      if (records.length === 0) {
        return res.status(400).json({
          message: "No valid data found in Excel.",
        });
      }

      // ADMIN: Submit all imported rows as one approval request.
      if (role === "admin") {
        return submitApprovalRequest(
          {
            operation: "bulk_create",
            proposedData: { records },
          },
          req.admin.id,
          res,
          "Academic calendar Excel data submitted for superadmin approval."
        );
      }

      // SUPERADMIN: Insert imported rows immediately.
      const values = records.map((record) => [
        record.sr_no,
        record.program_name,
        record.date_and_event,
      ]);

      db.query(
        `INSERT INTO academic_calendar
          (sr_no, program_name, date_and_event)
         VALUES ?`,
        [values],
        (err, result) => {
          if (err) {
            console.error("Excel insert error:", err);

            return res.status(500).json({
              message: "Failed to import academic calendar data.",
            });
          }

          return res.status(201).json({
            message: "Academic calendar Excel uploaded successfully.",
            insertedRows: result.affectedRows,
            status: "published",
          });
        }
      );
    } catch (err) {
      console.error("Excel processing error:", err);

      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }

      return res.status(500).json({
        message: "Error processing Excel file.",
      });
    }
  }
);

// ================= DELETE ALL =================
// Keep this route before /:id.
router.delete("/delete-all", auth, (req, res) => {
  const role = getRole(req);

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  db.query(
    "SELECT * FROM academic_calendar",
    (findErr, records) => {
      if (findErr) {
        console.error("Fetch records before delete-all error:", findErr);

        return res.status(500).json({
          message: "Failed to retrieve academic calendar records.",
        });
      }

      if (records.length === 0) {
        return res.status(404).json({
          message: "No academic calendar records found.",
        });
      }

      // ADMIN: Request bulk deletion.
      if (role === "admin") {
        return submitApprovalRequest(
          {
            operation: "delete_all",
            proposedData: {
              ids: records.map((record) => record.id),
            },
            originalData: records,
          },
          req.admin.id,
          res,
          "Delete-all request submitted for superadmin approval."
        );
      }

      // SUPERADMIN: Delete immediately.
      db.query(
        "DELETE FROM academic_calendar",
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Delete all calendar error:", deleteErr);

            return res.status(500).json({
              message: "Failed to delete academic calendar records.",
            });
          }

          return res.json({
            message: "All academic calendar records deleted successfully.",
            deletedCount: result.affectedRows,
            status: "published",
          });
        }
      );
    }
  );
});

// ================= GET RECORD BY ID =================
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid academic calendar ID.",
    });
  }

  db.query(
    "SELECT * FROM academic_calendar WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("Fetch calendar record error:", err);

        return res.status(500).json({
          message: "Failed to fetch academic calendar record.",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Academic calendar record not found.",
        });
      }

      return res.json(results[0]);
    }
  );
});

// ================= UPDATE RECORD =================
router.put("/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const role = getRole(req);
  const { sr_no, program_name, date_and_event } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid academic calendar ID.",
    });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  db.query(
    "SELECT * FROM academic_calendar WHERE id = ?",
    [id],
    (findErr, rows) => {
      if (findErr) {
        console.error("Find calendar record error:", findErr);

        return res.status(500).json({
          message: "Failed to retrieve academic calendar record.",
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Academic calendar record not found.",
        });
      }

      const originalData = rows[0];

      const proposedData = {
        sr_no:
          sr_no !== undefined
            ? sr_no === "" || sr_no === null
              ? null
              : Number(sr_no)
            : originalData.sr_no,

        program_name:
          program_name !== undefined
            ? String(program_name).trim()
            : originalData.program_name,

        date_and_event:
          date_and_event !== undefined
            ? date_and_event
            : originalData.date_and_event,
      };

      if (
        proposedData.sr_no !== null &&
        !Number.isFinite(proposedData.sr_no)
      ) {
        return res.status(400).json({
          message: "Sr. No. must be a valid number.",
        });
      }

      if (!proposedData.program_name) {
        return res.status(400).json({
          message: "Program name is required.",
        });
      }

      // ADMIN: Submit changes for approval.
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
          "Academic calendar update submitted for superadmin approval."
        );
      }

      // SUPERADMIN: Update immediately.
      db.query(
        `UPDATE academic_calendar
         SET sr_no = ?, program_name = ?, date_and_event = ?
         WHERE id = ?`,
        [
          proposedData.sr_no,
          proposedData.program_name,
          proposedData.date_and_event,
          id,
        ],
        (updateErr) => {
          if (updateErr) {
            console.error("Update calendar record error:", updateErr);

            return res.status(500).json({
              message: "Failed to update academic calendar record.",
            });
          }

          return res.json({
            message: "Academic calendar updated and published.",
            status: "published",
          });
        }
      );
    }
  );
});

// ================= DELETE SINGLE RECORD =================
router.delete("/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const role = getRole(req);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid academic calendar ID.",
    });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  db.query(
    "SELECT * FROM academic_calendar WHERE id = ?",
    [id],
    (findErr, rows) => {
      if (findErr) {
        console.error("Find record before delete error:", findErr);

        return res.status(500).json({
          message: "Failed to retrieve academic calendar record.",
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Academic calendar record not found.",
        });
      }

      const originalData = rows[0];

      // ADMIN: Request deletion.
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
          "Academic calendar deletion submitted for superadmin approval."
        );
      }

      // SUPERADMIN: Delete immediately.
      db.query(
        "DELETE FROM academic_calendar WHERE id = ?",
        [id],
        (deleteErr) => {
          if (deleteErr) {
            console.error("Delete calendar record error:", deleteErr);

            return res.status(500).json({
              message: "Failed to delete academic calendar record.",
            });
          }

          return res.json({
            message: "Academic calendar record deleted successfully.",
            status: "published",
          });
        }
      );
    }
  );
});

module.exports = router;
