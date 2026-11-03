
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

// ================= CONFIGURATION =================

const ENTITY_TYPE = "research_students";
const TABLE_NAME = "research_students";

// ================= FILE UPLOAD CONFIG =================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");

    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, uploadDir);
    });
  },

  filename: (req, file, cb) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new Error("Only .xlsx, .xls, and .csv files are allowed.")
      );
    }

    cb(null, true);
  },
});

// ================= COMMON HELPERS =================

const isSuperAdmin = (req) =>
  req.admin && req.admin.role === "superadmin";

const deleteUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("File cleanup error:", err.message);
      }
    });
  }
};

const isValidYear = (year) => {
  const value = Number(year);

  return (
    year !== undefined &&
    year !== null &&
    String(year).trim() !== "" &&
    Number.isInteger(value) &&
    value >= 1900 &&
    value <= 9999
  );
};

const normalizeRecord = (body) => ({
  name: String(body.name || "").trim(),
  department: String(body.department || "").trim(),
  category: String(body.category || "").trim(),
  supervisor: String(body.supervisor || "").trim(),
  year: Number(body.year),
});

const validateRecord = (record) => {
  if (!record.name) {
    return "Student name is required.";
  }

  if (!record.department) {
    return "Department is required.";
  }

  if (!isValidYear(record.year)) {
    return "A valid year is required.";
  }

  return null;
};

// ================= SUBMIT APPROVAL REQUEST =================

const submitChangeRequest = (
  req,
  res,
  {
    recordId = null,
    operation,
    proposedData,
    originalData = null,
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
      originalData == null
        ? null
        : JSON.stringify(originalData),
      req.admin.id,
    ],
    (err, result) => {
      if (err) {
        console.error("Research student request error:", err);

        return res.status(500).json({
          message: "Failed to submit change request.",
        });
      }

      const requestId = result.insertId;
      const adminId = req.admin.id;
      const adminEmail = req.admin.email;

      res.status(201).json({
        message: "Change request submitted for superadmin approval.",
        requestId,
        status: "pending",
      });

      // Notify superadmin.
      sendApprovalNotification({
        requestId,
        entityType: ENTITY_TYPE,
        operation,
        requestedBy: adminEmail || `Admin ID: ${adminId}`,
      }).catch((emailError) => {
        console.error(
          "Research student approval notification failed:",
          emailError.message
        );
      });

      // Confirm submission to requesting admin.
      if (!adminEmail) {
        console.error(
          `Research student request ${requestId}: submitting admin email is missing.`
        );
        return;
      }

      sendSubmissionConfirmation({
        adminEmail,
        requestId,
        entityType: ENTITY_TYPE,
        operation,
      }).catch((emailError) => {
        console.error(
          "Research student submission confirmation failed:",
          emailError.message
        );
      });
    }
  );
};

// ================= GET RECORD BY ID =================

const getStudentById = (id, callback) => {
  db.query(
    `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
    [id],
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || null);
    }
  );
};

// ================= INSERT MULTIPLE RECORDS =================

const insertRecords = (records, callback) => {
  if (!records.length) {
    return callback(null, { affectedRows: 0 });
  }

  const values = records.map((record) => [
    record.name,
    record.department,
    record.category || "",
    record.supervisor || "",
    Number(record.year),
  ]);

  const sql = `
    INSERT INTO ${TABLE_NAME}
    (name, department, category, supervisor, year)
    VALUES ?
  `;

  db.query(sql, [values], callback);
};

// ================= GET ALL DATA =================
// GET /api/research

router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM ${TABLE_NAME}
    ORDER BY id ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch research students error:", err);

      return res.status(500).json({
        message: "Failed to fetch research student records.",
      });
    }

    res.json(result);
  });
});

// ================= GET AVAILABLE YEARS =================
// GET /api/research/years

router.get("/years", (req, res) => {
  const sql = `
    SELECT DISTINCT year
    FROM ${TABLE_NAME}
    WHERE year IS NOT NULL
    ORDER BY year DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Fetch research years error:", err);

      return res.status(500).json({
        message: "Failed to fetch research years.",
      });
    }

    res.json(
      result
        .map((item) => String(item.year))
        .filter(Boolean)
    );
  });
});

// ================= GET DATA BY YEAR =================
// GET /api/research/year/:year

router.get("/year/:year", (req, res) => {
  const year = Number(req.params.year);

  if (!isValidYear(year)) {
    return res.status(400).json({
      message: "Invalid year.",
    });
  }

  const sql = `
    SELECT *
    FROM ${TABLE_NAME}
    WHERE year = ?
    ORDER BY id ASC
  `;

  db.query(sql, [year], (err, result) => {
    if (err) {
      console.error("Fetch research by year error:", err);

      return res.status(500).json({
        message: "Failed to fetch research records.",
      });
    }

    res.json(result);
  });
});

