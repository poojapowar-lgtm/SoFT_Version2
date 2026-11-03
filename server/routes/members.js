
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

const VALID_MEMBER_TYPES = [
  "governing",
  "board",
  "research_committee",
];

const ENTITY_TYPE = "members";

const isSuperAdmin = (req) =>
  req.admin?.role === "superadmin";

// Submit a request for superadmin approval.

const submitChangeRequest = (
  req,
  res,
  { operation, recordId = null, proposedData, originalData = null }
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
        console.error("Submit member approval request:", err.message);

        return res.status(500).json({
          message: "Failed to submit the member approval request.",
        });
      }

      const requestId = result.insertId;
      const adminId = req.admin.id;
      const adminEmail = req.admin.email;
      const entityType = ENTITY_TYPE || "members";

      res.status(202).json({
        message: "Request submitted for superadmin approval.",
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
          "Member superadmin notification failed:",
          emailError.message
        );
      });

      // 2. Confirm submission to the requesting admin.
      if (!adminEmail) {
        console.error(
          `Member request ${requestId}: submitting admin email is missing.`
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
          "Member submitter confirmation failed:",
          emailError.message
        );
      });
    }
  );
};


// Insert multiple members directly (superadmin only).
const insertMembers = (records, res) => {
  if (!records.length) {
    return res.status(400).json({
      message: "No member records provided.",
    });
  }

  db.query(
    `INSERT INTO members (name, designation, member_type) VALUES ?`,
    [records],
    (err, result) => {
      if (err) {
        console.error("Insert members error:", err.message);
        return res.status(500).json({
          message: "Failed to insert member records.",
        });
      }

      return res.status(201).json({
        message: `${result.affectedRows} members added successfully.`,
        importedCount: result.affectedRows,
      });
    }
  );
};

// GET MEMBERS (PUBLICATION ONLY; FILTER BY TYPE)
router.get("/", (req, res) => {
  const { type } = req.query;

  let sql = "SELECT * FROM members";
  const values = [];

  if (type) {
    if (!VALID_MEMBER_TYPES.includes(type)) {
      return res.status(400).json({
        error:
          "Invalid member type. Use governing, board, or research_committee.",
      });
    }

    sql += " WHERE member_type = ?";
    values.push(type);
  }

  sql += " ORDER BY id ASC";

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Fetch members error:", err.message);
      return res.status(500).json({
        error: "Database error while fetching members.",
      });
    }

    return res.json(result);
  });
});

// UPLOAD MEMBERS FROM EXCEL
router.post(
  "/upload-excel",
  auth,
  upload.single("file"),
  (req, res) => {
    const memberType = req.body.member_type;

    if (!VALID_MEMBER_TYPES.includes(memberType)) {
      return res.status(400).json({
        message: "Invalid member category.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an Excel file.",
      });
    }

    let records;

    try {
      const workbook = XLSX.read(req.file.buffer, {
        type: "buffer",
      });

      const firstSheet =
        workbook.Sheets[workbook.SheetNames[0]];

      if (!firstSheet) {
        return res.status(400).json({
          message: "The Excel file contains no worksheet.",
        });
      }

      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        defval: "",
        raw: false,
      });

      if (!rows.length) {
        return res.status(400).json({
          message: "The Excel file contains no records.",
        });
      }

      const normalizeHeader = (header) =>
        String(header)
          .trim()
          .toLowerCase()
          .replace(/[^a-z]/g, "");

      const invalidRows = [];

      records = rows.map((row, index) => {
        const normalizedRow = {};

        Object.entries(row).forEach(([key, value]) => {
          normalizedRow[normalizeHeader(key)] = value;
        });

        const name = String(normalizedRow.name || "").trim();
        const designation = String(
          normalizedRow.designation || ""
        ).trim();

        if (!name || !designation) {
          invalidRows.push(index + 2);
          return null;
        }

        return {
          name,
          designation,
          member_type: memberType,
        };
      });

      if (invalidRows.length) {
        return res.status(400).json({
          message: `Missing Name or Designation in Excel row(s): ${invalidRows.join(", ")}. No records were imported.`,
        });
      }

      records = records.filter(Boolean);
    } catch (err) {
      console.error("Read member Excel error:", err.message);
      return res.status(400).json({
        message:
          "Unable to read the Excel file. Please check its format.",
      });
    }

    const values = records.map((record) => [
      record.name,
      record.designation,
      record.member_type,
    ]);

    // Superadmin publishes immediately.
    if (isSuperAdmin(req)) {
      return insertMembers(values, res);
    }

    // Admin submits the entire Excel import as one request.
    return submitChangeRequest(req, res, {
      operation: "bulk_create",
      proposedData: records,
    });
  }
);

