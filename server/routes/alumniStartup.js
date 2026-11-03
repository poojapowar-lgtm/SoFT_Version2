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


// ================= UPLOAD DIRECTORY =================
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================= FILE NAMING =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    cb(null, Date.now() + "-" + safeName);
  },
});

// ================= CERTIFICATE UPLOAD =================
const uploadCertificate = multer({
  storage,
  limits: {
    fileSize: 500 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" &&
      path.extname(file.originalname).toLowerCase() === ".pdf"
    ) {
      return cb(null, true);
    }

    cb(new Error("Only PDF certificate files are allowed."));
  },
});

// ================= EXCEL UPLOAD =================
// Separate middleware because Excel files are not PDFs.
const uploadExcel = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if ([".xlsx", ".xls"].includes(ext)) {
      return cb(null, true);
    }

    cb(new Error("Only .xlsx and .xls Excel files are allowed."));
  },
});

const getRole = (req) => req.admin?.role;

// ================= FILE CLEANUP =================
const cleanupFile = (filePath) => {
  if (!filePath) return;

  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Uploaded file cleanup error:", err);
    }
  });
};

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
      "alumni_startups",
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
        console.error("Alumni startup approval error:", err);

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

      // Fetch the submitting admin's registered email.
      db.query(
        "SELECT email FROM admins WHERE id = ? LIMIT 1",
        [adminId],
        async (adminError, adminRows) => {
          if (adminError) {
            console.error(
              "Failed to fetch alumni startup submitter email:",
              adminError.message
            );
            return;
          }

          const adminEmail = adminRows?.[0]?.email;

          // 1. Notify the Super Admin.
          try {
            await sendApprovalNotification({
              requestId,
              entityType: "alumni_startups",
              operation,
              requestedBy: adminEmail || `Admin ID: ${adminId}`,
            });
          } catch (emailError) {
            console.error(
              "Alumni startup superadmin notification failed:",
              emailError.message
            );
          }

          // 2. Confirm submission to the requesting admin.
          if (!adminEmail) {
            console.error(
              `No email found for admin ID ${adminId}`
            );
            return;
          }

          try {
            await sendSubmissionConfirmation({
              adminEmail,
              requestId,
              entityType: "alumni_startups",
              operation,
            });
          } catch (emailError) {
            console.error(
              "Alumni startup submitter confirmation failed:",
              emailError.message
            );
          }
        }
      );
    }
  );
};


// ================= CREATE MANUAL ENTRY =================
router.post(
  "/",
  auth,
  uploadCertificate.single("certificate"),
  (req, res) => {
    const {
      sr_no,
      name,
      passing_year,
      startup_name,
      contact_number,
      email,
      certificate_link,
    } = req.body;

    const role = getRole(req);

    if (!["admin", "superadmin"].includes(role)) {
      if (req.file) cleanupFile(req.file.path);

      return res.status(403).json({
        message: "Access denied.",
      });
    }

    if (!name || !String(name).trim()) {
      if (req.file) cleanupFile(req.file.path);

      return res.status(400).json({
        message: "Alumni name is required.",
      });
    }

    const parsedSrNo =
      sr_no === undefined || sr_no === ""
        ? null
        : Number(sr_no);

    if (
      parsedSrNo !== null &&
      (!Number.isInteger(parsedSrNo) || parsedSrNo < 0)
    ) {
      if (req.file) cleanupFile(req.file.path);

      return res.status(400).json({
        message: "Sr. No. must be a valid non-negative integer.",
      });
    }

    const proposedData = {
      sr_no: parsedSrNo,
      name: String(name).trim(),
      year: passing_year || null,
      startup: startup_name || "",
      contact: contact_number || "",
      email: email || "",
      certificate: req.file
        ? req.file.filename
        : certificate_link || null,
    };

    // ADMIN: Submit for superadmin approval.
    if (role === "admin") {
      return submitApprovalRequest(
        {
          operation: "create",
          proposedData,
        },
        req.admin.id,
        res,
        "Alumni startup submitted for superadmin approval."
      );
    }

    // SUPERADMIN: Publish immediately.
    db.query(
      `INSERT INTO alumni_startups
        (sr_no, name, year, startup, contact, email, certificate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        proposedData.sr_no,
        proposedData.name,
        proposedData.year,
        proposedData.startup,
        proposedData.contact,
        proposedData.email,
        proposedData.certificate,
      ],
      (err, result) => {
        if (err) {
          console.error("Alumni startup INSERT error:", err);

          return res.status(500).json({
            message: "Failed to add alumni startup.",
            error: err.sqlMessage || err.message,
          });
        }

        return res.status(201).json({
          message: "Alumni startup published successfully.",
          id: result.insertId,
          status: "published",
        });
      }
    );
  }
);

// ================= GET ALL PUBLISHED RECORDS =================
router.get("/", (req, res) => {
  const sql = `
    SELECT
      id,
      sr_no,
      name,
      year AS passing_year,
      startup AS startup_name,
      contact AS contact_number,
      email,
      certificate AS certificate_file,
      created_at
    FROM alumni_startups
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Alumni startup SELECT error:", err);

      return res.status(500).json({
        message: "Failed to fetch alumni startups.",
        error: err.sqlMessage || err.message,
      });
    }

    return res.json(results);
  });
});

