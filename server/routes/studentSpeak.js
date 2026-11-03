const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");
const multer = require("multer");

const {
  sendApprovalNotification,
  sendSubmissionConfirmation,
} = require("../utils/mailer");


// ================= FILE UPLOAD =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "");
    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({ storage });

// ================= CONSTANTS =================
const ENTITY_TYPE = "student_speak";

// ================= HELPERS =================
const isSuperAdmin = (req) => req.admin?.role === "superadmin";

const generateImageMetadata = (data) => ({
  image_title: `${data.name || ""} - ${data.degree_specialization || ""}`,
  image_alt: `Photo of ${data.name || ""}, ${data.designation || ""} at ${data.company || ""}`,
});

const buildStudentData = (body, image) => {
  const data = {
    name: body.name?.trim(),
    degree_specialization: body.degree_specialization || null,
    year_of_passing: body.year_of_passing || null,
    designation: body.designation || null,
    company: body.company || null,
    message: body.message?.trim(),
    image: image || null,
  };

  return {
    ...data,
    ...generateImageMetadata(data),
  };
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
        console.error("Student Speak change request error:", err);

        return res.status(500).json({
          message: "Failed to submit change request.",
        });
      }

      const requestId = result.insertId;
      const adminId = req.admin.id;
      const adminEmail = req.admin.email;
      const entityType = ENTITY_TYPE || "student_speak";

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
          "Student Speak approval notification failed:",
          emailError.message
        );
      });

      // 2. Confirm submission to the requesting admin.
      if (!adminEmail) {
        console.error(
          `Student Speak request ${requestId}: submitting admin email is missing.`
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
          "Student Speak submission confirmation failed:",
          emailError.message
        );
      });
    }
  );
};

const getStudentById = (id, callback) => {
  db.query(
    "SELECT * FROM student_speak WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return callback(err);
      if (!results.length) return callback(null, null);
      return callback(null, results[0]);
    }
  );
};

// ================= GET MY CHANGE REQUESTS =================
// Keep this route before GET /:id.

router.get("/my-requests", auth, (req, res) => {
  const sql = `
    SELECT *
    FROM content_change_requests
    WHERE entity_type = ? AND submitted_by = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [ENTITY_TYPE, req.admin.id], (err, results) => {
    if (err) {
      console.error("Student Speak requests error:", err);
      return res.status(500).json({
        message: "Failed to load your change requests.",
      });
    }

    return res.json(results);
  });
});

// ================= GET ALL STUDENT SPEAK =================

router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM student_speak ORDER BY id DESC",
    (err, results) => {
      if (err) {
        console.error("Get Student Speak error:", err);
        return res.status(500).json({
          message: "Database error",
        });
      }

      return res.json(results);
    }
  );
});

// ================= CREATE STUDENT SPEAK =================

router.post("/", auth, upload.single("image"), (req, res) => {
  const { name, message } = req.body;

  if (!name || !name.trim() || !message || !message.trim()) {
    return res.status(400).json({
      message: "Name and Message are required.",
    });
  }

  const image = req.file ? req.file.filename : null;
  const data = buildStudentData(req.body, image);

  // Regular admins submit a request for approval.
  if (!isSuperAdmin(req)) {
    return createChangeRequest(req, res, {
      operation: "create",
      proposedData: data,
      message: "Student Speak creation submitted for approval.",
    });
  }

  // Superadmin creates the record directly.
  const sql = `
    INSERT INTO student_speak
    (
      name,
      degree_specialization,
      year_of_passing,
      designation,
      company,
      message,
      image,
      image_title,
      image_alt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      data.name,
      data.degree_specialization,
      data.year_of_passing,
      data.designation,
      data.company,
      data.message,
      data.image,
      data.image_title,
      data.image_alt,
    ],
    (err, result) => {
      if (err) {
        console.error("Create Student Speak error:", err);
        return res.status(500).json({
          message: "Failed to add Student Speak.",
        });
      }

      return res.status(201).json({
        message: "Student Speak added successfully.",
        id: result.insertId,
      });
    }
  );
});

// ================= GET SINGLE STUDENT SPEAK =================

router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM student_speak WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) {
        console.error("Get Student Speak record error:", err);
        return res.status(500).json({
          message: "Database error",
        });
      }

      if (!results.length) {
        return res.status(404).json({
          message: "Student record not found.",
        });
      }

      return res.json(results[0]);
    }
  );
});

