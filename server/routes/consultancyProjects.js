
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

const ENTITY_TYPE = "consultancy_projects";

// ================= FILE UPLOAD CONFIG =================

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if ([".xlsx", ".xls", ".csv"].includes(ext)) {
      return cb(null, true);
    }

    cb(new Error("Only .xlsx, .xls and .csv files are allowed."));
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

// ================= VALIDATION HELPERS =================

const validateProject = (data) => {
  const year = Number(data.year);

  const srNo =
    data.sr_no === "" || data.sr_no == null
      ? null
      : Number(data.sr_no);

  if (
    !data.faculty_name ||
    !String(data.faculty_name).trim() ||
    !data.project_name ||
    !String(data.project_name).trim() ||
    data.year === "" ||
    data.year == null
  ) {
    return {
      error: "Faculty name, project name, and year are required.",
    };
  }

  if (
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 9999 ||
    (srNo !== null &&
      (!Number.isInteger(srNo) || srNo < 1))
  ) {
    return {
      error: "Invalid serial number or year.",
    };
  }

  return {
    data: {
      sr_no: srNo,
      faculty_name: String(data.faculty_name).trim(),
      project_name: String(data.project_name).trim(),
      year,
    },
  };
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
      ENTITY_TYPE,
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
        console.error("Consultancy approval request error:", err);

        return res.status(500).json({
          message: "Failed to submit consultancy project request.",
        });
      }

      const requestId = result.insertId;

      res.status(202).json({
        message: successMessage,
        requestId,
        status: "pending",
      });

      db.query(
        "SELECT email FROM admins WHERE id = ? LIMIT 1",
        [adminId],
        async (adminError, adminRows) => {
          if (adminError) {
            console.error(
              "Failed to fetch consultancy submitter email:",
              adminError.message
            );
            return;
          }

          const adminEmail = adminRows?.[0]?.email;

          try {
            await sendApprovalNotification({
              requestId,
              entityType: ENTITY_TYPE,
              operation,
              requestedBy: adminEmail || `Admin ID: ${adminId}`,
            });
          } catch (emailError) {
            console.error(
              "Consultancy superadmin notification failed:",
              emailError.message
            );
          }

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
              entityType: ENTITY_TYPE,
              operation,
            });
          } catch (emailError) {
            console.error(
              "Consultancy submitter confirmation failed:",
              emailError.message
            );
          }
        }
      );
    }
  );
};

// ================= CREATE MANUAL ENTRY =================
// POST /api/consultancy-projects