// ================= MY APPROVAL REQUESTS =================
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
       AND entity_type = 'alumni_startups'
     ORDER BY id DESC`,
    [req.admin.id],
    (err, results) => {
      if (err) {
        console.error("Alumni startup requests error:", err);

        return res.status(500).json({
          message: "Failed to fetch alumni startup approval requests.",
        });
      }

      return res.json({
        requests: results,
      });
    }
  );
});

// ================= EXCEL UPLOAD =================
router.post(
  "/upload-excel",
  auth,
  uploadExcel.single("file"),
  (req, res) => {
    const role = getRole(req);

    if (!["admin", "superadmin"].includes(role)) {
      if (req.file) cleanupFile(req.file.path);

      return res.status(403).json({
        message: "Access denied.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No Excel file uploaded.",
      });
    }

    const filePath = req.file.path;

    try {
      const workbook = xlsx.readFile(filePath);

      if (!workbook.SheetNames.length) {
        cleanupFile(filePath);

        return res.status(400).json({
          message: "Excel file contains no worksheets.",
        });
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      // Expected columns:
      // Sr No | Name | Year | Startup | Contact | Email | Certificate Link

      const dataRows = rows
        .slice(1)
        .filter((row) => String(row[1] ?? "").trim());

      if (!dataRows.length) {
        cleanupFile(filePath);

        return res.status(400).json({
          message: "No valid data found. Check the Excel headers and rows.",
        });
      }

      const records = [];

      for (let index = 0; index < dataRows.length; index++) {
        const row = dataRows[index];

        const srNoValue = String(row[0] ?? "").trim();
        const name = String(row[1] ?? "").trim();
        const yearValue = String(row[2] ?? "").trim();

        let srNo;

        if (srNoValue === "") {
          srNo = index + 1;
        } else if (/^\d+$/.test(srNoValue)) {
          srNo = Number(srNoValue);
        } else {
          cleanupFile(filePath);

          return res.status(400).json({
            message: `Invalid Sr. No. at Excel row ${index + 2}.`,
          });
        }

        records.push({
          sr_no: srNo,
          name,
          year: yearValue || null,
          startup: String(row[3] ?? "").trim(),
          contact: String(row[4] ?? "").trim(),
          email: String(row[5] ?? "").trim(),
          certificate: String(row[6] ?? "").trim() || null,
        });
      }

      cleanupFile(filePath);

      // ADMIN: Store all rows in a single approval request.
      if (role === "admin") {
        return submitApprovalRequest(
          {
            operation: "bulk_create",
            proposedData: { records },
          },
          req.admin.id,
          res,
          "Alumni startup Excel data submitted for superadmin approval."
        );
      }

      // SUPERADMIN: Insert immediately.
      const values = records.map((record) => [
        record.sr_no,
        record.name,
        record.year,
        record.startup,
        record.contact,
        record.email,
        record.certificate,
      ]);

      db.query(
        `INSERT INTO alumni_startups
          (sr_no, name, year, startup, contact, email, certificate)
         VALUES ?`,
        [values],
        (err, result) => {
          if (err) {
            console.error("Alumni startup Excel INSERT error:", err);

            return res.status(500).json({
              message: "Excel database insert failed.",
              error: err.sqlMessage || err.message,
              code: err.code,
            });
          }

          return res.status(201).json({
            message: "Alumni startup Excel uploaded successfully.",
            inserted: result.affectedRows,
            status: "published",
          });
        }
      );
    } catch (err) {
      cleanupFile(filePath);

      console.error("Alumni startup Excel processing error:", err);

      return res.status(500).json({
        message: "Error processing Excel file.",
        error: err.message,
      });
    }
  }
);

// ================= UPDATE =================
router.put(
  "/:id",
  auth,
  uploadCertificate.single("certificate"),
  (req, res) => {
    const id = Number(req.params.id);
    const role = getRole(req);

    const {
      sr_no,
      name,
      passing_year,
      startup_name,
      contact_number,
      email,
      certificate_link,
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      if (req.file) cleanupFile(req.file.path);

      return res.status(400).json({
        message: "Invalid alumni startup ID.",
      });
    }

    if (!["admin", "superadmin"].includes(role)) {
      if (req.file) cleanupFile(req.file.path);

      return res.status(403).json({
        message: "Access denied.",
      });
    }

    db.query(
      "SELECT * FROM alumni_startups WHERE id = ?",
      [id],
      (findErr, rows) => {
        if (findErr) {
          if (req.file) cleanupFile(req.file.path);

          console.error("Find alumni startup error:", findErr);

          return res.status(500).json({
            message: "Failed to retrieve alumni startup.",
          });
        }

        if (!rows.length) {
          if (req.file) cleanupFile(req.file.path);

          return res.status(404).json({
            message: "Alumni startup record not found.",
          });
        }

        const originalData = rows[0];

        const parsedSrNo =
          sr_no === undefined
            ? originalData.sr_no
            : sr_no === ""
              ? null
              : Number(sr_no);

        if (
          parsedSrNo !== null &&
          (!Number.isInteger(parsedSrNo) || parsedSrNo < 0)
        ) {
          if (req.file) cleanupFile(req.file.path);

          return res.status(400).json({
            message: "Sr. No. must be a valid non-negative integer.",
          });
        }

        const proposedData = {
          sr_no: parsedSrNo,
          name:
            name !== undefined
              ? String(name).trim()
              : originalData.name,
          year:
            passing_year !== undefined
              ? passing_year || null
              : originalData.year,
          startup:
            startup_name !== undefined
              ? startup_name
              : originalData.startup,
          contact:
            contact_number !== undefined
              ? contact_number
              : originalData.contact,
          email:
            email !== undefined
              ? email
              : originalData.email,
          certificate: req.file
            ? req.file.filename
            : certificate_link !== undefined
              ? certificate_link || null
              : originalData.certificate,
        };

        if (!proposedData.name) {
          if (req.file) cleanupFile(req.file.path);

          return res.status(400).json({
            message: "Alumni name is required.",
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
            "Alumni startup update submitted for superadmin approval."
          );
        }

        // SUPERADMIN: Update immediately.
        db.query(
          `UPDATE alumni_startups
           SET sr_no = ?, name = ?, year = ?, startup = ?,
               contact = ?, email = ?, certificate = ?
           WHERE id = ?`,
          [
            proposedData.sr_no,
            proposedData.name,
            proposedData.year,
            proposedData.startup,
            proposedData.contact,
            proposedData.email,
            proposedData.certificate,
            id,
          ],
          (updateErr) => {
            if (updateErr) {
              console.error("Alumni startup UPDATE error:", updateErr);

              return res.status(500).json({
                message: "Update failed.",
                error: updateErr.sqlMessage || updateErr.message,
              });
            }

            return res.json({
              message: "Alumni startup updated and published.",
              status: "published",
            });
          }
        );
      }
    );
  }
);

// ================= DELETE ALL =================
// Keep before DELETE /:id.
router.delete("/delete-all", auth, (req, res) => {
  const role = getRole(req);

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  db.query(
    "SELECT * FROM alumni_startups",
    (findErr, records) => {
      if (findErr) {
        console.error("Fetch alumni startups before delete-all:", findErr);

        return res.status(500).json({
          message: "Failed to retrieve alumni startup records.",
        });
      }

      if (!records.length) {
        return res.status(404).json({
          message: "No alumni startup records found.",
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
        "DELETE FROM alumni_startups",
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Delete all alumni startups error:", deleteErr);

            return res.status(500).json({
              message: "Failed to delete all alumni startup records.",
            });
          }

          return res.json({
            message: "All alumni startup records deleted successfully.",
            deletedCount: result.affectedRows,
            status: "published",
          });
        }
      );
    }
  );
});

// ================= DELETE ONE =================
router.delete("/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const role = getRole(req);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid alumni startup ID.",
    });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  db.query(
    "SELECT * FROM alumni_startups WHERE id = ?",
    [id],
    (findErr, rows) => {
      if (findErr) {
        console.error("Find alumni startup before delete:", findErr);

        return res.status(500).json({
          message: "Failed to retrieve alumni startup.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          message: "Alumni startup record not found.",
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
          "Alumni startup deletion submitted for superadmin approval."
        );
      }

      // SUPERADMIN: Delete immediately.
      db.query(
        "DELETE FROM alumni_startups WHERE id = ?",
        [id],
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Alumni startup DELETE error:", deleteErr);

            return res.status(500).json({
              message: "Delete failed.",
              error: deleteErr.sqlMessage || deleteErr.message,
            });
          }

          return res.json({
            message: "Alumni startup deleted successfully.",
            deletedCount: result.affectedRows,
            status: "published",
          });
        }
      );
    }
  );
});

module.exports = router;