// ================= UPDATE STUDENT SPEAK =================

router.put("/:id", auth, upload.single("image"), (req, res) => {
  const { name, message } = req.body;
  const id = req.params.id;

  if (!name || !name.trim() || !message || !message.trim()) {
    return res.status(400).json({
      message: "Name and Message are required.",
    });
  }

  getStudentById(id, (err, existingRecord) => {
    if (err) {
      console.error("Find Student Speak error:", err);
      return res.status(500).json({
        message: "Database error",
      });
    }

    if (!existingRecord) {
      return res.status(404).json({
        message: "Student record not found.",
      });
    }

    const image = req.file
      ? req.file.filename
      : existingRecord.image;

    const data = buildStudentData(req.body, image);

    // Regular admins submit a request for approval.
    if (!isSuperAdmin(req)) {
      return createChangeRequest(req, res, {
        recordId: id,
        operation: "update",
        proposedData: data,
        originalData: existingRecord,
        message: "Student Speak update submitted for approval.",
      });
    }

    // Superadmin updates the record directly.
    const sql = `
      UPDATE student_speak
      SET
        name = ?,
        degree_specialization = ?,
        year_of_passing = ?,
        designation = ?,
        company = ?,
        message = ?,
        image = ?,
        image_title = ?,
        image_alt = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        data.name,
        data.degree_specialization,
        data.year_of_passing,
        data.designation,
        data.company,
        data.message,
        data.image,
        data.image_title,
        data.image_alt,
        id,
      ],
      (updateErr) => {
        if (updateErr) {
          console.error("Update Student Speak error:", updateErr);
          return res.status(500).json({
            message: "Update failed.",
          });
        }

        return res.json({
          message: "Student Speak updated successfully.",
        });
      }
    );
  });
});

// ================= DELETE ALL STUDENTS =================
// DELETE /api/student-speak/delete-all

router.delete("/delete-all", auth, (req, res) => {
  db.query("SELECT * FROM student_speak", (err, records) => {
    if (err) {
      console.error("Get Student Speak records error:", err);
      return res.status(500).json({
        message: "Failed to retrieve student records.",
      });
    }

    if (records.length === 0) {
      return res.json({
        message: "No student records to delete.",
        deletedCount: 0,
      });
    }

    const ids = records.map((record) => record.id);

    // Regular admins request deletion of the selected existing records.
    if (!isSuperAdmin(req)) {
      return createChangeRequest(req, res, {
        operation: "delete_all",
        proposedData: { ids },
        originalData: records,
        message: "Delete-all request submitted for approval.",
      });
    }

    // Superadmin deletes directly.
    db.query(
      "DELETE FROM student_speak WHERE id IN (?)",
      [ids],
      (deleteErr, result) => {
        if (deleteErr) {
          console.error("Delete all Student Speak error:", deleteErr);
          return res.status(500).json({
            message: "Failed to delete all student records.",
          });
        }

        return res.json({
          message: "All student records deleted successfully.",
          deletedCount: result.affectedRows,
        });
      }
    );
  });
});

// ================= DELETE SINGLE STUDENT SPEAK =================
// DELETE /api/student-speak/:id

router.delete("/:id", auth, (req, res) => {
  const id = req.params.id;

  getStudentById(id, (err, existingRecord) => {
    if (err) {
      console.error("Find Student Speak error:", err);
      return res.status(500).json({
        message: "Database error",
      });
    }

    if (!existingRecord) {
      return res.status(404).json({
        message: "Student record not found.",
      });
    }

    // Regular admins submit a request for approval.
    if (!isSuperAdmin(req)) {
      return createChangeRequest(req, res, {
        recordId: id,
        operation: "delete",
        proposedData: { id: Number(id) },
        originalData: existingRecord,
        message: "Student Speak deletion submitted for approval.",
      });
    }

    // Superadmin deletes directly.
    db.query(
      "DELETE FROM student_speak WHERE id = ?",
      [id],
      (deleteErr, result) => {
        if (deleteErr) {
          console.error("Delete Student Speak error:", deleteErr);
          return res.status(500).json({
            message: "Delete failed.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            message: "Student record not found.",
          });
        }

        return res.json({
          message: "Student Speak deleted successfully.",
        });
      }
    );
  });
});

module.exports = router;
