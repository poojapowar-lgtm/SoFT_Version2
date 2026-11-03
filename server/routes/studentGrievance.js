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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const ENTITY_TYPE = "student_grievance";

const VALID_CATEGORIES = [
  "Anti-Ragging Committee",
  "Anti-Ragging Squad",
];

// ================= COMMON HELPERS =================

const isSuperAdmin = (req) =>
  req.admin && req.admin.role === "superadmin";

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
      originalData == null ? null : JSON.stringify(originalData),
      req.admin.id,
    ],
    (err, result) => {
      if (err) {
        console.error("Student grievance request error:", err);

        return res.status(500).json({
          message: "Failed to submit change request.",
        });
      }

      const requestId = result.insertId;
      const adminId = req.admin.id;
      const adminEmail = req.admin.email;
      const entityType = ENTITY_TYPE || "student_grievance";

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
          "Student grievance approval notification failed:",
          emailError.message
        );
      });

      // 2. Confirm submission to the requesting admin.
      if (!adminEmail) {
        console.error(
          `Student grievance request ${requestId}: submitting admin email is missing.`
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
          "Student grievance submission confirmation failed:",
          emailError.message
        );
      });
    }
  );
};

const getRecordById = (id, callback) => {
  db.query(
    "SELECT * FROM student_grievance WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || null);
    }
  );
};

const normalizeGrievanceRecord = (record) => ({
  sr_no: record.sr_no,
  representative: record.representative || null,
  name: record.name.trim(),
  designation: record.designation.trim(),
  contact_no: record.contact_no?.trim() || null,
  email_address: record.email_address?.trim() || null,
  category: record.category,
});

const validateRecord = (record, allowMissingSrNo = true) => {
  if (!record.name?.trim() || !record.designation?.trim()) {
    return "Name and designation are required.";
  }

  if (!VALID_CATEGORIES.includes(record.category)) {
    return "Invalid student grievance category.";
  }

  if (
    !allowMissingSrNo &&
    (record.sr_no === undefined ||
      record.sr_no === null ||
      record.sr_no === "")
  ) {
    return "Sr. No. is required.";
  }

  if (
    record.sr_no !== undefined &&
    record.sr_no !== null &&
    record.sr_no !== "" &&
    (!Number.isInteger(Number(record.sr_no)) ||
      Number(record.sr_no) < 1)
  ) {
    return "Sr. No. must be a positive integer.";
  }

  return null;
};

const insertRecords = (records, callback) => {
  if (!records.length) {
    return callback(null, { affectedRows: 0 });
  }

  const values = records.map((record) => [
    record.sr_no,
    record.representative,
    record.name,
    record.designation,
    record.contact_no,
    record.email_address,
    record.category,
  ]);

  const sql = `
    INSERT INTO student_grievance
    (
      sr_no,
      representative,
      name,
      designation,
      contact_no,
      email_address,
      category
    )
    VALUES ?
  `;

  db.query(sql, [values], callback);
};

// ================= GET RECORDS =================
// GET /api/student-grievance?category=Anti-Ragging%20Committee

router.get("/", (req, res) => {
  const { category } = req.query;

  let sql = "SELECT * FROM student_grievance";
  const values = [];

  if (category) {
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error:
          "Invalid category. Use Anti-Ragging Committee or Anti-Ragging Squad.",
      });
    }

    sql += " WHERE category = ?";
    values.push(category);
  }

  sql += " ORDER BY sr_no ASC, id ASC";

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Fetch grievance records error:", err);

      return res.status(500).json({
        error: "Database error while fetching student grievance records.",
      });
    }

    res.json(result);
  });
});

// ================= GET MY CHANGE REQUESTS =================
// GET /api/student-grievance/my-requests