// ================= GET MY CHANGE REQUESTS =================
// GET /api/research/my-requests

router.get("/my-requests", auth, (req, res) => {
  const sql = `
    SELECT *
    FROM content_change_requests
    WHERE entity_type = ?
      AND submitted_by = ?
    ORDER BY created_at DESC
  `;

  db.query(
    sql,
    [ENTITY_TYPE, req.admin.id],
    (err, result) => {
      if (err) {
        console.error(
          "Fetch research student requests error:",
          err
        );

        return res.status(500).json({
          message: "Failed to fetch change requests.",
        });
      }

      res.json(result);
    }
  );
});

// ================= CREATE MANUAL ENTRY =================
// POST /api/research

router.post("/", auth, (req, res) => {
  const record = normalizeRecord(req.body);
  const validationError = validateRecord(record);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  // Admin: submit for approval.
  if (!isSuperAdmin(req)) {
    return submitChangeRequest(req, res, {
      operation: "create",
      proposedData: record,
    });
  }

  // Superadmin: insert directly.
  const sql = `
    INSERT INTO ${TABLE_NAME}
    (name, department, category, supervisor, year)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      record.name,
      record.department,
      record.category,
      record.supervisor,
      record.year,
    ],
    (err, result) => {
      if (err) {
        console.error("Create research student error:", err);

        return res.status(500).json({
          message: "Failed to add research student.",
        });
      }

      res.status(201).json({
        message: "Research student added successfully.",
        id: result.insertId,
      });
    }
  );
});

// ================= UPLOAD EXCEL =================
// POST /api/research/upload-excel
//
// Supported columns:
// Sr No | Name | Category | Department | Supervisor | Year
//
// Year column is optional. If missing, req.body.year is used.

router.post(
  "/upload-excel",
  auth,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded.",
      });
    }

    try {
      const workbook = xlsx.readFile(req.file.path);

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        deleteUploadedFile(req.file.path);

        return res.status(400).json({
          message: "No worksheet found in the uploaded Excel file.",
        });
      }

      const rows = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });

      if (rows.length < 2) {
        deleteUploadedFile(req.file.path);

        return res.status(400).json({
          message: "Excel file contains no data rows.",
        });
      }

      // Normalize headers to support common header variations.
      const headers = rows[0].map((header) =>
        String(header || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
      );

      const findColumn = (names, fallbackIndex) => {
        const index = headers.findIndex((header) =>
          names.includes(header)
        );

        return index >= 0 ? index : fallbackIndex;
      };

      const nameIndex = findColumn(
        ["name", "studentname", "nameofstudent"],
        1
      );

      const categoryIndex = findColumn(
        ["category", "batch", "batchcategory"],
        2
      );

      const departmentIndex = findColumn(
        ["department", "dept"],
        3
      );

      const supervisorIndex = findColumn(
        ["supervisor", "supervisorname", "guide"],
        4
      );

      const yearIndex = findColumn(
        ["year", "academicyear", "researchyear"],
        -1
      );

      const fallbackYear = req.body.year;

      const records = rows
        .slice(1)
        .filter(
          (row) =>
            String(row[nameIndex] ?? "").trim() !== ""
        )
        .map((row) => {
          const excelYear =
            yearIndex >= 0
              ? row[yearIndex]
              : "";

          const year =
            String(excelYear ?? "").trim() !== ""
              ? excelYear
              : fallbackYear;

          return {
            name: String(row[nameIndex] ?? "").trim(),
            category: String(
              row[categoryIndex] ?? ""
            ).trim(),
            department: String(
              row[departmentIndex] ?? ""
            ).trim(),
            supervisor: String(
              row[supervisorIndex] ?? ""
            ).trim(),
            year: Number(year),
          };
        });

      if (records.length === 0) {
        deleteUploadedFile(req.file.path);

        return res.status(400).json({
          message: "No student records found in the Excel file.",
        });
      }

      // Validate every imported record.
      const invalidRecords = records.filter(
        (record) => validateRecord(record)
      );

      if (invalidRecords.length > 0) {
        deleteUploadedFile(req.file.path);

        return res.status(400).json({
          message:
            "Some Excel records are invalid. Check student name, department, and year.",
          invalidCount: invalidRecords.length,
          totalRecords: records.length,
        });
      }

      // Admin: submit Excel records for approval.
      if (!isSuperAdmin(req)) {
        deleteUploadedFile(req.file.path);

        return submitChangeRequest(req, res, {
          operation: "bulk_create",
          proposedData: {
            records,
          },
        });
      }

      // Superadmin: import directly.
      insertRecords(records, (err, result) => {
        deleteUploadedFile(req.file.path);

        if (err) {
          console.error(
            "Research students Excel import error:",
            err
          );

          return res.status(500).json({
            message: "Failed to import research student records.",
            error: err.sqlMessage,
          });
        }

        res.status(201).json({
          message: "Excel uploaded successfully.",
          importedCount: result.affectedRows,
        });
      });
    } catch (err) {
      deleteUploadedFile(req.file?.path);

      console.error("Excel processing error:", err);

      res.status(500).json({
        message: "Error processing Excel file.",
        error: err.message,
      });
    }
  }
);

// ================= UPDATE =================
// PUT /api/research/:id

router.put("/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  const record = normalizeRecord(req.body);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid research student ID.",
    });
  }

  const validationError = validateRecord(record);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  getStudentById(id, (err, existingStudent) => {
    if (err) {
      console.error("Fetch research student error:", err);

      return res.status(500).json({
        message: "Failed to fetch research student.",
      });
    }

    if (!existingStudent) {
      return res.status(404).json({
        message: "Research student record not found.",
      });
    }

    const updatedRecord = {
      ...record,
    };

    // Admin: submit for approval.
    if (!isSuperAdmin(req)) {
      return submitChangeRequest(req, res, {
        recordId: id,
        operation: "update",
        proposedData: updatedRecord,
        originalData: existingStudent,
      });
    }

    // Superadmin: update directly.
    const sql = `
      UPDATE ${TABLE_NAME}
      SET name = ?,
          department = ?,
          category = ?,
          supervisor = ?,
          year = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        updatedRecord.name,
        updatedRecord.department,
        updatedRecord.category,
        updatedRecord.supervisor,
        updatedRecord.year,
        id,
      ],
      (updateErr) => {
        if (updateErr) {
          console.error(
            "Update research student error:",
            updateErr
          );

          return res.status(500).json({
            message: "Failed to update research student.",
          });
        }

        res.json({
          message: "Research student updated successfully.",
        });
      }
    );
  });
});

