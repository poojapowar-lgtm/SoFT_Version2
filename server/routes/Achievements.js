
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
    sendApprovalNotification,
    sendSubmissionConfirmation,
} = require("../utils/mailer");

// ================= IMAGE UPLOAD =================

const uploadDir = path.join(__dirname, "../uploads/achievements");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024, // 100 KB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG and WEBP images are allowed."));
        }

        cb(null, true);
    },
});

const ENTITY_TYPE = "achievements";

const VALID_TYPES = ["Faculty", "Student"];

// ================= COMMON HELPERS =================

const isSuperAdmin = (req) =>
    req.admin && req.admin.role === "superadmin";

const removeUploadedFile = (filePath) => {
    if (!filePath) return;

    const fullPath = path.join(
        __dirname,
        "..",
        filePath.replace(/^[/\\]+/, "")
    );

    if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
            if (err) {
                console.error("Image cleanup error:", err);
            }
        });
    }
};

// ================= APPROVAL REQUEST =================

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
                console.error("Achievement request error:", err);

                if (req.file) {
                    removeUploadedFile(
                        `uploads/achievements/${req.file.filename}`
                    );
                }

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

            // Notify Super Admin
            sendApprovalNotification({
                requestId,
                entityType: ENTITY_TYPE,
                operation,
                requestedBy: adminEmail || `Admin ID: ${adminId}`,
            }).catch((emailError) => {
                console.error(
                    "Achievement approval notification failed:",
                    emailError.message
                );
            });

            // Confirm submission to Admin
            if (!adminEmail) {
                console.error(
                    `Achievement request ${requestId}: Admin email missing.`
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
                    "Achievement submission confirmation failed:",
                    emailError.message
                );
            });
        }
    );
};

// ================= DATABASE HELPERS =================

const getRecordById = (id, callback) => {
    db.query(
        "SELECT * FROM achievements WHERE id = ?",
        [id],
        (err, rows) => {
            if (err) return callback(err);
            callback(null, rows[0] || null);
        }
    );
};

const normalizeAchievementRecord = (record) => ({
    achievement_type: record.achievement_type,
    name: record.name.trim(),
    academic_year: record.academic_year?.trim() || null,
    event_category: record.event_category?.trim() || null,
    competition_activity:
        record.competition_activity?.trim() || null,
    image_path: record.image_path || null,
    description: record.description?.trim() || null,
});

const validateRecord = (record) => {
    if (!VALID_TYPES.includes(record.achievement_type)) {
        return "Invalid achievement type. Select Faculty or Student.";
    }

    if (!record.name?.trim()) {
        return "Name is required.";
    }

    if (!record.academic_year?.trim()) {
        return "Academic Year is required.";
    }

    if (!record.event_category?.trim()) {
        return "Event/Category is required.";
    }

    // competition_activity is optional

    return null;
};

const insertRecords = (records, callback) => {
    if (!records.length) {
        return callback(null, { affectedRows: 0 });
    }

    const values = records.map((record) => [
        record.achievement_type,
        record.name,
        record.academic_year,
        record.event_category,
        record.competition_activity,
        record.image_path,
        record.description,
    ]);

    const sql = `
    INSERT INTO achievements
    (
      achievement_type,
      name,
      academic_year,
      event_category,
      competition_activity,
      image_path,
      description
    )
    VALUES ?
  `;

    db.query(sql, [values], callback);
};

// ================= GET ALL ACHIEVEMENTS =================
// GET /api/achievements
// GET /api/achievements?type=Faculty
// GET /api/achievements?type=Student

router.get("/", (req, res) => {
    const { type } = req.query;

    let sql = "SELECT * FROM achievements";
    const values = [];

    if (type) {
        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({
                error: "Invalid achievement type. Use Faculty or Student.",
            });
        }

        sql += " WHERE achievement_type = ?";
        values.push(type);
    }

    sql += " ORDER BY created_at DESC, id DESC";

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Fetch achievements error:", err);

            return res.status(500).json({
                error: "Database error while fetching achievements.",
            });
        }

        res.json(result);
    });
});

// ================= GET MY CHANGE REQUESTS =================
// GET /api/achievements/my-requests

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
            console.error("Fetch achievement requests error:", err);

            return res.status(500).json({
                message: "Failed to fetch change requests.",
            });
        }

        res.json(result);
    });
});

// ================= ADD ACHIEVEMENT =================
// POST /api/achievements
// Content-Type: multipart/form-data
//
// Fields:
// achievement_type
// name
// academic_year
// event_category
// competition_activity
// description
// image

router.post("/", auth, (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                error: "Image size must not exceed 100 KB.",
            });
        }

        if (err) {
            return res.status(400).json({
                error: err.message,
            });
        }

        next();
    });
}, (req, res) => {

    const {
        achievement_type,
        name,
        academic_year,
        event_category,
        competition_activity,
        description,
    } = req.body;

    const record = {
        achievement_type,
        name,
        academic_year,
        event_category,
        competition_activity,
        description,
        image_path: req.file
            ? `uploads/achievements/${req.file.filename}`
            : null,
    };

    const validationError = validateRecord(record);

    if (validationError) {
        if (req.file) {
            removeUploadedFile(record.image_path);
        }

        return res.status(400).json({
            error: validationError,
        });
    }

    const normalizedRecord =
        normalizeAchievementRecord(record);

    // Admin: request approval
    if (!isSuperAdmin(req)) {
        return submitChangeRequest(req, res, {
            operation: "create",
            proposedData: normalizedRecord,
        });
    }

    // Superadmin: insert directly
    insertRecords([normalizedRecord], (err, result) => {
        if (err) {
            console.error("Insert achievement error:", err);

            removeUploadedFile(normalizedRecord.image_path);

            return res.status(500).json({
                error: "Failed to add achievement.",
            });
        }

        res.status(201).json({
            message: "Achievement added successfully.",
            id: result.insertId,
        });
    });
});

