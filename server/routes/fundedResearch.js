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


const ENTITY_TYPE = "funded_research";

// ================= FILE UPLOAD CONFIG =================

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (![".xlsx", ".xls", ".csv"].includes(extension)) {
      return cb(
        new Error(
          "Invalid file type. Upload an Excel (.xlsx, .xls) or CSV file."
        )
      );
    }

    cb(null, true);
  },
});

// ================= HELPER FUNCTIONS =================

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const facultyAliases = [
  "facultyname",
  "nameoffaculty",
  "faculty",
  "nameofperson",
  "nameofinvestigator",
  "principalinvestigator",
];

const projectAliases = [
  "projectname",
  "nameofproject",
  "project",
  "researchproject",
  "titleofproject",
];

const serialAliases = [
  "srno",
  "serialno",
  "serialnumber",
  "sno",
  "serial",
];

const isValidYear = (year) =>
  Number.isInteger(year) && year >= 1900 && year <= 9999;

const validateRecord = (record) => {
  const year = Number(record.year);
  const srNo =
    record.sr_no === "" || record.sr_no == null
      ? null
      : Number(record.sr_no);

  if (
    !String(record.faculty_name ?? "").trim() ||
    !String(record.project_name ?? "").trim() ||
    !isValidYear(year)
  ) {
    return {
      valid: false,
      message: "Valid faculty name, project name, and year are required.",
    };
  }

  if (srNo !== null && (!Number.isInteger(srNo) || srNo < 1)) {
    return {
      valid: false,
      message: "Serial number must be a positive integer.",
    };
  }

  return {
    valid: true,
    data: {
      sr_no: srNo,
      faculty_name: String(record.faculty_name).trim(),
      project_name: String(record.project_name).trim(),
      year,
    },
  };
};

const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("File cleanup error:", err.message);
      }
    });
  }
};

// ================= SAVE CHANGE REQUEST =================

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
    (entity_type, record_id, operation, proposed_data,
     original_data, status, submitted_by)
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
        console.error("Funded research request error:", err);

        return res.status(500).json({
          message: "Failed to submit the change request.",
          error: err.sqlMessage || err.message,
        });
      }

      const requestId = result.insertId;

      res.status(201).json({
        message: "Change request submitted for approval.",
        requestId,
        status: "pending",
      });

      // Fetch the submitting admin's email.
      db.query(
        "SELECT email FROM admins WHERE id = ? LIMIT 1",
        [submittedBy],
        async (adminError, adminRows) => {
          if (adminError) {
            console.error(
              "Failed to fetch funded research submitter email:",
              adminError.message
            );
            return;
          }

          const adminEmail = adminRows?.[0]?.email;
          const entityType = ENTITY_TYPE || "funded_research";

          // 1. Notify Super Admin.
          try {
            await sendApprovalNotification({
              requestId,
              entityType,
              operation,
              requestedBy: adminEmail || `Admin ID: ${submittedBy}`,
            });
          } catch (emailError) {
            console.error(
              "Funded research superadmin notification failed:",
              emailError.message
            );
          }

          // 2. Confirm submission to the requesting admin.
          if (!adminEmail) {
            console.error(
              `No email found for funded research submitter ID: ${submittedBy}`
            );
            return;
          }

          try {
            await sendSubmissionConfirmation({
              adminEmail,
              requestId,
              entityType,
              operation,
            });
          } catch (emailError) {
            console.error(
              "Funded research submitter confirmation failed:",
              emailError.message
            );
          }
        }
      );
    }
  );
};


// ================= GET ALL PUBLISHED DATA =================
// GET /api/funded-research

router.get("/", (req, res) => {
  db.query(
    `SELECT *
     FROM funded_research
     ORDER BY year DESC, sr_no ASC, id ASC`,
    (err, result) => {
      if (err) {
        console.error("Fetch funded research error:", err);

        return res.status(500).json({
          message: "Database error while fetching records.",
        });
      }

      res.json(result);
    }
  );
});

// ================= GET CURRENT ADMIN'S REQUESTS =================
// GET /api/funded-research/my-requests

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
        console.error("Fetch funded research requests error:", err);

        return res.status(500).json({
          message: "Failed to fetch change requests.",
        });
      }

      res.json(result);
    }
  );
});


// ================= GET AVAILABLE YEARS =================
// GET /api/funded-research/years

router.get("/years", (req, res) => {
  db.query(
    `SELECT DISTINCT year
     FROM funded_research
     WHERE year IS NOT NULL
     ORDER BY year DESC`,
    (err, result) => {
      if (err) {
        console.error("Fetch funded research years error:", err);

        return res.status(500).json({
          message: "Database error while fetching available years.",
        });
      }

      res.json(result.map((item) => String(item.year)));
    }
  );
});

// ================= GET DATA BY YEAR =================
// GET /api/funded-research/year/2026