router.post("/", auth, (req, res) => {
  const role = getRole(req);

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  const validation = validateProject(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const proposedData = validation.data;

  if (role === "admin") {
    return submitApprovalRequest(
      {
        operation: "create",
        proposedData,
      },
      req.admin.id,
      res,
      "Consultancy project submitted for superadmin approval."
    );
  }

  db.query(
    `INSERT INTO consultancy_projects
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
        console.error("Create consultancy project error:", err);

        return res.status(500).json({
          message: "Failed to add consultancy project.",
        });
      }

      return res.status(201).json({
        message: "Consultancy project published successfully.",
        id: result.insertId,
        status: "published",
      });
    }
  );
});

// ================= GET ALL PUBLISHED PROJECTS =================
// GET /api/consultancy-projects

router.get("/", (req, res) => {
  db.query(
    `SELECT * FROM consultancy_projects
     ORDER BY year DESC, sr_no ASC, id ASC`,
    (err, results) => {
      if (err) {
        console.error("Fetch consultancy projects error:", err);

        return res.status(500).json({
          message: "Failed to fetch consultancy projects.",
        });
      }

      return res.json(results);
    }
  );
});

// ================= GET AVAILABLE YEARS =================
// GET /api/consultancy-projects/years

router.get("/years", (req, res) => {
  db.query(
    `SELECT DISTINCT year
     FROM consultancy_projects
     WHERE year IS NOT NULL
     ORDER BY year DESC`,
    (err, results) => {
      if (err) {
        console.error("Fetch consultancy years error:", err);

        return res.status(500).json({
          message: "Failed to fetch available years.",
        });
      }

      const years = results.map((item) => String(item.year));

      return res.json(years);
    }
  );
});

// ================= GET PUBLISHED PROJECTS BY YEAR =================
// GET /api/consultancy-projects/year/2026

router.get("/year/:year", (req, res) => {
  const yearText = req.params.year;
  const year = Number(yearText);

  if (
    !/^\d{4}$/.test(yearText) ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 9999
  ) {
    return res.status(400).json({
      message: "Invalid year.",
    });
  }

  db.query(
    `SELECT * FROM consultancy_projects
     WHERE year = ?
     ORDER BY sr_no ASC, id ASC`,
    [year],
    (err, results) => {
      if (err) {
        console.error("Fetch projects by year error:", err);

        return res.status(500).json({
          message: "Failed to fetch consultancy projects.",
        });
      }

      return res.json(results);
    }
  );
});

// ================= MY APPROVAL REQUESTS =================
// GET /api/consultancy-projects/my-requests

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
       AND entity_type = ?
     ORDER BY id DESC`,
    [req.admin.id, ENTITY_TYPE],
    (err, results) => {
      if (err) {
        console.error("Fetch consultancy requests error:", err);

        return res.status(500).json({
          message: "Failed to fetch consultancy approval requests.",
        });
      }

      return res.json({ requests: results });
    }
  );
});

// ================= UPLOAD EXCEL =================
// POST /api/consultancy-projects/upload-excel
//
// Excel columns:
// Sr. No. | Name of Faculty | Project name | Year
//
// Year is optional in Excel if a year is selected in the form.

router.post(
  "/upload-excel",
  auth,
  upload.single("file"),
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

      // Use the selected form year when the Excel row has no year.
      const selectedYear = req.body.year
        ? String(req.body.year).trim()
        : "";

      const records = [];

      // Skip the header row.
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        if (
          !row.some(
            (cell) => String(cell ?? "").trim() !== ""
          )
        ) {
          continue;
        }

        const excelYear = String(row[3] ?? "").trim();

        const recordYear = excelYear || selectedYear;

        const validation = validateProject({
          sr_no: row[0],
          faculty_name: row[1],
          project_name: row[2],
          year: recordYear,
        });

        if (validation.error) {
          cleanupFile(filePath);

          return res.status(400).json({
            message: `Excel row ${i + 1}: ${validation.error}`,
          });
        }

        records.push(validation.data);
      }

      cleanupFile(filePath);

      if (records.length === 0) {
        return res.status(400).json({
          message: "No valid data found in Excel.",
        });
      }

      // ADMIN: Submit all rows for approval.
      if (role === "admin") {
        return submitApprovalRequest(
          {
            operation: "bulk_create",
            proposedData: { records },
          },
          req.admin.id,
          res,
          "Consultancy projects Excel data submitted for superadmin approval."
        );
      }

      // SUPERADMIN: Insert new records without deleting existing data.
      const values = records.map((record) => [
        record.sr_no,
        record.faculty_name,
        record.project_name,
        record.year,
      ]);

      db.query(
        `INSERT INTO consultancy_projects
          (sr_no, faculty_name, project_name, year)
         VALUES ?`,
        [values],
        (err, result) => {
          if (err) {
            console.error("Consultancy Excel insert error:", err);

            return res.status(500).json({
              message: "Failed to import consultancy projects.",
              error: err.sqlMessage || err.message,
            });
          }

          return res.status(201).json({
            message: "Consultancy projects uploaded successfully.",
            insertedCount: result.affectedRows,
            status: "published",
          });
        }
      );
    } catch (err) {
      cleanupFile(filePath);

      console.error("Consultancy Excel processing error:", err);

      return res.status(400).json({
        message: "Error processing Excel file.",
        error: err.message,
      });
    }
  }
);