// ADD MEMBER
router.post("/", auth, (req, res) => {
  const { name, designation, member_type } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof designation !== "string" ||
    !designation.trim() ||
    !member_type
  ) {
    return res.status(400).json({
      error: "Name, designation, and member type are required.",
    });
  }

  if (!VALID_MEMBER_TYPES.includes(member_type)) {
    return res.status(400).json({
      error: "Invalid member type.",
    });
  }

  const proposedData = {
    name: name.trim(),
    designation: designation.trim(),
    member_type,
  };

  if (!isSuperAdmin(req)) {
    return submitChangeRequest(req, res, {
      operation: "create",
      proposedData,
    });
  }

  db.query(
    `INSERT INTO members (name, designation, member_type)
     VALUES (?, ?, ?)`,
    [
      proposedData.name,
      proposedData.designation,
      proposedData.member_type,
    ],
    (err, result) => {
      if (err) {
        console.error("Add member error:", err.message);
        return res.status(500).json({
          error: "Insert failed.",
        });
      }

      return res.status(201).json({
        message: "Member added successfully.",
        id: result.insertId,
      });
    }
  );
});

// UPDATE MEMBER
router.put("/:id", auth, (req, res) => {
  const recordId = Number(req.params.id);
  const { name, designation, member_type } = req.body;

  if (!Number.isSafeInteger(recordId) || recordId < 1) {
    return res.status(400).json({
      error: "Invalid member ID.",
    });
  }

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof designation !== "string" ||
    !designation.trim() ||
    !member_type
  ) {
    return res.status(400).json({
      error: "Name, designation, and member type are required.",
    });
  }

  if (!VALID_MEMBER_TYPES.includes(member_type)) {
    return res.status(400).json({
      error: "Invalid member type.",
    });
  }

  const proposedData = {
    name: name.trim(),
    designation: designation.trim(),
    member_type,
  };

  db.query(
    "SELECT * FROM members WHERE id = ?",
    [recordId],
    (findError, rows) => {
      if (findError) {
        return res.status(500).json({
          error: "Failed to retrieve member.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          error: "Member not found.",
        });
      }

      const originalData = rows[0];

      if (!isSuperAdmin(req)) {
        return submitChangeRequest(req, res, {
          operation: "update",
          recordId,
          proposedData,
          originalData,
        });
      }

      db.query(
        `UPDATE members
         SET name = ?, designation = ?, member_type = ?
         WHERE id = ?`,
        [
          proposedData.name,
          proposedData.designation,
          proposedData.member_type,
          recordId,
        ],
        (err) => {
          if (err) {
            return res.status(500).json({
              error: "Update failed.",
            });
          }

          return res.json({
            message: "Member updated successfully.",
          });
        }
      );
    }
  );
});

// DELETE ALL MEMBERS OF A CATEGORY
// Must be above DELETE /:id.
router.delete("/type/:type", auth, (req, res) => {
  const { type } = req.params;

  if (!VALID_MEMBER_TYPES.includes(type)) {
    return res.status(400).json({
      message: "Invalid member type.",
    });
  }

  db.query(
    "SELECT * FROM members WHERE member_type = ?",
    [type],
    (findError, rows) => {
      if (findError) {
        return res.status(500).json({
          message: "Failed to retrieve member records.",
        });
      }

      if (!rows.length) {
        return res.json({
          message: "No member records found in this category.",
          deletedCount: 0,
        });
      }

      if (!isSuperAdmin(req)) {
        return submitChangeRequest(req, res, {
          operation: "bulk_delete",
          proposedData: { member_type: type },
          originalData: rows,
        });
      }

      db.query(
        "DELETE FROM members WHERE member_type = ?",
        [type],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              message: "Failed to delete member records.",
            });
          }

          return res.json({
            message: `${result.affectedRows} member records deleted successfully.`,
            deletedCount: result.affectedRows,
          });
        }
      );
    }
  );
});

// DELETE A SINGLE MEMBER
router.delete("/:id", auth, (req, res) => {
  const recordId = Number(req.params.id);

  if (!Number.isSafeInteger(recordId) || recordId < 1) {
    return res.status(400).json({
      error: "Invalid member ID.",
    });
  }

  db.query(
    "SELECT * FROM members WHERE id = ?",
    [recordId],
    (findError, rows) => {
      if (findError) {
        return res.status(500).json({
          error: "Failed to retrieve member.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          error: "Member not found.",
        });
      }

      const originalData = rows[0];

      if (!isSuperAdmin(req)) {
        return submitChangeRequest(req, res, {
          operation: "delete",
          recordId,
          proposedData: originalData,
          originalData,
        });
      }

      db.query(
        "DELETE FROM members WHERE id = ?",
        [recordId],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              error: "Delete failed.",
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              error: "Member not found.",
            });
          }

          return res.json({
            message: "Member deleted successfully.",
          });
        }
      );
    }
  );
});

module.exports = router;