router.get("/year/:year", (req, res) => {
  const yearText = String(req.params.year);
  const year = Number(yearText);

  if (!/^\d{4}$/.test(yearText) || !isValidYear(year)) {
    return res.status(400).json({ message: "Invalid year." });
  }

  db.query(
    `SELECT *
     FROM funded_research
     WHERE year = ?
     ORDER BY sr_no ASC, id ASC`,
    [year],
    (err, result) => {
      if (err) {
        console.error("Fetch funded research by year error:", err);

        return res.status(500).json({
          message: "Database error while fetching records by year.",
        });
      }

      res.json(result);
    }
  );
});

// ================= CREATE MANUAL ENTRY =================
// POST /api/funded-research

router.post("/", auth, (req, res) => {
  const validation = validateRecord(req.body);

  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const proposedData = validation.data;

  // Admin: submit for approval.
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

  // Superadmin: insert directly.
  db.query(
    `INSERT INTO funded_research
      (sr_no, faculty_name, project_name, year)
     VALUES (?, ?, ?, ?)`,
    [
      proposedData.sr_no,
      proposedData.faculty_name,
      proposedData.project_name,
      proposedData.year,
    ],
    (err, result) => {
      if (err) {
        console.error("Create funded research error:", err);

        return res.status(500).json({
          message: "Database error while adding the record.",
          error: err.sqlMessage || err.message,
        });
      }

      res.status(201).json({
        message: "Funded research record added successfully.",
        id: result.insertId,
      });
    }
  );
});

// ================= UPLOAD EXCEL / CSV =================
// POST /api/funded-research/upload-excel
// FormData: file, year

router.post("/upload-excel", auth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("File upload error:", err.message);

      return res.status(400).json({
        message: err.message || "Unable to upload the file.",
      });
    }

    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No Excel or CSV file uploaded.",
    });
  }

  const uploadedPath = req.file.path;
  let cleaned = false;

  const cleanup = () => {
    if (!cleaned) {
      cleaned = true;
      cleanupFile(uploadedPath);
    }
  };

  try {
    const yearText = String(req.body?.year ?? "").trim();
    const year = Number(yearText);

    if (
      !/^\d{4}$/.test(yearText) ||
      !isValidYear(year)
    ) {
      cleanup();

      return res.status(400).json({
        message: "Please select a valid year.",
      });
    }

    const workbook = xlsx.readFile(uploadedPath);

    if (!workbook.SheetNames.length) {
      cleanup();

      return res.status(400).json({
        message: "No worksheet found in the uploaded file.",
      });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    });

    if (!rows.length) {
      cleanup();

      return res.status(400).json({
        message: "The worksheet is empty.",
      });
    }

    // Locate the header row, even if title rows appear above it.
    const headerIndex = rows.findIndex((row) => {
      const headers = row.map(normalizeHeader);

      return (
        headers.some((header) => facultyAliases.includes(header)) &&
        headers.some((header) => projectAliases.includes(header))
      );
    });

    if (headerIndex === -1) {
      cleanup();

      return res.status(400).json({
        message:
          "Could not recognize the Excel headers. Expected Faculty Name and Project Name columns.",
        detectedHeaders: rows.slice(0, 5),
        supportedFacultyHeaders: [
          "Faculty Name",
          "Name of Faculty",
          "Faculty",
        ],
        supportedProjectHeaders: [
          "Project Name",
          "Name of Project",
          "Project",
        ],
      });
    }

    const headers = rows[headerIndex].map(normalizeHeader);

    const facultyIndex = headers.findIndex((header) =>
      facultyAliases.includes(header)
    );

    const projectIndex = headers.findIndex((header) =>
      projectAliases.includes(header)
    );

    const srIndex = headers.findIndex((header) =>
      serialAliases.includes(header)
    );

    const records = [];
    const seenSerials = new Set();

    // Validate every row before inserting or submitting the request.
    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];

      if (row.every((cell) => String(cell ?? "").trim() === "")) {
        continue;
      }

      const facultyName = String(row[facultyIndex] ?? "").trim();
      const projectName = String(row[projectIndex] ?? "").trim();
      const srText =
        srIndex >= 0 ? String(row[srIndex] ?? "").trim() : "";

      if (!facultyName || !projectName) {
        throw new Error(
          `Faculty name or project name is missing in Excel row ${i + 1}.`
        );
      }

      let srNo = null;

      if (srText !== "") {
        srNo = Number(srText);

        if (!Number.isInteger(srNo) || srNo < 1) {
          throw new Error(
            `Invalid serial number in Excel row ${i + 1}.`
          );
        }

        if (seenSerials.has(srNo)) {
          throw new Error(
            `Duplicate serial number ${srNo} in Excel row ${i + 1}.`
          );
        }

        seenSerials.add(srNo);
      }

      records.push({
        sr_no: srNo,
        faculty_name: facultyName,
        project_name: projectName,
        year,
      });
    }

    if (!records.length) {
      cleanup();

      return res.status(400).json({
        message: "No data rows found under the Excel headers.",
      });
    }

    // Admin: submit all imported records as one approval request.
    if (req.admin?.role !== "superadmin") {
      cleanup();

      return saveChangeRequest(
        null,
        "bulk_create",
        { records },
        null,
        req.admin.id,
        res
      );
    }

    // Superadmin: insert the records directly.
    const values = records.map((record) => [
      record.sr_no,
      record.faculty_name,
      record.project_name,
      record.year,
    ]);

    db.query(
      `INSERT INTO funded_research
        (sr_no, faculty_name, project_name, year)
       VALUES ?`,
      [values],
      (err, result) => {
        cleanup();

        if (err) {
          console.error("Funded research import error:", err);

          return res.status(500).json({
            message: "Database insert failed.",
            error: err.sqlMessage || err.message,
          });
        }

        res.status(200).json({
          message: `${result.affectedRows} records uploaded successfully for ${year}.`,
          inserted: result.affectedRows,
          year,
        });
      }
    );
  } catch (err) {
    cleanup();

    console.error("Excel processing error:", err);

    return res.status(400).json({
      message: err.message || "Error processing the uploaded file.",
    });
  }
});

