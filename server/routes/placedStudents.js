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
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, Date.now() + "-" + safeName);
  },
});

// ================= IMAGE VALIDATION =================
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, and PNG images are allowed"), false);
  }
};

// Maximum image size: 500 KB
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 },
});

// Excel upload
const uploadExcel = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ================= COMMON HELPERS =================

const ENTITY_TYPE = "placed_students";

const isSuperAdmin = (req) =>
  req.admin && req.admin.role === "superadmin";

const parseJson = (value) => {
  if (!value) return null;

  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const deleteUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Uploaded file cleanup failed:", err.message);
    });
  }
};

const submitChangeRequest = (
  req,
  res,
  { recordId = null, operation, proposedData, originalData = null }
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
      originalData == null ? null : JSON.stringify(originalData),
      req.admin.id,
    ],
    (err, result) => {
      if (err) {
        console.error("Change request error:", err);

        return res.status(500).json({
          message: "Failed to submit change request.",
        });
      }

      const requestId = result.insertId;
      const adminId = req.admin.id;
      const adminEmail = req.admin.email;
      const entityType = ENTITY_TYPE;

      res.status(201).json({
        message: "Change request submitted for superadmin approval.",
        requestId,
        status: "pending",
      });

      // 1. Notify Super Admin.
      sendApprovalNotification({
        requestId,
        entityType,
        operation,
        requestedBy: adminEmail || `Admin ID: ${adminId}`,
      }).catch((emailError) => {
        console.error(
          "Change request approval notification failed:",
          emailError.message
        );
      });

      // 2. Confirm submission to the requesting admin.
      if (!adminEmail) {
        console.error(
          `Change request ${requestId}: submitting admin email is missing.`
        );
        return;
      }

      sendSubmissionConfirmation({
        adminEmail,
        requestId,
        entityType,
        operation,
      }).catch((emailError) => {
        console.error(
          "Change request submission confirmation failed:",
          emailError.message
        );
      });
    }
  );
};
const getStudentById = (id, callback) => {
  db.query(
    "SELECT * FROM placed_students WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || null);
    }
  );
};

const insertRecords = (records, callback) => {
  if (!records.length) {
    return callback(null, { affectedRows: 0 });
  }

  const values = records.map((record) => [
    record.name,
    record.discipline,
    record.organization,
    record.package_lpa,
    record.photo || null,
  ]);

  const sql = `
    INSERT INTO placed_students
    (name, discipline, organization, package_lpa, photo)
    VALUES ?
  `;

  db.query(sql, [values], callback);
};

// ================= GET ALL PUBLISHED STUDENTS =================
// GET /api/placements

router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM placed_students ORDER BY id DESC",
    (err, result) => {
      if (err) {
        console.error("Fetch placed students error:", err);
        return res.status(500).json({
          message: "Failed to fetch placed students.",
        });
      }

      res.json(result);
    }
  );
});

// ================= GET MY CHANGE REQUESTS =================
// GET /api/placements/my-requests

router.get("/my-requests", auth, (req, res) => {
  const sql = `
    SELECT *
    FROM content_change_requests
    WHERE entity_type = ?
      AND submitted_by = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [ENTITY_TYPE, req.admin.id], (err, rows) => {
    if (err) {
      console.error("Fetch placement requests error:", err);
      return res.status(500).json({
        message: "Failed to fetch change requests.",
      });
    }

    res.json(rows);
  });
});

// ================= CREATE PLACED STUDENT =================
// POST /api/placements

router.post("/", auth, upload.single("photo"), (req, res) => {
  const { name, discipline, organization, package_lpa } = req.body;

  if (!name || !discipline || !organization || package_lpa === undefined ||
    package_lpa === "") {
    deleteUploadedFile(req.file?.path);

    return res.status(400).json({
      message: "Name, discipline, organization, and package are required.",
    });
  }

  const student = {
    name: name.trim(),
    discipline: discipline.trim(),
    organization: organization.trim(),
    package_lpa: package_lpa,
    photo: req.file ? req.file.filename : null,
  };

  // Admin changes must be approved first
  if (!isSuperAdmin(req)) {
    return submitChangeRequest(req, res, {
      operation: "create",
      proposedData: student,
    });
  }

  const sql = `
    INSERT INTO placed_students
    (name, discipline, organization, package_lpa, photo)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      student.name,
      student.discipline,
      student.organization,
      student.package_lpa,
      student.photo,
    ],
    (err, result) => {
      if (err) {
        console.error("Create placed student error:", err);
        deleteUploadedFile(req.file?.path);

        return res.status(500).json({
          message: "Failed to add placed student.",
        });
      }

      res.status(201).json({
        message: "Placed student added successfully.",
        id: result.insertId,
      });
    }
  );
});

// ================= UPLOAD EXCEL =================
// POST /api/placements/upload-excel
// FormData: file