router.get("/my-requests", auth, (req, res) => {
  const sql = `
    SELECT *
    FROM content_change_requests
    WHERE entity_type = ?
      AND submitted_by = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [ENTITY_TYPE, req.admin.id], (err, result) => {
    if (err) {
      console.error("Fetch grievance requests error:", err);

      return res.status(500).json({
        message: "Failed to fetch change requests.",
      });
    }

    res.json(result);
  });
});

// ================= UPLOAD EXCEL =================
// POST /api/student-grievance/upload-excel
// FormData: file, category
//
// Excel columns:
// Sr No | Representative | Name | Designation | Contact No | Email Address
//
// If your worksheet includes a different column order, update the
// header mapping below to match that worksheet.

router.post(
  "/upload-excel",
  auth,
  upload.single("file"),
  (req, res) => {
    const { category } = req.body;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: "Invalid student grievance category.",
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

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!firstSheet) {
        return res.status(400).json({
          message: "The Excel file contains no worksheet.",
        });
      }

      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        defval: "",
        raw: false,
      });

      if (rows.length === 0) {
        return res.status(400).json({
          message: "The Excel file contains no records.",
        });
      }

      const normalizeHeader = (header) =>
        String(header)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

      const records = [];
      const invalidRows = [];

      rows.forEach((row, index) => {
        const normalizedRow = {};

        Object.entries(row).forEach(([key, value]) => {
          normalizedRow[normalizeHeader(key)] = value;
        });

        const srNoValue =
          normalizedRow.srno !== undefined &&
            normalizedRow.srno !== ""
            ? normalizedRow.srno
            : index + 1;

        const srNo = Number(srNoValue);

        const representative = String(
          normalizedRow.representative || ""
        ).trim();

        const name = String(normalizedRow.name || "").trim();

        const designation = String(
          normalizedRow.designation || ""
        ).trim();

        const contactNo = String(
          normalizedRow.contactno ||
          normalizedRow.contact ||
          ""
        ).trim();

        const emailAddress = String(
          normalizedRow.emailaddress ||
          normalizedRow.email ||
          ""
        ).trim();

        const record = {
          sr_no: srNo,
          representative: representative || null,
          name,
          designation,
          contact_no: contactNo || null,
          email_address: emailAddress || null,
          category,
        };

        const validationError = validateRecord(record, false);

        if (validationError) {
          invalidRows.push(index + 2);
          return;
        }

        records.push(record);
      });

      // Reject the entire file if any row is invalid.
      if (invalidRows.length > 0) {
        return res.status(400).json({
          message:
            `Invalid Sr. No., missing Name or Designation, or invalid category in Excel row(s): ${invalidRows.join(", ")}. No records were imported.`,
        });
      }

      if (records.length === 0) {
        return res.status(400).json({
          message: "No valid student grievance records found.",
        });
      }

      // Admin: request bulk import approval.
      if (!isSuperAdmin(req)) {
        return submitChangeRequest(req, res, {
          operation: "bulk_create",
          proposedData: {
            records,
          },
        });
      }

      // Superadmin: import directly.
      insertRecords(records, (err, result) => {
        if (err) {
          console.error("Grievance Excel import error:", err);

          return res.status(500).json({
            message: "Failed to import student grievance records.",
          });
        }

        res.status(201).json({
          message: `${result.affectedRows} records imported successfully.`,
          importedCount: result.affectedRows,
        });
      });
    } catch (err) {
      console.error("Excel parsing error:", err);

      res.status(400).json({
        message:
          "Unable to read the Excel file. Please check its format.",
      });
    }
  }
);

// ================= ADD RECORD =================
// POST /api/student-grievance

router.post("/", auth, (req, res) => {
  const {
    sr_no,
    representative,
    name,
    designation,
    contact_no,
    email_address,
    category,
  } = req.body;

  const record = {
    sr_no:
      sr_no === undefined || sr_no === null || sr_no === ""
        ? null
        : Number(sr_no),
    representative,
    name,
    designation,
    contact_no,
    email_address,
    category,
  };

  const validationError = validateRecord(record);

  if (validationError) {
    return res.status(400).json({
      error: validationError,
    });
  }

  const normalizedRecord = normalizeGrievanceRecord(record);

  // Admin: request approval.
  if (!isSuperAdmin(req)) {
    return submitChangeRequest(req, res, {
      operation: "create",
      proposedData: normalizedRecord,
    });
  }

  // Superadmin: insert directly.
  insertRecords([normalizedRecord], (err, result) => {
    if (err) {
      console.error("Insert grievance record error:", err);

      return res.status(500).json({
        error: "Failed to add student grievance record.",
      });
    }

    res.status(201).json({
      message: "Student grievance record added successfully.",
      id: result.insertId,
    });
  });
});

// ================= UPDATE RECORD =================
// PUT /api/student-grievance/:id

router.put("/:id", auth, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      error: "Invalid record ID.",
    });
  }

  const {
    sr_no,
    representative,
    name,
    designation,
    contact_no,
    email_address,
    category,
  } = req.body;

  const record = {
    sr_no:
      sr_no === undefined || sr_no === null || sr_no === ""
        ? null
        : Number(sr_no),
    representative,
    name,
    designation,
    contact_no,
    email_address,
    category,
  };

  const validationError = validateRecord(record);

  if (validationError) {
    return res.status(400).json({
      error: validationError,
    });
  }

  getRecordById(id, (err, existingRecord) => {
    if (err) {
      return res.status(500).json({
        error: "Failed to fetch student grievance record.",
      });
    }

    if (!existingRecord) {
      return res.status(404).json({
        error: "Student grievance record not found.",
      });
    }

    const normalizedRecord = normalizeGrievanceRecord(record);

    // Admin: request approval.
    if (!isSuperAdmin(req)) {
      return submitChangeRequest(req, res, {
        recordId: id,
        operation: "update",
        proposedData: normalizedRecord,
        originalData: existingRecord,
      });
    }

    // Superadmin: update directly.
    const sql = `
      UPDATE student_grievance
      SET sr_no = ?,
          representative = ?,
          name = ?,
          designation = ?,
          contact_no = ?,
          email_address = ?,
          category = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        normalizedRecord.sr_no,
        normalizedRecord.representative,
        normalizedRecord.name,
        normalizedRecord.designation,
        normalizedRecord.contact_no,
        normalizedRecord.email_address,
        normalizedRecord.category,
        id,
      ],
      (updateErr) => {
        if (updateErr) {
          console.error("Update grievance record error:", updateErr);

          return res.status(500).json({
            error: "Failed to update student grievance record.",
          });
        }

        res.json({
          message: "Student grievance record updated successfully.",
        });
      }
    );
  });
});