// ================= DELETE ALL =================
// DELETE /api/research/delete-all

router.delete("/delete-all", auth, (req, res) => {
  db.query(
    `SELECT * FROM ${TABLE_NAME}`,
    (err, records) => {
      if (err) {
        console.error(
          "Fetch research records for deletion error:",
          err
        );

        return res.status(500).json({
          message: "Failed to retrieve research student records.",
        });
      }

      if (records.length === 0) {
        return res.json({
          message: "No research student records found.",
          deletedCount: 0,
        });
      }

      // Admin: request deletion of these specific records.
      if (!isSuperAdmin(req)) {
        return submitChangeRequest(req, res, {
          operation: "delete_all",
          proposedData: {
            ids: records.map((record) => record.id),
          },
          originalData: records,
        });
      }

      // Superadmin: delete directly.
      db.query(
        `DELETE FROM ${TABLE_NAME}`,
        (deleteErr, result) => {
          if (deleteErr) {
            console.error(
              "Delete all research students error:",
              deleteErr
            );

            return res.status(500).json({
              message: "Failed to delete research student records.",
            });
          }

          res.json({
            message: "All research records deleted successfully.",
            deletedCount: result.affectedRows,
          });
        }
      );
    }
  );
});

// ================= DELETE SINGLE RECORD =================
// DELETE /api/research/:id

router.delete("/:id", auth, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid research student ID.",
    });
  }

  getStudentById(id, (err, student) => {
    if (err) {
      console.error("Fetch research student error:", err);

      return res.status(500).json({
        message: "Failed to fetch research student.",
      });
    }

    if (!student) {
      return res.status(404).json({
        message: "Research student record not found.",
      });
    }

    // Admin: submit for approval.
    if (!isSuperAdmin(req)) {
      return submitChangeRequest(req, res, {
        recordId: id,
        operation: "delete",
        proposedData: { id },
        originalData: student,
      });
    }

    // Superadmin: delete directly.
    db.query(
      `DELETE FROM ${TABLE_NAME} WHERE id = ?`,
      [id],
      (deleteErr, result) => {
        if (deleteErr) {
          console.error(
            "Delete research student error:",
            deleteErr
          );

          return res.status(500).json({
            message: "Failed to delete research student.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Research student record not found.",
          });
        }

        res.json({
          message: "Research student deleted successfully.",
        });
      }
    );
  });
});

// ================= ERROR HANDLER =================

router.use((err, req, res, next) => {
  if (req.file?.path) {
    deleteUploadedFile(req.file.path);
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Excel file must be smaller than 10 MB."
          : err.message,
    });
  }

  console.error("Research students router error:", err);

  res.status(400).json({
    message: err.message || "Request failed.",
  });
});

module.exports = router;
