const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");

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
    const safeName = file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      ""
    );
    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({ storage });

const ENTITY_TYPE = "mou";

// ================= HELPERS =================
const isSuperAdmin = (req) =>
  req.admin?.role === "superadmin";

const removeTempFile = (filePath) => {
  if (filePath) {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Temporary file cleanup error:", err);
      }
    });
  }
};


const createChangeRequest = (
  req,
  res,
  {
    recordId = null,
    operation,
    proposedData,
    originalData = null,
    message,
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
        console.error("MOU change request error:", err);

        return res.status(500).json({
          message: "Failed to submit MOU change request.",
        });
      }

      const requestId = result.insertId;
      const adminId = req.admin.id;
      const adminEmail = req.admin.email;
      const entityType = ENTITY_TYPE || "mou";

      res.status(201).json({
        message,
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
          "MOU superadmin notification failed:",
          emailError.message
        );
      });

      // 2. Confirm submission to the requesting admin.
      if (!adminEmail) {
        console.error(
          `MOU request ${requestId}: submitting admin email is missing.`
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
          "MOU submitter confirmation failed:",
          emailError.message
        );
      });
    }
  );
};


const getMouById = (id, callback) => {
  db.query(
    "SELECT * FROM mou WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return callback(err, null);
      return callback(null, results[0] || null);
    }
  );
};

// Convert Excel serials and ISO dates to DD-MM-YYYY,
// preserving the original router's date format.
const excelDateToStr = (val) => {
  if (val === null || val === undefined || val === "") {
    return "";
  }

  if (typeof val === "number") {
    const date = xlsx.SSF.parse_date_code(val);

    if (!date) return String(val);

    return `${String(date.d).padStart(2, "0")}-${String(
      date.m
    ).padStart(2, "0")}-${date.y}`;
  }

  if (typeof val === "string") {
    const trimmed = val.trim();
    const parts = trimmed.split("-");

    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return trimmed;
  }

  return String(val);
};

const formatDateForResponse = (val) => {
  if (!val) return "";

  // MySQL DATE values may be returned as YYYY-MM-DD strings.
  if (typeof val === "string") {
    const trimmed = val.trim();
    const parts = trimmed.split("-");

    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return trimmed;
  }

  if (val instanceof Date) {
    return `${String(val.getDate()).padStart(2, "0")}-${String(
      val.getMonth() + 1
    ).padStart(2, "0")}-${val.getFullYear()}`;
  }

  return val;
};

const buildMouData = (body) => ({
  company_name: body.company_name?.trim() || "",
  address: body.address?.trim() || "",
  mou_date: body.mou_date || null,
  purpose: body.purpose || "",
  activities: body.activities || "",
});

const validateMouData = (data) => {
  if (!data.company_name) {
    return "Company Name is required.";
  }

  return null;
};

// ================= GET MY CHANGE REQUESTS =================
// Must appear before routes using /:id.

router.get("/my-requests", auth, (req, res) => {
  const sql = `
    SELECT *
    FROM content_change_requests
    WHERE entity_type = ? AND submitted_by = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [ENTITY_TYPE, req.admin.id], (err, results) => {
    if (err) {
      console.error("Get MOU requests error:", err);

      return res.status(500).json({
        message: "Failed to load your MOU change requests.",
      });
    }

    return res.json(results);
  });
});

// ================= GET ALL MOU =================

router.get("/", (req, res) => {
  db.query("SELECT * FROM mou ORDER BY id ASC", (err, results) => {
    if (err) {
      console.error("Get MOU records error:", err);

      return res.status(500).json({
        message: "Database error",
      });
    }

    const formatted = results.map((row) => ({
      ...row,
      mou_date: formatDateForResponse(row.mou_date),
    }));

    return res.json(formatted);
  });
});

// ================= CREATE MANUAL MOU =================

router.post("/", auth, (req, res) => {
  const data = buildMouData(req.body);
  const validationError = validateMouData(data);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  // Regular admins submit for approval.
  if (!isSuperAdmin(req)) {
    return createChangeRequest(req, res, {
      operation: "create",
      proposedData: data,
      message: "MOU creation submitted for approval.",
    });
  }

  // Superadmin inserts directly.
  const sql = `
    INSERT INTO mou
    (company_name, address, mou_date, purpose, activities)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      data.company_name,
      data.address,
      data.mou_date,
      data.purpose,
      data.activities,
    ],
    (err, result) => {
      if (err) {
        console.error("Create MOU error:", err);

        return res.status(500).json({
          message: "Database error",
        });
      }

      return res.status(201).json({
        message: "MOU record added successfully.",
        id: result.insertId,
      });
    }
  );
});