// ================= DELETE CATEGORY RECORDS =================
// DELETE /api/student-grievance/category/:category
//
// Keep this route above DELETE /:id.

router.delete("/category/:category", auth, (req, res) => {
  const { category } = req.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      message: "Invalid student grievance category.",
    });
  }

  db.query(
    "SELECT * FROM student_grievance WHERE category = ?",
    [category],
    (err, records) => {
      if (err) {
        console.error("Fetch category records error:", err);

        return res.status(500).json({
          message: "Failed to retrieve student grievance records.",
        });
      }

      if (records.length === 0) {
        return res.json({
          message: "No records found for this category.",
          deletedCount: 0,
        });
      }

      // Admin: request deletion of the exact records found.
      if (!isSuperAdmin(req)) {
        return submitChangeRequest(req, res, {
          operation: "delete_by_category",
          proposedData: {
            category,
            ids: records.map((record) => record.id),
          },
          originalData: records,
        });
      }

      // Superadmin: delete directly.
      db.query(
        "DELETE FROM student_grievance WHERE category = ?",
        [category],
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Delete category records error:", deleteErr);

            return res.status(500).json({
              message: "Failed to delete student grievance records.",
            });
          }

          res.json({
            message: `${result.affectedRows} records deleted successfully.`,
            deletedCount: result.affectedRows,
          });
        }
      );
    }
  );
});

// ================= DELETE SINGLE RECORD =================
// DELETE /api/student-grievance/:id

router.delete("/:id", auth, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      error: "Invalid record ID.",
    });
  }

  getRecordById(id, (err, record) => {
    if (err) {
      return res.status(500).json({
        error: "Failed to fetch student grievance record.",
      });
    }

    if (!record) {
      return res.status(404).json({
        error: "Student grievance record not found.",
      });
    }

    // Admin: request approval.
    if (!isSuperAdmin(req)) {
      return submitChangeRequest(req, res, {
        recordId: id,
        operation: "delete",
        proposedData: { id },
        originalData: record,
      });
    }

    // Superadmin: delete directly.
    db.query(
      "DELETE FROM student_grievance WHERE id = ?",
      [id],
      (deleteErr, result) => {
        if (deleteErr) {
          console.error("Delete grievance record error:", deleteErr);

          return res.status(500).json({
            error: "Delete failed.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            error: "Student grievance record not found.",
          });
        }

        res.json({
          message: "Student grievance record deleted successfully.",
        });
      }
    );
  });
});

module.exports = router;
