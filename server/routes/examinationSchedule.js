
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");
const multer = require("multer");
const XLSX = require("xlsx");

const {
  sendApprovalNotification,
  sendSubmissionConfirmation,
} = require("../utils/mailer");


// ================= FILE UPLOAD =================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

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
      "examination_schedule",
      recordId,
      operation,
      JSON.stringify(proposedData),
      originalData === null
        ? null
        : JSON.stringify(originalData),
      adminId,
    ],
    (err, result) => {
      if (err) {
        console.error("Examination approval request error:", err);

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

      // Find the submitting admin's registered email.
      db.query(
        "SELECT email FROM admins WHERE id = ? LIMIT 1",
        [adminId],
        async (adminError, adminRows) => {
          if (adminError) {
            console.error(
              "Failed to fetch examination submitter email:",
              adminError.message
            );
            return;
          }

          const adminEmail = adminRows?.[0]?.email;

          // 1. Send notification to the Super Admin.
          try {
            await sendApprovalNotification({
              requestId,
              entityType: "examination_schedule",
              operation,
              requestedBy: adminEmail || `Admin ID: ${adminId}`,
            });
          } catch (emailError) {
            console.error(
              "Examination superadmin notification failed:",
              emailError.message
            );
          }

          // 2. Send confirmation to the submitting admin.
          if (!adminEmail) {
            console.error(
              `No email found for admin ID: ${adminId}`
            );
            return;
          }

          try {
            await sendSubmissionConfirmation({
              adminEmail,
              requestId,
              entityType: "examination_schedule",
              operation,
            });
          } catch (emailError) {
            console.error(
              "Examination submitter confirmation failed:",
              emailError.message
            );
          }
        }
      );
    }
  );
};


// ================= CREATE EXAMINATION SCHEDULE =================
router.post("/", auth, (req, res) => {
  const {
    examination,
    odd_semester,
    even_semester,
  } = req.body;

  const role = getRole(req);

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  if (
    typeof examination !== "string" ||
    typeof odd_semester !== "string" ||
    typeof even_semester !== "string" ||
    !examination.trim() ||
    !odd_semester.trim() ||
    !even_semester.trim()
  ) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  const proposedData = {
    examination: examination.trim(),
    odd_semester: odd_semester.trim(),
    even_semester: even_semester.trim(),
  };

  // Admin: submit for approval.
  if (role === "admin") {
    return submitApprovalRequest(
      {
        operation: "create",
        proposedData,
      },
      req.admin.id,
      res,
      "Examination schedule submitted for superadmin approval."
    );
  }

  // Superadmin: publish immediately.
  db.query(
    `INSERT INTO examination_schedule
      (examination, odd_semester, even_semester)
     VALUES (?, ?, ?)`,
    [
      proposedData.examination,
      proposedData.odd_semester,
      proposedData.even_semester,
    ],
    (err, result) => {
      if (err) {
        console.error("Create examination schedule error:", err);

        return res.status(500).json({
          message: "Failed to publish examination schedule.",
        });
      }

      return res.status(201).json({
        message: "Examination schedule published successfully.",
        id: result.insertId,
        status: "published",
      });
    }
  );
});

// ================= GET PUBLISHED SCHEDULES =================
router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM examination_schedule ORDER BY id ASC",
    (err, results) => {
      if (err) {
        console.error("Fetch examination schedule error:", err);

        return res.status(500).json({
          message: "Failed to fetch examination schedules.",
        });
      }

      return res.json(results);
    }
  );
});