// ================= UPLOAD EXCEL =================
// Excel columns:
// Sr No | Company Name | Address | Date | Purpose | Activities

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

    const filePath = req.file.path;

    try {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        removeTempFile(filePath);

        return res.status(400).json({
          message: "The Excel file does not contain a worksheet.",
        });
      }

      const rows = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });

      const records = rows
        .slice(1)
        .filter((row) => row.length > 0 && row[1])
        .map((row) => ({
          company_name: String(row[1] || "").trim(),
          address: String(row[2] || "").trim(),
          mou_date: excelDateToStr(row[3]) || null,
          purpose: row[4] || "",
          activities: row[5] || "",
        }));

      if (records.length === 0) {
        removeTempFile(filePath);

        return res.status(400).json({
          message: "No valid data found in Excel.",
        });
      }

      const invalidRecord = records.find(
        (record) => !record.company_name
      );

      if (invalidRecord) {
        removeTempFile(filePath);

        return res.status(400).json({
          message: "Every MOU record must have a Company Name.",
        });
      }

      // The Excel file is no longer needed after parsing.
      removeTempFile(filePath);

      // Regular admins submit all imported rows for approval.
      if (!isSuperAdmin(req)) {
        return createChangeRequest(req, res, {
          operation: "bulk_create",
          proposedData: { records },
          message: `${records.length} MOU records submitted for approval.`,
        });
      }

      // Superadmin inserts the rows directly.
      const values = records.map((record) => [
        record.company_name,
        record.address,
        record.mou_date,
        record.purpose,
        record.activities,
      ]);

      const sql = `
        INSERT INTO mou
        (company_name, address, mou_date, purpose, activities)
        VALUES ?
      `;

      db.query(sql, [values], (err, result) => {
        if (err) {
          console.error("MOU Excel insert error:", err);

          return res.status(500).json({
            message: "Failed to import MOU records.",
            error: err.sqlMessage,
          });
        }

        return res.status(201).json({
          message: "Excel uploaded successfully.",
          insertedCount: result.affectedRows,
        });
      });
    } catch (err) {
      removeTempFile(filePath);

      console.error("MOU Excel processing error:", err);

      return res.status(500).json({
        message: "Error processing Excel file.",
      });
    }
  }
);

// ================= UPDATE MOU =================

router.put("/:id", auth, (req, res) => {
  const id = req.params.id;
  const data = buildMouData(req.body);
  const validationError = validateMouData(data);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  getMouById(id, (err, existingRecord) => {
    if (err) {
      console.error("Find MOU record error:", err);

      return res.status(500).json({
        message: "Database error",
      });
    }

    if (!existingRecord) {
      return res.status(404).json({
        message: "MOU record not found.",
      });
    }

    // Regular admins submit for approval.
    if (!isSuperAdmin(req)) {
      return createChangeRequest(req, res, {
        recordId: id,
        operation: "update",
        proposedData: data,
        originalData: existingRecord,
        message: "MOU update submitted for approval.",
      });
    }

    // Superadmin updates directly.
    const sql = `
      UPDATE mou
      SET company_name = ?,
          address = ?,
          mou_date = ?,
          purpose = ?,
          activities = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        data.company_name,
        data.address,
        data.mou_date,
        data.purpose,
        data.activities,
        id,
      ],
      (updateErr) => {
        if (updateErr) {
          console.error("Update MOU error:", updateErr);

          return res.status(500).json({
            message: "Update error",
          });
        }

        return res.json({
          message: "Updated successfully.",
        });
      }
    );
  });
});

// ================= DELETE ALL MOU RECORDS =================
// DELETE /api/mou/delete-all

router.delete("/delete-all", auth, (req, res) => {
  db.query("SELECT * FROM mou", (err, records) => {
    if (err) {
      console.error("Fetch MOU records for deletion error:", err);

      return res.status(500).json({
        message: "Failed to retrieve MOU records.",
      });
    }

    if (records.length === 0) {
      return res.json({
        message: "No MOU records to delete.",
        deletedCount: 0,
      });
    }

    const ids = records.map((record) => record.id);

    // Regular admins request deletion of these specific records.
    if (!isSuperAdmin(req)) {
      return createChangeRequest(req, res, {
        operation: "delete_all",
        proposedData: { ids },
        originalData: records,
        message: "MOU delete-all request submitted for approval.",
      });
    }

    // Superadmin deletes directly.
    db.query(
      "DELETE FROM mou WHERE id IN (?)",
      [ids],
      (deleteErr, result) => {
        if (deleteErr) {
          console.error("Delete all MOU records error:", deleteErr);

          return res.status(500).json({
            message: "Failed to delete all MOU records.",
          });
        }

        return res.json({
          message: "All MOU records deleted successfully.",
          deletedCount: result.affectedRows,
        });
      }
    );
  });
});

// ================= DELETE SINGLE MOU RECORD =================
// DELETE /api/mou/:id

router.delete("/:id", auth, (req, res) => {
  const id = req.params.id;

  getMouById(id, (err, existingRecord) => {
    if (err) {
      console.error("Find MOU record for deletion error:", err);

      return res.status(500).json({
        message: "Database error",
      });
    }

    if (!existingRecord) {
      return res.status(404).json({
        message: "MOU record not found.",
      });
    }

    // Regular admins submit for approval.
    if (!isSuperAdmin(req)) {
      return createChangeRequest(req, res, {
        recordId: id,
        operation: "delete",
        proposedData: { id: Number(id) },
        originalData: existingRecord,
        message: "MOU deletion submitted for approval.",
      });
    }

    // Superadmin deletes directly.
    db.query(
      "DELETE FROM mou WHERE id = ?",
      [id],
      (deleteErr, result) => {
        if (deleteErr) {
          console.error("Delete MOU record error:", deleteErr);

          return res.status(500).json({
            message: "Delete error",
          });
        }

        if (!result.affectedRows) {
          return res.status(404).json({
            message: "MOU record not found.",
          });
        }

        return res.json({
          message: "Deleted successfully.",
        });
      }
    );
  });
});

module.exports = router;