router.post(
  "/upload-excel",
  auth,
  uploadExcel.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "No Excel file uploaded.",
      });
    }

    try {
      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        deleteUploadedFile(req.file.path);
        return res.status(400).json({
          message: "The uploaded Excel file contains no worksheet.",
        });
      }

      const rows = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });

      const records = rows
        .slice(1)
        .filter((row) => row.some((cell) => String(cell).trim() !== ""))
        .map((row) => ({
          name: String(row[0] ?? "").trim(),
          discipline: String(row[1] ?? "").trim(),
          organization: String(row[2] ?? "").trim(),
          package_lpa: row[3] === "" || row[3] == null ? 0 : row[3],
          photo: null,
        }));

      const validRecords = records.filter(
        (record) =>
          record.name &&
          record.discipline &&
          record.organization &&
          Number.isFinite(Number(record.package_lpa)) &&
          Number(record.package_lpa) >= 0
      );

      if (validRecords.length === 0) {
        deleteUploadedFile(req.file.path);

        return res.status(400).json({
          message: "No valid data found. Check the Excel columns and values.",
        });
      }

      // Admin: submit all imported records for approval
      if (!isSuperAdmin(req)) {
        return submitChangeRequest(req, res, {
          operation: "bulk_create",
          proposedData: {
            records: validRecords,
          },
        });
      }

      // Superadmin: insert records directly
      insertRecords(validRecords, (err, result) => {
        deleteUploadedFile(req.file.path);

        if (err) {
          console.error("Excel import error:", err);

          return res.status(500).json({
            message: "Failed to import Excel records.",
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
        message: "Failed to process Excel file.",
        error: err.message,
      });
    }
  }
);

// ================= UPDATE PLACED STUDENT =================
// PUT /api/placements/:id

router.put("/:id", auth, upload.single("photo"), (req, res) => {
  const { name, discipline, organization, package_lpa } = req.body;
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    deleteUploadedFile(req.file?.path);

    return res.status(400).json({
      message: "Invalid placed student ID.",
    });
  }

  if (!name || !discipline || !organization ||
    package_lpa === undefined || package_lpa === "") {
    deleteUploadedFile(req.file?.path);

    return res.status(400).json({
      message: "Name, discipline, organization, and package are required.",
    });
  }

  getStudentById(id, (err, existingStudent) => {
    if (err) {
      deleteUploadedFile(req.file?.path);

      return res.status(500).json({
        message: "Failed to fetch placed student.",
      });
    }

    if (!existingStudent) {
      deleteUploadedFile(req.file?.path);

      return res.status(404).json({
        message: "Placed student not found.",
      });
    }

    const updatedStudent = {
      name: name.trim(),
      discipline: discipline.trim(),
      organization: organization.trim(),
      package_lpa: package_lpa,
      photo: req.file ? req.file.filename : existingStudent.photo,
    };

    if (!isSuperAdmin(req)) {
      return submitChangeRequest(req, res, {
        recordId: id,
        operation: "update",
        proposedData: updatedStudent,
        originalData: existingStudent,
      });
    }

    const sql = `
      UPDATE placed_students
      SET name = ?,
          discipline = ?,
          organization = ?,
          package_lpa = ?,
          photo = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        updatedStudent.name,
        updatedStudent.discipline,
        updatedStudent.organization,
        updatedStudent.package_lpa,
        updatedStudent.photo,
        id,
      ],
      (updateErr) => {
        if (updateErr) {
          deleteUploadedFile(req.file?.path);
          console.error("Update placed student error:", updateErr);

          return res.status(500).json({
            message: "Failed to update placed student.",
          });
        }

        res.json({
          message: "Placed student updated successfully.",
        });
      }
    );
  });
});

// ================= DELETE ALL PLACED STUDENTS =================
// DELETE /api/placements/delete-all

router.delete("/delete-all", auth, (req, res) => {
  db.query("SELECT * FROM placed_students", (err, rows) => {
    if (err) {
      console.error("Fetch records for deletion error:", err);

      return res.status(500).json({
        message: "Failed to retrieve placed student records.",
      });
    }

    if (rows.length === 0) {
      return res.json({
        message: "No placed student records found.",
        deletedCount: 0,
      });
    }

    // Admin: request deletion of the exact records currently present
    if (!isSuperAdmin(req)) {
      const ids = rows.map((row) => row.id);

      return submitChangeRequest(req, res, {
        operation: "delete_all",
        proposedData: { ids },
        originalData: rows,
      });
    }

    // Superadmin: delete all records directly
    db.query("DELETE FROM placed_students", (deleteErr, result) => {
      if (deleteErr) {
        console.error("Delete all placed students error:", deleteErr);

        return res.status(500).json({
          message: "Failed to delete placed student records.",
        });
      }

      res.json({
        message: "All placed student records deleted successfully.",
        deletedCount: result.affectedRows,
      });
    });
  });
});

// ================= DELETE SINGLE PLACED STUDENT =================
// DELETE /api/placements/:id

router.delete("/:id", auth, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid placed student ID.",
    });
  }

  getStudentById(id, (err, student) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch placed student.",
      });
    }

    if (!student) {
      return res.status(404).json({
        message: "Placed student not found.",
      });
    }

    // Admin: submit deletion request
    if (!isSuperAdmin(req)) {
      return submitChangeRequest(req, res, {
        recordId: id,
        operation: "delete",
        proposedData: { id },
        originalData: student,
      });
    }

    // Superadmin: delete directly
    db.query(
      "DELETE FROM placed_students WHERE id = ?",
      [id],
      (deleteErr, result) => {
        if (deleteErr) {
          console.error("Delete placed student error:", deleteErr);

          return res.status(500).json({
            message: "Failed to delete placed student.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Placed student not found.",
          });
        }

        res.json({
          message: "Placed student deleted successfully.",
        });
      }
    );
  });
});

// ================= MULTER / ROUTER ERROR HANDLER =================

router.use((err, req, res, next) => {
  if (req.file?.path) {
    deleteUploadedFile(req.file.path);
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File size must be less than 500 KB for images or 10 MB for Excel files.",
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: err.message,
    });
  }

  return res.status(400).json({
    message: err.message || "File upload failed.",
  });
});

module.exports = router;