// ================= UPDATE ACHIEVEMENT =================
// PUT /api/achievements/:id
// Content-Type: multipart/form-data

router.put("/:id", auth, upload.single("image"), (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        if (req.file) {
            removeUploadedFile(`uploads/achievements/${req.file.filename}`);
        }

        return res.status(400).json({
            error: "Invalid achievement ID.",
        });
    }

    getRecordById(id, (err, existingRecord) => {
        if (err) {
            if (req.file) {
                removeUploadedFile(`uploads/achievements/${req.file.filename}`);
            }

            return res.status(500).json({
                error: "Failed to fetch achievement.",
            });
        }

        if (!existingRecord) {
            if (req.file) {
                removeUploadedFile(`uploads/achievements/${req.file.filename}`);
            }

            return res.status(404).json({
                error: "Achievement not found.",
            });
        }

        const {
            achievement_type,
            name,
            academic_year,
            event_category,
            competition_activity,
            description,
        } = req.body;

        const record = {
            achievement_type,
            name,
            academic_year,
            event_category,
            competition_activity,
            description,
            image_path: req.file
                ? `uploads/achievements/${req.file.filename}`
                : existingRecord.image_path,
        };

        const validationError = validateRecord(record);

        if (validationError) {
            if (req.file) {
                removeUploadedFile(record.image_path);
            }

            return res.status(400).json({
                error: validationError,
            });
        }

        const normalizedRecord =
            normalizeAchievementRecord(record);

        // Admin: request approval
        if (!isSuperAdmin(req)) {
            return submitChangeRequest(req, res, {
                recordId: id,
                operation: "update",
                proposedData: normalizedRecord,
                originalData: existingRecord,
            });
        }

        // Superadmin: update directly
        const sql = `
      UPDATE achievements
      SET achievement_type = ?,
          name = ?,
          academic_year = ?,
          event_category = ?,
          competition_activity = ?,
          image_path = ?,
          description = ?
      WHERE id = ?
    `;

        db.query(
            sql,
            [
                normalizedRecord.achievement_type,
                normalizedRecord.name,
                normalizedRecord.academic_year,
                normalizedRecord.event_category,
                normalizedRecord.competition_activity,
                normalizedRecord.image_path,
                normalizedRecord.description,
                id,
            ],
            (updateErr) => {
                if (updateErr) {
                    console.error("Update achievement error:", updateErr);

                    if (req.file) {
                        removeUploadedFile(record.image_path);
                    }

                    return res.status(500).json({
                        error: "Failed to update achievement.",
                    });
                }

                res.json({
                    message: "Achievement updated successfully.",
                });
            }
        );
    });
});

// ================= DELETE ALL SECTION RECORDS =================
// DELETE /api/achievements/type/Faculty
// DELETE /api/achievements/type/Student
//
// Keep this route above DELETE /:id.

router.delete("/type/:type", auth, (req, res) => {
    const { type } = req.params;

    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
            message: "Invalid achievement type.",
        });
    }

    db.query(
        "SELECT * FROM achievements WHERE achievement_type = ?",
        [type],
        (err, records) => {
            if (err) {
                console.error("Fetch achievement records error:", err);

                return res.status(500).json({
                    message: "Failed to retrieve achievement records.",
                });
            }

            if (records.length === 0) {
                return res.json({
                    message: "No achievements found in this section.",
                    deletedCount: 0,
                });
            }

            // Admin: request deletion
            if (!isSuperAdmin(req)) {
                return submitChangeRequest(req, res, {
                    operation: "delete_by_type",
                    proposedData: {
                        achievement_type: type,
                        ids: records.map((record) => record.id),
                    },
                    originalData: records,
                });
            }

            // Superadmin: delete directly
            db.query(
                "DELETE FROM achievements WHERE achievement_type = ?",
                [type],
                (deleteErr, result) => {
                    if (deleteErr) {
                        console.error("Delete achievement section error:", deleteErr);

                        return res.status(500).json({
                            message: "Failed to delete achievements.",
                        });
                    }

                    res.json({
                        message: `${result.affectedRows} achievements deleted successfully.`,
                        deletedCount: result.affectedRows,
                    });
                }
            );
        }
    );
});

// ================= DELETE SINGLE ACHIEVEMENT =================
// DELETE /api/achievements/:id

router.delete("/:id", auth, (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            error: "Invalid achievement ID.",
        });
    }

    getRecordById(id, (err, record) => {
        if (err) {
            return res.status(500).json({
                error: "Failed to fetch achievement.",
            });
        }

        if (!record) {
            return res.status(404).json({
                error: "Achievement not found.",
            });
        }

        // Admin: request approval
        if (!isSuperAdmin(req)) {
            return submitChangeRequest(req, res, {
                recordId: id,
                operation: "delete",
                proposedData: { id },
                originalData: record,
            });
        }

        // Superadmin: delete directly
        db.query(
            "DELETE FROM achievements WHERE id = ?",
            [id],
            (deleteErr, result) => {
                if (deleteErr) {
                    console.error("Delete achievement error:", deleteErr);

                    return res.status(500).json({
                        error: "Failed to delete achievement.",
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        error: "Achievement not found.",
                    });
                }

                res.json({
                    message: "Achievement deleted successfully.",
                });
            }
        );
    });
});

// ================= MULTER ERROR HANDLER =================

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            message:
                err.code === "LIMIT_FILE_SIZE"
                    ? "Image size must not exceed 5 MB."
                    : err.message,
        });
    }

    if (err) {
        return res.status(400).json({
            message: err.message || "Image upload failed.",
        });
    }

    next();
});

module.exports = router;
