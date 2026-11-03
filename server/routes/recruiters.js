const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const {
  sendApprovalNotification,
  sendSubmissionConfirmation,
} = require("../utils/mailer");


// ================= FILE UPLOAD =================

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({ storage });

// ================= COMMON HELPERS =================

const ENTITY_TYPE = "recruiters";

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
        console.error("Recruiter change request error:", err);

        return res.status(500).json({
          message: "Failed to submit change request.",
        });
      }

      const requestId = result.insertId;
      const adminId = req.admin.id;
      const adminEmail = req.admin.email;
      const entityType = ENTITY_TYPE || "recruiters";

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
          "Recruiter approval notification failed:",
          emailError.message
        );
      });

      // 2. Confirm submission to the requesting admin.
      if (!adminEmail) {
        console.error(
          `Recruiter request ${requestId}: submitting admin email is missing.`
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
          "Recruiter submission confirmation failed:",
          emailError.message
        );
      });
    }
  );
};

const getRecruiterById = (id, callback) => {
  db.query(
    "SELECT * FROM recruiters WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || null);
    }
  );
};

// ================= GET ALL RECRUITERS =================
// GET /api/recruiters

router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM recruiters ORDER BY display_order ASC, id ASC",
    (err, result) => {
      if (err) {
        console.error("Fetch recruiters error:", err);

        return res.status(500).json({
          message: "Failed to fetch recruiters.",
        });
      }

      res.json(result);
    }
  );
});

// ================= GET MY CHANGE REQUESTS =================
// GET /api/recruiters/my-requests

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
      console.error("Fetch recruiter requests error:", err);

      return res.status(500).json({
        message: "Failed to fetch change requests.",
      });
    }

    res.json(result);
  });
});

// ================= CREATE RECRUITER =================
// POST /api/recruiters

router.post("/", auth, upload.single("logo"), (req, res) => {
  const { company_name, display_order } = req.body;

  if (!company_name || !company_name.trim()) {
    deleteUploadedFile(req.file?.path);

    return res.status(400).json({
      message: "Company name is required.",
    });
  }

  const parsedOrder =
    display_order === undefined ||
      display_order === null ||
      display_order === ""
      ? 0
      : Number(display_order);

  if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
    deleteUploadedFile(req.file?.path);

    return res.status(400).json({
      message: "Display order must be a non-negative integer.",
    });
  }

  const recruiter = {
    company_name: company_name.trim(),
    logo: req.file ? req.file.filename : null,
    display_order: parsedOrder,
  };

  // Admin: request approval
  if (!isSuperAdmin(req)) {
    return submitChangeRequest(req, res, {
      operation: "create",
      proposedData: recruiter,
    });
  }

  // Superadmin: insert directly
  const sql = `
    INSERT INTO recruiters (company_name, logo, display_order)
    VALUES (?, ?, ?)
  `;

  db.query(
    sql,
    [
      recruiter.company_name,
      recruiter.logo,
      recruiter.display_order,
    ],
    (err, result) => {
      if (err) {
        deleteUploadedFile(req.file?.path);
        console.error("Create recruiter error:", err);

        return res.status(500).json({
          message: "Failed to add recruiter.",
        });
      }

      res.status(201).json({
        message: "Recruiter added successfully.",
        id: result.insertId,
      });
    }
  );
});

// ================= UPDATE RECRUITER =================
// PUT /api/recruiters/:id