// ================= UPDATE RECORD =================
// PUT /api/funded-research/:id

router.put("/:id", auth, (req, res) => {
  const { id } = req.params;
  const validation = validateRecord(req.body);

  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const proposedData = validation.data;

  db.query(
    "SELECT * FROM funded_research WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) {
        console.error("Fetch funded research record error:", err);

        return res.status(500).json({
          message: "Database error while fetching the record.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "Record not found." });
      }

      const originalData = rows[0];

      // Admin: submit update for approval.
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

      // Superadmin: update directly.
      db.query(
        `UPDATE funded_research
         SET sr_no = ?, faculty_name = ?, project_name = ?, year = ?
         WHERE id = ?`,
        [
          proposedData.sr_no,
          proposedData.faculty_name,
          proposedData.project_name,
          proposedData.year,
          id,
        ],
        (updateErr) => {
          if (updateErr) {
            console.error("Update funded research error:", updateErr);

            return res.status(500).json({
              message: "Database error while updating the record.",
              error: updateErr.sqlMessage || updateErr.message,
            });
          }

          res.json({
            message: "Funded research record updated successfully.",
          });
        }
      );
    }
  );
});

// ================= DELETE ALL RECORDS BY YEAR =================
// DELETE /api/funded-research/delete-all?year=2026
// IMPORTANT: Declare before DELETE /:id.

router.delete("/delete-all", auth, (req, res) => {
  const yearText = String(req.query.year ?? "");
  const year = Number(yearText);

  if (!/^\d{4}$/.test(yearText) || !isValidYear(year)) {
    return res.status(400).json({
      message: "Please provide a valid year.",
    });
  }

  db.query(
    "SELECT * FROM funded_research WHERE year = ?",
    [year],
    (err, rows) => {
      if (err) {
        console.error("Fetch records for year deletion error:", err);

        return res.status(500).json({
          message: "Failed to fetch records for deletion.",
        });
      }

      if (!rows.length) {
        return res.json({
          message: `No funded research records found for ${year}.`,
          deletedCount: 0,
        });
      }

      // Admin: request deletion of these specific records.
      if (req.admin?.role !== "superadmin") {
        return saveChangeRequest(
          null,
          "delete_by_year",
          {
            year,
            ids: rows.map((record) => record.id),
          },
          rows,
          req.admin.id,
          res
        );
      }

      // Superadmin: delete directly.
      db.query(
        "DELETE FROM funded_research WHERE year = ?",
        [year],
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Delete funded research by year error:", deleteErr);

            return res.status(500).json({
              message: "Database error while deleting records.",
              error: deleteErr.sqlMessage || deleteErr.message,
            });
          }

          res.json({
            message: `Funded research records for ${year} deleted successfully.`,
            deletedCount: result.affectedRows,
          });
        }
      );
    }
  );
});

// ================= DELETE SINGLE RECORD =================
// DELETE /api/funded-research/:id

router.delete("/:id", auth, (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM funded_research WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) {
        console.error("Fetch funded research record error:", err);

        return res.status(500).json({
          message: "Database error while fetching the record.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "Record not found." });
      }

      const originalData = rows[0];

      // Admin: submit deletion for approval.
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

      // Superadmin: delete directly.
      db.query(
        "DELETE FROM funded_research WHERE id = ?",
        [id],
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Delete funded research error:", deleteErr);

            return res.status(500).json({
              message: "Database error while deleting the record.",
              error: deleteErr.sqlMessage || deleteErr.message,
            });
          }

          if (!result.affectedRows) {
            return res.status(404).json({ message: "Record not found." });
          }

          res.json({
            message: "Funded research record deleted successfully.",
          });
        }
      );
    }
  );
});

module.exports = router;