// ================= GET MY APPROVAL REQUESTS =================
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
       AND entity_type = 'examination_schedule'
     ORDER BY id DESC`,
    [adminId],
    (err, results) => {
      if (err) {
        console.error(
          "Fetch examination approval requests error:",
          err
        );

        return res.status(500).json({
          message: "Failed to fetch approval requests.",
        });
      }

      return res.json({
        requests: results,
      });
    }
  );
});

// ================= UPDATE EXAMINATION SCHEDULE =================
router.put("/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const role = getRole(req);

  const {
    examination,
    odd_semester,
    even_semester,
  } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid examination schedule ID.",
    });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  db.query(
    "SELECT * FROM examination_schedule WHERE id = ?",
    [id],
    (findErr, rows) => {
      if (findErr) {
        console.error("Find examination schedule error:", findErr);

        return res.status(500).json({
          message: "Failed to retrieve examination schedule.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          message: "Examination schedule not found.",
        });
      }

      const originalData = rows[0];

      const proposedData = {
        examination:
          examination !== undefined
            ? examination
            : originalData.examination,

        odd_semester:
          odd_semester !== undefined
            ? odd_semester
            : originalData.odd_semester,

        even_semester:
          even_semester !== undefined
            ? even_semester
            : originalData.even_semester,
      };

      // Validate all resulting values.
      for (const field of [
        "examination",
        "odd_semester",
        "even_semester",
      ]) {
        if (
          typeof proposedData[field] !== "string" ||
          !proposedData[field].trim()
        ) {
          return res.status(400).json({
            message: "All fields are required.",
          });
        }

        proposedData[field] = proposedData[field].trim();
      }

      // Admin: submit proposed changes for approval.
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
          "Examination schedule update submitted for superadmin approval."
        );
      }

      // Superadmin: update published schedule immediately.
      db.query(
        `UPDATE examination_schedule
         SET examination = ?,
             odd_semester = ?,
             even_semester = ?
         WHERE id = ?`,
        [
          proposedData.examination,
          proposedData.odd_semester,
          proposedData.even_semester,
          id,
        ],
        (updateErr) => {
          if (updateErr) {
            console.error(
              "Update examination schedule error:",
              updateErr
            );

            return res.status(500).json({
              message: "Failed to update examination schedule.",
            });
          }

          return res.json({
            message: "Examination schedule updated and published.",
            status: "published",
          });
        }
      );
    }
  );
});

// ================= DELETE EXAMINATION SCHEDULE =================
router.delete("/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const role = getRole(req);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid examination schedule ID.",
    });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  db.query(
    "SELECT * FROM examination_schedule WHERE id = ?",
    [id],
    (findErr, rows) => {
      if (findErr) {
        console.error("Find examination schedule error:", findErr);

        return res.status(500).json({
          message: "Failed to retrieve examination schedule.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          message: "Examination schedule not found.",
        });
      }

      const originalData = rows[0];

      // Admin: request deletion; keep published data unchanged.
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
          "Examination schedule deletion submitted for superadmin approval."
        );
      }

      // Superadmin: delete immediately.
      db.query(
        "DELETE FROM examination_schedule WHERE id = ?",
        [id],
        (deleteErr) => {
          if (deleteErr) {
            console.error(
              "Delete examination schedule error:",
              deleteErr
            );

            return res.status(500).json({
              message: "Failed to delete examination schedule.",
            });
          }

          return res.json({
            message: "Examination schedule deleted successfully.",
            status: "published",
          });
        }
      );
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
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an Excel file.",
      });
    }

    try {
      const workbook = XLSX.read(req.file.buffer, {
        type: "buffer",
      });

      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        return res.status(400).json({
          message: "The Excel file contains no worksheets.",
        });
      }

      const worksheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });

      if (rows.length === 0) {
        return res.status(400).json({
          message: "The Excel worksheet contains no data.",
        });
      }

      const normalize = (value) =>
        String(value ?? "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

      const headers = Object.keys(rows[0]);

      const examinationKey = headers.find(
        (key) => normalize(key) === "examination"
      );

      const oddKey = headers.find(
        (key) => normalize(key) === "oddsemester"
      );

      const evenKey = headers.find(
        (key) => normalize(key) === "evensemester"
      );

      if (!examinationKey || !oddKey || !evenKey) {
        return res.status(400).json({
          message:
            "Excel must contain these columns: Examination, Odd Semester, Even Semester.",
        });
      }

      const records = rows.map((row, index) => ({
        examination: String(
          row[examinationKey] ?? ""
        ).trim(),

        odd_semester: String(
          row[oddKey] ?? ""
        ).trim(),

        even_semester: String(
          row[evenKey] ?? ""
        ).trim(),

        rowNumber: index + 2,
      }));

      const invalidRow = records.find(
        (row) =>
          !row.examination ||
          !row.odd_semester ||
          !row.even_semester
      );

      if (invalidRow) {
        return res.status(400).json({
          message:
            `Missing required data in Excel row ${invalidRow.rowNumber}.`,
        });
      }

      // Admin: submit the complete Excel import for approval.
      if (role === "admin") {
        return submitApprovalRequest(
          {
            operation: "bulk_create",
            proposedData: records.map(
              ({
                examination,
                odd_semester,
                even_semester,
              }) => ({
                examination,
                odd_semester,
                even_semester,
              })
            ),
          },
          req.admin.id,
          res,
          "Examination schedules from Excel submitted for superadmin approval."
        );
      }

      // Superadmin: insert all imported records immediately.
      const values = records.map((row) => [
        row.examination,
        row.odd_semester,
        row.even_semester,
      ]);

      const sql = `
        INSERT INTO examination_schedule
          (examination, odd_semester, even_semester)
        VALUES ?
      `;

      db.query(sql, [values], (err, result) => {
        if (err) {
          console.error(
            "Excel import database error:",
            err
          );

          return res.status(500).json({
            message: "Failed to import examination schedules.",
          });
        }

        return res.status(200).json({
          message: "Examination schedules imported successfully.",
          imported: result.affectedRows,
          status: "published",
        });
      });
    } catch (err) {
      console.error("Excel parsing error:", err);

      return res.status(400).json({
        message:
          "Unable to read the Excel file. Please check its format.",
      });
    }
  }
);

module.exports = router;