router.put("/:id", auth, upload.single("logo"), (req, res) => {
  const id = Number(req.params.id);
  const { company_name, display_order } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    deleteUploadedFile(req.file?.path);

    return res.status(400).json({
      message: "Invalid recruiter ID.",
    });
  }

  if (!company_name || !company_name.trim()) {
    deleteUploadedFile(req.file?.path);

    return res.status(400).json({
      message: "Company name is required.",
    });
  }

  const parsedOrder =
    display_order === undefined ||
      display_order === null ||
      display_order === ""
      ? 0
      : Number(display_order);

  if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
    deleteUploadedFile(req.file?.path);

    return res.status(400).json({
      message: "Display order must be a non-negative integer.",
    });
  }

  getRecruiterById(id, (err, existingRecruiter) => {
    if (err) {
      deleteUploadedFile(req.file?.path);

      return res.status(500).json({
        message: "Failed to fetch recruiter.",
      });
    }

    if (!existingRecruiter) {
      deleteUploadedFile(req.file?.path);

      return res.status(404).json({
        message: "Recruiter not found.",
      });
    }

    const updatedRecruiter = {
      company_name: company_name.trim(),
      logo: req.file
        ? req.file.filename
        : existingRecruiter.logo,
      display_order: parsedOrder,
    };

    // Admin: request approval
    if (!isSuperAdmin(req)) {
      return submitChangeRequest(req, res, {
        recordId: id,
        operation: "update",
        proposedData: updatedRecruiter,
        originalData: existingRecruiter,
      });
    }

    // Superadmin: update directly
    const sql = `
      UPDATE recruiters
      SET company_name = ?,
          logo = ?,
          display_order = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        updatedRecruiter.company_name,
        updatedRecruiter.logo,
        updatedRecruiter.display_order,
        id,
      ],
      (updateErr) => {
        if (updateErr) {
          deleteUploadedFile(req.file?.path);
          console.error("Update recruiter error:", updateErr);

          return res.status(500).json({
            message: "Failed to update recruiter.",
          });
        }

        res.json({
          message: "Recruiter updated successfully.",
        });
      }
    );
  });
});

// ================= DELETE ALL RECRUITERS =================
// DELETE /api/recruiters/delete-all

router.delete("/delete-all", auth, (req, res) => {
  db.query("SELECT * FROM recruiters", (err, recruiters) => {
    if (err) {
      console.error("Fetch recruiters for deletion error:", err);

      return res.status(500).json({
        message: "Failed to retrieve recruiter records.",
      });
    }

    if (recruiters.length === 0) {
      return res.json({
        message: "No recruiter records found.",
        deletedCount: 0,
      });
    }

    // Admin: request deletion of the exact records found
    if (!isSuperAdmin(req)) {
      return submitChangeRequest(req, res, {
        operation: "delete_all",
        proposedData: {
          ids: recruiters.map((item) => item.id),
        },
        originalData: recruiters,
      });
    }

    // Superadmin: delete directly
    db.query("DELETE FROM recruiters", (deleteErr, result) => {
      if (deleteErr) {
        console.error("Delete all recruiters error:", deleteErr);

        return res.status(500).json({
          message: "Failed to delete recruiter records.",
        });
      }

      res.json({
        message: "All recruiter records deleted successfully.",
        deletedCount: result.affectedRows,
      });
    });
  });
});

// ================= DELETE SINGLE RECRUITER =================
// DELETE /api/recruiters/:id

router.delete("/:id", auth, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid recruiter ID.",
    });
  }

  getRecruiterById(id, (err, recruiter) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch recruiter.",
      });
    }

    if (!recruiter) {
      return res.status(404).json({
        message: "Recruiter not found.",
      });
    }

    // Admin: request approval
    if (!isSuperAdmin(req)) {
      return submitChangeRequest(req, res, {
        recordId: id,
        operation: "delete",
        proposedData: { id },
        originalData: recruiter,
      });
    }

    // Superadmin: delete directly
    db.query(
      "DELETE FROM recruiters WHERE id = ?",
      [id],
      (deleteErr, result) => {
        if (deleteErr) {
          console.error("Delete recruiter error:", deleteErr);

          return res.status(500).json({
            message: "Failed to delete recruiter.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Recruiter not found.",
          });
        }

        res.json({
          message: "Recruiter deleted successfully.",
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
      message: err.message,
    });
  }

  console.error("Recruiter router error:", err);

  res.status(400).json({
    message: err.message || "Request failed.",
  });
});

module.exports = router;