// ================= UPDATE =================
// PUT /api/consultancy-projects/:id

router.put("/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const role = getRole(req);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid consultancy project ID.",
    });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  const validation = validateProject(req.body);

  if (validation.error) {
    return res.status(400).json({
      message: validation.error,
    });
  }

  const proposedData = validation.data;

  db.query(
    "SELECT * FROM consultancy_projects WHERE id = ?",
    [id],
    (findErr, rows) => {
      if (findErr) {
        console.error("Find consultancy project error:", findErr);

        return res.status(500).json({
          message: "Failed to retrieve consultancy project.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          message: "Consultancy project not found.",
        });
      }

      const originalData = rows[0];

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
          "Consultancy project update submitted for superadmin approval."
        );
      }

      db.query(
        `UPDATE consultancy_projects
         SET sr_no = ?,
             faculty_name = ?,
             project_name = ?,
             year = ?
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
            console.error("Update consultancy project error:", updateErr);

            return res.status(500).json({
              message: "Failed to update consultancy project.",
            });
          }

          return res.json({
            message: "Consultancy project updated and published.",
            status: "published",
          });
        }
      );
    }
  );
});

// ================= DELETE ALL BY YEAR =================
// DELETE /api/consultancy-projects/delete-all?year=2026

router.delete("/delete-all", auth, (req, res) => {
  const role = getRole(req);
  const yearText = String(req.query.year ?? "");

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  if (!/^\d{4}$/.test(yearText)) {
    return res.status(400).json({
      message: "Please provide a valid year.",
    });
  }

  const year = Number(yearText);

  if (year < 1900 || year > 9999) {
    return res.status(400).json({
      message: "Please provide a valid year.",
    });
  }

  db.query(
    "SELECT * FROM consultancy_projects WHERE year = ?",
    [year],
    (findErr, records) => {
      if (findErr) {
        console.error("Find projects by year error:", findErr);

        return res.status(500).json({
          message: "Failed to retrieve consultancy projects.",
        });
      }

      if (!records.length) {
        return res.status(404).json({
          message: `No consultancy projects found for ${year}.`,
        });
      }

      if (role === "admin") {
        return submitApprovalRequest(
          {
            operation: "delete_by_year",
            proposedData: {
              year,
              ids: records.map((record) => record.id),
            },
            originalData: records,
          },
          req.admin.id,
          res,
          `Delete request for consultancy projects in ${year} submitted for superadmin approval.`
        );
      }

      db.query(
        "DELETE FROM consultancy_projects WHERE year = ?",
        [year],
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Delete projects by year error:", deleteErr);

            return res.status(500).json({
              message: "Failed to delete consultancy projects.",
            });
          }

          return res.json({
            message: `Consultancy projects for ${year} deleted successfully.`,
            deletedCount: result.affectedRows,
            status: "published",
          });
        }
      );
    }
  );
});

// ================= DELETE SINGLE RECORD =================
// DELETE /api/consultancy-projects/:id

router.delete("/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const role = getRole(req);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid consultancy project ID.",
    });
  }

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  db.query(
    "SELECT * FROM consultancy_projects WHERE id = ?",
    [id],
    (findErr, rows) => {
      if (findErr) {
        console.error("Find consultancy project error:", findErr);

        return res.status(500).json({
          message: "Failed to retrieve consultancy project.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          message: "Consultancy project not found.",
        });
      }

      const originalData = rows[0];

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
          "Consultancy project deletion submitted for superadmin approval."
        );
      }

      db.query(
        "DELETE FROM consultancy_projects WHERE id = ?",
        [id],
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Delete consultancy project error:", deleteErr);

            return res.status(500).json({
              message: "Failed to delete consultancy project.",
            });
          }

          return res.json({
            message: "Consultancy project deleted successfully.",
            deletedCount: result.affectedRows,
            status: "published",
          });
        }
      );
    }
  );
});

module.exports = router;
