const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const authorizeRole = require("../middleware/authorizeRole");

const {
  sendReviewResultNotification,
} = require("../utils/mailer");

// ============================================
// DASHBOARD API
// Authentication is applied in server.js
// ============================================

router.get("/dashboard", (req, res) => {
  const queries = [
    { key: "news", sql: "SELECT COUNT(*) AS total FROM news" },
    { key: "events", sql: "SELECT COUNT(*) AS total FROM events" },
    { key: "enquiries", sql: "SELECT COUNT(*) AS total FROM enquiries" },
    { key: "members", sql: "SELECT COUNT(*) AS total FROM members" },
    { key: "studentSpeak", sql: "SELECT COUNT(*) AS total FROM student_speak" },
    { key: "recruiters", sql: "SELECT COUNT(*) AS total FROM recruiters" },
    { key: "faculty", sql: "SELECT COUNT(*) AS total FROM faculty" },
    { key: "research", sql: "SELECT COUNT(*) AS total FROM research_students" },
    { key: "mou", sql: "SELECT COUNT(*) AS total FROM mou" },
    { key: "placedStudents", sql: "SELECT COUNT(*) AS total FROM placed_students" },
    { key: "alumniStartup", sql: "SELECT COUNT(*) AS total FROM alumni_startups" },

    // Additional dashboard modules
    { key: "examinationSchedule", sql: "SELECT COUNT(*) AS total FROM examination_schedule" },
    { key: "academicCalendar", sql: "SELECT COUNT(*) AS total FROM academic_calendar" },
    { key: "studentGrievance", sql: "SELECT COUNT(*) AS total FROM student_grievance" },
    { key: "faq", sql: "SELECT COUNT(*) AS total FROM faqs" },
    { key: "patentPublication", sql: "SELECT COUNT(*) AS total FROM patent_publications" },
    { key: "fundedResearch", sql: "SELECT COUNT(*) AS total FROM funded_research" },
    { key: "consultancyProjects", sql: "SELECT COUNT(*) AS total FROM consultancy_projects" },
    { key: "testimonials", sql: "SELECT COUNT(*) AS total FROM testimonials" },
  ];

  const data = {};
  let completed = 0;
  let responseSent = false;

  queries.forEach(({ key, sql }) => {
    db.query(sql, (err, results) => {
      if (responseSent) return;

      if (err) {
        responseSent = true;
        console.error(`Dashboard count failed for ${key}:`, err.message);

        return res.status(500).json({
          message: "Failed to load dashboard counts.",
          field: key,
        });
      }

      data[key] = Number(results[0]?.total ?? 0);
      completed += 1;

      if (completed === queries.length) {
        responseSent = true;

        return res.json({
          ...data,
          currentUser: {
            id: req.admin.id,
            email: req.admin.email,
            role: req.admin.role,
          },
        });
      }
    });
  });
});


// ============================================
// SUPERADMIN CHECK
// ============================================
// GET /api/admin/approvals?status=pending
/* GET /api/admin/my-requests
   Each admin can see only their own requests.
   Authentication is applied in server.js.
*/
// GET approval requests (superadmin only)
router.get(
  "/approvals",
  authorizeRole("superadmin"),
  (req, res) => {
    const status = String(req.query.status || "pending")
      .trim()
      .toLowerCase();

    const allowedStatuses = ["pending", "approved", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid approval status.",
        allowedStatuses,
      });
    }

    const sql = `
      SELECT
        ccr.*,
        submitter.full_name AS submitted_by_name,
        submitter.email AS submitted_by_email,
        reviewer.full_name AS reviewed_by_name
      FROM content_change_requests ccr
      LEFT JOIN admins submitter
        ON submitter.id = ccr.submitted_by
      LEFT JOIN admins reviewer
        ON reviewer.id = ccr.reviewed_by
      WHERE ccr.status = ?
      ORDER BY ccr.submitted_at DESC, ccr.id DESC
    `;

    db.query(sql, [status], (err, results) => {
      if (err) {
        console.error("Fetch approvals error:", err.message);

        return res.status(500).json({
          message: "Failed to fetch approval requests.",
        });
      }

      return res.json({
        requests: results,
        status,
        count: results.length,
      });
    });
  }
);


// POST /api/admin/approvals/:id/approve
router.post(
  "/approvals/:id/approve",
  authorizeRole("superadmin"),
  (req, res) => {
    const requestId = Number(req.params.id);

    if (!Number.isSafeInteger(requestId) || requestId < 1) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    // This implementation requires db to be a MySQL pool
    // exposing getConnection().
    if (typeof db.getConnection !== "function") {
      return res.status(500).json({
        message:
          "Approval transactions require a MySQL connection pool. Check config/db.",
      });
    }

    db.getConnection((connectionError, connection) => {
      if (connectionError) {
        console.error("Approval connection error:", connectionError.message);
        return res.status(500).json({
          message: "Unable to start the approval process.",
        });
      }

      let responseSent = false;

      const finish = (statusCode, body) => {
        if (responseSent) return;
        responseSent = true;
        connection.release();
        return res.status(statusCode).json(body);
      };

      const failTransaction = (statusCode, body) => {
        connection.rollback(() => finish(statusCode, body));
      };

      connection.beginTransaction((transactionError) => {
        if (transactionError) {
          return finish(500, {
            message: "Unable to start approval transaction.",
          });
        }

        connection.query(
          `SELECT *
           FROM content_change_requests
           WHERE id = ?
           FOR UPDATE`,
          [requestId],
          (selectError, rows) => {
            if (selectError) {
              console.error("Load approval error:", selectError.message);
              return failTransaction(500, {
                message: "Failed to load the approval request.",
              });
            }

            if (!rows.length) {
              return failTransaction(404, {
                message: "Approval request not found.",
              });
            }

            const request = rows[0];

            if (request.status !== "pending") {
              return failTransaction(409, {
                message: "This request has already been reviewed.",
              });
            }

            // Add explicit, trusted handlers for more modules later.
            if (
              !["news", "examination_schedule", "members", "faculty", "mou", "academic_calendar", "alumni_startups", "consultancy_projects", "events", "faqs", "funded_research", "patent_publications", "placed_students", "recruiters", "research_students", "student_grievance", "student_speak", "testimonials"].includes(request.entity_type)
            ) {
              return failTransaction(422, {
                message:
                  "Approval for this module has not been implemented yet.",
                entityType: request.entity_type,
              });
            }

            let proposed;

            try {
              proposed =
                typeof request.proposed_data === "string"
                  ? JSON.parse(request.proposed_data)
                  : request.proposed_data;
            } catch {
              return failTransaction(400, {
                message: "The proposed request data is invalid.",
              });
            }

            // Validate proposed data
            if (
              !proposed ||
              typeof proposed !== "object" ||
              (Array.isArray(proposed) && request.operation !== "bulk_create") ||
              (!Array.isArray(proposed) && request.operation === "bulk_create")
            ) {
              return failTransaction(400, {
                message: "The proposed request data is invalid.",
              });
            }

            const markApproved = (callback) => {
              connection.query(
                `UPDATE content_change_requests
                 SET status = 'approved',
                     reviewed_by = ?,
                     reviewed_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND status = 'pending'`,
                [req.admin.id, requestId],
                (statusError, result) => {
                  if (statusError) {
                    return failTransaction(500, {
                      message: "Failed to update approval status.",
                    });
                  }

                  if (result.affectedRows !== 1) {
                    return failTransaction(409, {
                      message: "This request has already been reviewed.",
                    });
                  }

                  callback();
                }
              );
            };

            const publishError = (err) => {
              if (err) {
                console.error("Publish approved news error:", err.message);
                return failTransaction(500, {
                  message: "Failed to publish the approved change.",
                });
              }

              markApproved(() => {
                connection.commit((commitError) => {
                  if (commitError) {
                    console.error("Approval commit error:", commitError.message);

                    return connection.rollback(() =>
                      finish(500, {
                        message: "Could not complete approval.",
                      })
                    );
                  }

                  // Return success after the approval has been committed.
                  finish(200, {
                    message: "Request approved and published successfully.",
                    requestId,
                  });

                  // Notify the submitting admin without affecting the approval result.
                  db.query(
                    "SELECT email FROM admins WHERE id = ? LIMIT 1",
                    [request.submitted_by],
                    async (emailError, adminRows) => {
                      if (emailError) {
                        console.error(
                          "Failed to fetch submitting admin email:",
                          emailError.message
                        );
                        return;
                      }

                      const adminEmail = adminRows?.[0]?.email;

                      if (!adminEmail) {
                        console.error(
                          `No email found for submitting admin ID: ${request.submitted_by}`
                        );
                        return;
                      }

                      try {
                        await sendReviewResultNotification({
                          adminEmail,
                          requestId,
                          entityType: request.entity_type,
                          operation: request.operation,
                          status: "approved",
                        });

                        console.log(
                          `Approval notification sent for request #${requestId}`
                        );
                      } catch (emailError) {
                        console.error(
                          "Approval result email failed:",
                          emailError.message
                        );
                      }
                    }
                  );
                });
              });
            };

            // ============================================
            // EXAMINATION SCHEDULE APPROVAL HANDLERS
            // Add after publishError and before News CREATE
            // ============================================
            if (request.entity_type === "examination_schedule") {
              const validateSchedule = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                typeof data.examination === "string" &&
                data.examination.trim() !== "";

              // CREATE
              if (request.operation === "create") {
                if (!validateSchedule(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed examination schedule data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO examination_schedule
                  (examination, odd_semester, even_semester)
                 VALUES (?, ?, ?)`,
                  [
                    proposed.examination.trim(),
                    proposed.odd_semester ?? null,
                    proposed.even_semester ?? null,
                  ],
                  publishError
                );
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target examination schedule ID is invalid.",
                  });
                }

                if (!validateSchedule(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed examination schedule data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE examination_schedule
                 SET examination = ?,
                     odd_semester = ?,
                     even_semester = ?
                 WHERE id = ?`,
                  [
                    proposed.examination.trim(),
                    proposed.odd_semester ?? null,
                    proposed.even_semester ?? null,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    // Verify the record exists even if its values did not change.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM examination_schedule WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message: "The examination schedule record no longer exists.",
                            });
                          }

                          publishError(null);
                        }
                      );
                    }

                    publishError(null);
                  }
                );
              }

              // DELETE
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target examination schedule ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM examination_schedule WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The examination schedule record no longer exists.",
                      });
                    }

                    publishError(null);
                  }
                );
              }

              // BULK CREATE — EXCEL UPLOAD
              if (request.operation === "bulk_create") {
                if (!Array.isArray(proposed) || proposed.length === 0) {
                  return failTransaction(400, {
                    message: "The Excel import contains no schedule records.",
                  });
                }

                if (!proposed.every(validateSchedule)) {
                  return failTransaction(400, {
                    message: "The Excel import contains invalid examination schedule data.",
                  });
                }

                const values = [];
                const placeholders = proposed
                  .map((row) => {
                    values.push(
                      row.examination.trim(),
                      row.odd_semester ?? null,
                      row.even_semester ?? null
                    );
                    return "(?, ?, ?)";
                  })
                  .join(", ");

                return connection.query(
                  `INSERT INTO examination_schedule
                  (examination, odd_semester, even_semester)
                 VALUES ${placeholders}`,
                  values,
                  publishError
                );
              }

              return failTransaction(400, {
                message: "Unsupported operation for examination schedule.",
              });
            }


            // ============================================
            // MEMBERS APPROVAL HANDLERS
            // Insert before the News CREATE handler
            // ============================================
            if (request.entity_type === "members") {
              const validMemberTypes = [
                "governing",
                "board",
                "research_committee",
              ];

              const validateMember = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                typeof data.name === "string" &&
                data.name.trim() !== "" &&
                typeof data.designation === "string" &&
                data.designation.trim() !== "" &&
                validMemberTypes.includes(data.member_type);

              // CREATE MEMBER
              if (request.operation === "create") {
                if (!validateMember(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed member data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO members
                    (name, designation, member_type)
                   VALUES (?, ?, ?)`,
                  [
                    proposed.name.trim(),
                    proposed.designation.trim(),
                    proposed.member_type,
                  ],
                  publishError
                );
              }

              // UPDATE MEMBER
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (
                  !Number.isSafeInteger(recordId) ||
                  recordId < 1
                ) {
                  return failTransaction(400, {
                    message: "The target member ID is invalid.",
                  });
                }

                if (!validateMember(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed member data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE members
                   SET name = ?,
                       designation = ?,
                       member_type = ?
                   WHERE id = ?`,
                  [
                    proposed.name.trim(),
                    proposed.designation.trim(),
                    proposed.member_type,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM members WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) {
                            return publishError(checkError);
                          }

                          if (!rows.length) {
                            return failTransaction(409, {
                              message:
                                "The member no longer exists.",
                            });
                          }

                          publishError(null);
                        }
                      );
                    }

                    publishError(null);
                  }
                );
              }

              // DELETE MEMBER
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (
                  !Number.isSafeInteger(recordId) ||
                  recordId < 1
                ) {
                  return failTransaction(400, {
                    message: "The target member ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM members WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message:
                          "The member no longer exists.",
                      });
                    }

                    publishError(null);
                  }
                );
              }

              // BULK CREATE — EXCEL UPLOAD
              if (request.operation === "bulk_create") {
                if (
                  !Array.isArray(proposed) ||
                  proposed.length === 0 ||
                  !proposed.every(validateMember)
                ) {
                  return failTransaction(400, {
                    message:
                      "The Excel import contains invalid member data.",
                  });
                }

                const values = [];
                const placeholders = proposed
                  .map((member) => {
                    values.push(
                      member.name.trim(),
                      member.designation.trim(),
                      member.member_type
                    );

                    return "(?, ?, ?)";
                  })
                  .join(", ");

                return connection.query(
                  `INSERT INTO members
                    (name, designation, member_type)
                   VALUES ${placeholders}`,
                  values,
                  publishError
                );
              }

              // BULK DELETE — CATEGORY
              if (request.operation === "bulk_delete") {
                const type = proposed?.member_type;

                if (!validMemberTypes.includes(type)) {
                  return failTransaction(400, {
                    message:
                      "The proposed member category is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM members WHERE member_type = ?",
                  [type],
                  publishError
                );
              }

              return failTransaction(400, {
                message: "Unsupported operation for members.",
              });
            }

            // ================= FACULTY APPROVAL =================
            if (request.entity_type === "faculty") {
              const validateFaculty = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                typeof data.name === "string" &&
                data.name.trim() !== "" &&
                typeof data.designation === "string" &&
                data.designation.trim() !== "" &&
                (data.area_of_expertise == null ||
                  typeof data.area_of_expertise === "string") &&
                (data.image == null || typeof data.image === "string");

              // CREATE
              if (request.operation === "create") {
                if (!validateFaculty(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed faculty data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO faculty
        (name, designation, area_of_expertise, image)
       VALUES (?, ?, ?, ?)`,
                  [
                    proposed.name.trim(),
                    proposed.designation.trim(),
                    proposed.area_of_expertise ?? null,
                    proposed.image ?? null,
                  ],
                  publishError
                );
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target faculty ID is invalid.",
                  });
                }

                if (!validateFaculty(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed faculty data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE faculty
       SET name = ?,
           designation = ?,
           area_of_expertise = ?,
           image = ?
       WHERE id = ?`,
                  [
                    proposed.name.trim(),
                    proposed.designation.trim(),
                    proposed.area_of_expertise ?? null,
                    proposed.image ?? null,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    // Handle an unchanged record.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM faculty WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message: "The faculty record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target faculty ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM faculty WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The faculty record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message: `Unsupported faculty operation: ${request.operation}`,
              });
            }

            // ============================================
            // MOU APPROVAL HANDLERS
            // Insert before the News APPROVAL HANDLERS
            // ============================================
            if (request.entity_type === "mou") {
              const validateMou = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                typeof data.company_name === "string" &&
                data.company_name.trim() !== "" &&
                (data.address == null || typeof data.address === "string") &&
                (data.mou_date == null || typeof data.mou_date === "string") &&
                (data.purpose == null || typeof data.purpose === "string") &&
                (data.activities == null || typeof data.activities === "string");

              // CREATE MOU
              if (request.operation === "create") {
                if (!validateMou(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed MOU data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO mou
        (company_name, address, mou_date, purpose, activities)
       VALUES (?, ?, ?, ?, ?)`,
                  [
                    proposed.company_name.trim(),
                    proposed.address ?? null,
                    proposed.mou_date ?? null,
                    proposed.purpose ?? null,
                    proposed.activities ?? null,
                  ],
                  publishError
                );
              }

              // UPDATE MOU
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target MOU ID is invalid.",
                  });
                }

                if (!validateMou(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed MOU data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE mou
       SET company_name = ?,
           address = ?,
           mou_date = ?,
           purpose = ?,
           activities = ?
       WHERE id = ?`,
                  [
                    proposed.company_name.trim(),
                    proposed.address ?? null,
                    proposed.mou_date ?? null,
                    proposed.purpose ?? null,
                    proposed.activities ?? null,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    // An unchanged record can have affectedRows = 0.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM mou WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message: "The MOU record no longer exists.",
                            });
                          }

                          publishError(null);
                        }
                      );
                    }

                    publishError(null);
                  }
                );
              }

              // DELETE MOU
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target MOU ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM mou WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The MOU record no longer exists.",
                      });
                    }

                    publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message: `Unsupported MOU operation: ${request.operation}`,
              });
            }

            // ============================================
            // ACADEMIC CALENDAR APPROVAL HANDLERS
            // Insert before the News APPROVAL HANDLERS
            // ============================================
            if (request.entity_type === "academic_calendar") {
              const validateAcademicCalendar = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                data.sr_no !== undefined &&
                data.sr_no !== null &&
                Number.isInteger(Number(data.sr_no)) &&
                Number(data.sr_no) > 0 &&
                typeof data.program_name === "string" &&
                data.program_name.trim() !== "" &&
                typeof data.date_and_event === "string" &&
                data.date_and_event.trim() !== "";

              // CREATE ACADEMIC CALENDAR RECORD
              if (request.operation === "create") {
                if (!validateAcademicCalendar(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed academic calendar data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO academic_calendar
        (sr_no, program_name, date_and_event)
       VALUES (?, ?, ?)`,
                  [
                    Number(proposed.sr_no),
                    proposed.program_name.trim(),
                    proposed.date_and_event.trim(),
                  ],
                  publishError
                );
              }

              // UPDATE ACADEMIC CALENDAR RECORD
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target academic calendar ID is invalid.",
                  });
                }

                if (!validateAcademicCalendar(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed academic calendar data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE academic_calendar
       SET sr_no = ?,
           program_name = ?,
           date_and_event = ?
       WHERE id = ?`,
                  [
                    Number(proposed.sr_no),
                    proposed.program_name.trim(),
                    proposed.date_and_event.trim(),
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    // An unchanged record can have affectedRows = 0.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM academic_calendar WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message:
                                "The academic calendar record no longer exists.",
                            });
                          }

                          publishError(null);
                        }
                      );
                    }

                    publishError(null);
                  }
                );
              }

              // DELETE ACADEMIC CALENDAR RECORD
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target academic calendar ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM academic_calendar WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message:
                          "The academic calendar record no longer exists.",
                      });
                    }

                    publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message: `Unsupported academic calendar operation: ${request.operation}`,
              });
            }

            // ============================================
            // ALUMNI STARTUPS APPROVAL HANDLERS
            // ============================================
            if (request.entity_type === "alumni_startups") {
              const validateStartup = (data) => {
                if (
                  !data ||
                  typeof data !== "object" ||
                  Array.isArray(data)
                ) {
                  return false;
                }

                const validSrNo =
                  data.sr_no === undefined ||
                  data.sr_no === null ||
                  data.sr_no === "" ||
                  (
                    Number.isInteger(Number(data.sr_no)) &&
                    Number(data.sr_no) >= 0
                  );

                const validOptionalString = (value, maxLength) =>
                  value === undefined ||
                  value === null ||
                  (
                    typeof value === "string" &&
                    value.length <= maxLength
                  );

                return (
                  validSrNo &&
                  typeof data.name === "string" &&
                  data.name.trim() !== "" &&
                  data.name.trim().length <= 255 &&
                  validOptionalString(data.year, 50) &&
                  typeof data.startup === "string" &&
                  data.startup.trim().length <= 255 &&
                  validOptionalString(data.contact, 20) &&
                  validOptionalString(data.email, 255) &&
                  validOptionalString(data.certificate, 255)
                );
              };

              const startupValues = (data) => [
                data.sr_no === undefined ||
                  data.sr_no === null ||
                  data.sr_no === ""
                  ? null
                  : Number(data.sr_no),
                data.name.trim(),
                data.year == null || data.year === ""
                  ? null
                  : String(data.year).trim(),
                data.startup.trim(),
                data.contact == null || data.contact === ""
                  ? null
                  : String(data.contact).trim(),
                data.email == null || data.email === ""
                  ? null
                  : String(data.email).trim(),
                data.certificate == null || data.certificate === ""
                  ? null
                  : String(data.certificate).trim(),
              ];

              // ================= CREATE =================
              if (request.operation === "create") {
                if (!validateStartup(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed alumni startup data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO alumni_startups
       (sr_no, name, year, startup, contact, email, certificate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  startupValues(proposed),
                  publishError
                );
              }

              // ================= UPDATE =================
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target alumni startup ID is invalid.",
                  });
                }

                if (!validateStartup(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed alumni startup data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE alumni_startups
       SET sr_no = ?,
           name = ?,
           year = ?,
           startup = ?,
           contact = ?,
           email = ?,
           certificate = ?
       WHERE id = ?`,
                  [...startupValues(proposed), recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM alumni_startups WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message:
                                "The alumni startup record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // ================= DELETE ONE =================
              if (request.operation === "delete") {
                const recordId = Number(
                  proposed?.id ?? request.record_id
                );

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target alumni startup ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM alumni_startups WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The alumni startup record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              // ================= BULK CREATE / EXCEL IMPORT =================
              if (request.operation === "bulk_create") {
                if (
                  !proposed ||
                  !Array.isArray(proposed.records) ||
                  proposed.records.length === 0
                ) {
                  return failTransaction(400, {
                    message: "The proposed alumni startup records are invalid.",
                  });
                }

                const invalidIndex = proposed.records.findIndex(
                  (record) => !validateStartup(record)
                );

                if (invalidIndex !== -1) {
                  return failTransaction(400, {
                    message:
                      `Invalid alumni startup data in imported record ${invalidIndex + 1}.`,
                  });
                }

                const values = proposed.records.map(startupValues);

                return connection.query(
                  `INSERT INTO alumni_startups
       (sr_no, name, year, startup, contact, email, certificate)
       VALUES ?`,
                  [values],
                  publishError
                );
              }

              // ================= DELETE ALL =================
              if (request.operation === "delete_all") {
                const ids = proposed?.ids;

                if (
                  !Array.isArray(ids) ||
                  ids.length === 0 ||
                  ids.some(
                    (id) =>
                      !Number.isSafeInteger(Number(id)) ||
                      Number(id) < 1
                  )
                ) {
                  return failTransaction(400, {
                    message: "The proposed alumni startup deletion data is invalid.",
                  });
                }

                const uniqueIds = [...new Set(ids.map(Number))];

                return connection.query(
                  "DELETE FROM alumni_startups WHERE id IN (?)",
                  [uniqueIds],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== uniqueIds.length) {
                      return failTransaction(409, {
                        message:
                          "Some alumni startup records no longer exist. Refresh the records and submit a new request.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message:
                  `Unsupported alumni startup operation: ${request.operation}`,
              });
            }

            // ================= CONSULTANCY PROJECTS APPROVAL =================
            if (request.entity_type === "consultancy_projects") {
              // VALIDATION
              const validateProject = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                (
                  data.sr_no === undefined ||
                  data.sr_no === null ||
                  data.sr_no === "" ||
                  (
                    Number.isInteger(Number(data.sr_no)) &&
                    Number(data.sr_no) > 0
                  )
                ) &&
                typeof data.faculty_name === "string" &&
                data.faculty_name.trim() !== "" &&
                typeof data.project_name === "string" &&
                data.project_name.trim() !== "" &&
                data.year !== undefined &&
                data.year !== null &&
                Number.isInteger(Number(data.year)) &&
                Number(data.year) >= 1900 &&
                Number(data.year) <= 9999;

              // NORMALIZE DATA
              const normalizeProject = (data) => ({
                sr_no:
                  data.sr_no === undefined ||
                    data.sr_no === null ||
                    data.sr_no === ""
                    ? null
                    : Number(data.sr_no),

                faculty_name: data.faculty_name.trim(),
                project_name: data.project_name.trim(),
                year: Number(data.year),
              });

              // CREATE
              if (request.operation === "create") {
                if (!validateProject(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed consultancy project data is invalid.",
                  });
                }

                const project = normalizeProject(proposed);

                return connection.query(
                  `INSERT INTO consultancy_projects
        (sr_no, faculty_name, project_name, year)
       VALUES (?, ?, ?, ?)`,
                  [
                    project.sr_no,
                    project.faculty_name,
                    project.project_name,
                    project.year,
                  ],
                  publishError
                );
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target consultancy project ID is invalid.",
                  });
                }

                if (!validateProject(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed consultancy project data is invalid.",
                  });
                }

                const project = normalizeProject(proposed);

                return connection.query(
                  `UPDATE consultancy_projects
       SET sr_no = ?, faculty_name = ?, project_name = ?, year = ?
       WHERE id = ?`,
                  [
                    project.sr_no,
                    project.faculty_name,
                    project.project_name,
                    project.year,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    // Treat unchanged data as a successful update.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM consultancy_projects WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message:
                                "The consultancy project record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target consultancy project ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM consultancy_projects WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message:
                          "The consultancy project record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              // UNSUPPORTED OPERATION
              return failTransaction(400, {
                message: `Unsupported consultancy projects operation: ${request.operation}`,
              });
            }

            // ================= EVENTS APPROVAL =================
            if (request.entity_type === "events") {
              // Parse saved JSON safely and support common wrapper structures.
              const getEventData = (value) => {
                let data = value;

                if (typeof data === "string") {
                  try {
                    data = JSON.parse(data);
                  } catch (error) {
                    return null;
                  }
                }

                if (!data || typeof data !== "object" || Array.isArray(data)) {
                  return null;
                }

                if (data.proposed_data !== undefined) {
                  return getEventData(data.proposed_data);
                }

                if (
                  data.data &&
                  typeof data.data === "object" &&
                  !Array.isArray(data.data) &&
                  data.title === undefined
                ) {
                  return getEventData(data.data);
                }

                return data;
              };

              const eventData = getEventData(proposed);

              // Validate the actual event fields.
              const validateEvent = (data) => {
                if (!data) {
                  return "Event data is missing or is not valid JSON.";
                }

                if (
                  data.title == null ||
                  String(data.title).trim() === ""
                ) {
                  return "The event title is missing.";
                }

                if (
                  data.date == null ||
                  String(data.date).trim() === ""
                ) {
                  return "The event date is missing.";
                }

                const optionalFields = [
                  "description",
                  "file_path",
                  "link_text",
                  "link_url",
                  "doc_path",
                ];

                for (const field of optionalFields) {
                  const value = data[field];

                  if (
                    value != null &&
                    typeof value !== "string" &&
                    typeof value !== "number"
                  ) {
                    return `Invalid event field: ${field}.`;
                  }
                }

                return null;
              };

              // Normalize values to match the events table.
              const normalizeEvent = (data) => {
                const optionalValue = (value) => {
                  if (value == null) return null;

                  if (typeof value === "string") {
                    return value.trim() || null;
                  }

                  return String(value);
                };

                return {
                  title: String(data.title).trim(),
                  date: String(data.date).trim(),
                  description: optionalValue(data.description),
                  file_path: optionalValue(data.file_path),
                  link_text: optionalValue(data.link_text),
                  link_url: optionalValue(data.link_url),
                  doc_path: optionalValue(data.doc_path),
                };
              };

              // ================= CREATE =================
              if (request.operation === "create") {
                const validationError = validateEvent(eventData);

                if (validationError) {
                  console.error("Event approval validation failed:", {
                    requestId: request.id,
                    operation: request.operation,
                    proposed,
                    reason: validationError,
                  });

                  return failTransaction(400, {
                    message: validationError,
                  });
                }

                const event = normalizeEvent(eventData);

                return connection.query(
                  `INSERT INTO events
        (title, date, description, file_path, link_text, link_url, doc_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    event.title,
                    event.date,
                    event.description,
                    event.file_path,
                    event.link_text,
                    event.link_url,
                    event.doc_path,
                  ],
                  publishError
                );
              }

              // ================= UPDATE =================
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target event ID is invalid.",
                  });
                }

                const validationError = validateEvent(eventData);

                if (validationError) {
                  console.error("Event update validation failed:", {
                    requestId: request.id,
                    recordId,
                    proposed,
                    reason: validationError,
                  });

                  return failTransaction(400, {
                    message: validationError,
                  });
                }

                const event = normalizeEvent(eventData);

                return connection.query(
                  `UPDATE events
       SET title = ?,
           date = ?,
           description = ?,
           file_path = ?,
           link_text = ?,
           link_url = ?,
           doc_path = ?
       WHERE id = ?`,
                  [
                    event.title,
                    event.date,
                    event.description,
                    event.file_path,
                    event.link_text,
                    event.link_url,
                    event.doc_path,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM events WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message: "The event record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // ================= DELETE =================
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target event ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM events WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The event record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              // ================= UNSUPPORTED OPERATION =================
              return failTransaction(400, {
                message: `Unsupported event operation: ${request.operation}`,
              });
            }

            // ================= FAQS APPROVAL =================
            if (request.entity_type === "faqs") {
              const validateFAQ = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                data.sr_no !== undefined &&
                data.sr_no !== null &&
                Number.isInteger(Number(data.sr_no)) &&
                Number(data.sr_no) > 0 &&
                typeof data.question === "string" &&
                data.question.trim() !== "" &&
                typeof data.answer === "string" &&
                data.answer.trim() !== "";

              // CREATE
              if (request.operation === "create") {
                if (!validateFAQ(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed FAQ data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO faqs (sr_no, question, answer)
       VALUES (?, ?, ?)`,
                  [
                    Number(proposed.sr_no),
                    proposed.question.trim(),
                    proposed.answer,
                  ],
                  publishError
                );
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target FAQ ID is invalid.",
                  });
                }

                if (!validateFAQ(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed FAQ data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE faqs
       SET sr_no = ?, question = ?, answer = ?
       WHERE id = ?`,
                  [
                    Number(proposed.sr_no),
                    proposed.question.trim(),
                    proposed.answer,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    // Treat an unchanged record as a successful update.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM faqs WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message: "The FAQ record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target FAQ ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM faqs WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The FAQ record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message: `Unsupported FAQ operation: ${request.operation}`,
              });
            }


            // ================= FUNDED RESEARCH APPROVAL =================
            if (request.entity_type === "funded_research") {
              // Validate funded research data.
              const validateResearch = (data) => {
                if (
                  !data ||
                  typeof data !== "object" ||
                  Array.isArray(data)
                ) {
                  return false;
                }

                const srNo =
                  data.sr_no === "" || data.sr_no == null
                    ? null
                    : Number(data.sr_no);

                const year = Number(data.year);

                // Serial number is optional.
                if (
                  srNo !== null &&
                  (!Number.isInteger(srNo) || srNo < 1)
                ) {
                  return false;
                }

                // Required fields.
                if (
                  typeof data.faculty_name !== "string" ||
                  !data.faculty_name.trim() ||
                  typeof data.project_name !== "string" ||
                  !data.project_name.trim()
                ) {
                  return false;
                }

                // Validate year.
                if (
                  !Number.isInteger(year) ||
                  year < 1900 ||
                  year > 9999
                ) {
                  return false;
                }

                return true;
              };

              const normalizeResearch = (data) => ({
                sr_no:
                  data.sr_no === "" || data.sr_no == null
                    ? null
                    : Number(data.sr_no),

                faculty_name: data.faculty_name.trim(),
                project_name: data.project_name.trim(),
                year: Number(data.year),
              });

              // CREATE
              if (request.operation === "create") {
                if (!validateResearch(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed funded research data is invalid.",
                  });
                }

                const record = normalizeResearch(proposed);

                return connection.query(
                  `INSERT INTO funded_research
        (sr_no, faculty_name, project_name, year)
       VALUES (?, ?, ?, ?)`,
                  [
                    record.sr_no,
                    record.faculty_name,
                    record.project_name,
                    record.year,
                  ],
                  (err) => {
                    if (err) {
                      console.error("Funded research create error:", err);
                      return publishError(err);
                    }

                    return publishError(null);
                  }
                );
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (
                  !Number.isSafeInteger(recordId) ||
                  recordId < 1
                ) {
                  return failTransaction(400, {
                    message: "The target funded research ID is invalid.",
                  });
                }

                if (!validateResearch(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed funded research data is invalid.",
                  });
                }

                const record = normalizeResearch(proposed);

                return connection.query(
                  `UPDATE funded_research
       SET sr_no = ?,
           faculty_name = ?,
           project_name = ?,
           year = ?
       WHERE id = ?`,
                  [
                    record.sr_no,
                    record.faculty_name,
                    record.project_name,
                    record.year,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) {
                      console.error("Funded research update error:", err);
                      return publishError(err);
                    }

                    // A record can be unchanged, resulting in affectedRows = 0.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM funded_research WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message:
                                "The funded research record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (
                  !Number.isSafeInteger(recordId) ||
                  recordId < 1
                ) {
                  return failTransaction(400, {
                    message: "The target funded research ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM funded_research WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) {
                      console.error("Funded research delete error:", err);
                      return publishError(err);
                    }

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message:
                          "The funded research record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message:
                  `Unsupported funded research operation: ${request.operation}`,
              });
            }


            // ================= PATENT PUBLICATIONS APPROVAL =================
            if (request.entity_type === "patent_publications") {
              // Validate a single patent publication.
              const validatePatent = (data) => {
                if (
                  !data ||
                  typeof data !== "object" ||
                  Array.isArray(data)
                ) {
                  return false;
                }

                const srNo =
                  data.sr_no === "" || data.sr_no == null
                    ? null
                    : Number(data.sr_no);

                const year = Number(data.year);

                if (
                  srNo !== null &&
                  (!Number.isInteger(srNo) || srNo < 1)
                ) {
                  return false;
                }

                if (
                  typeof data.faculty_name !== "string" ||
                  !data.faculty_name.trim() ||
                  typeof data.patent_title !== "string" ||
                  !data.patent_title.trim()
                ) {
                  return false;
                }

                if (
                  !Number.isInteger(year) ||
                  year < 1900 ||
                  year > 9999
                ) {
                  return false;
                }

                const publicationDate =
                  data.publication_date || null;

                if (publicationDate !== null) {
                  if (
                    typeof publicationDate !== "string" ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(publicationDate)
                  ) {
                    return false;
                  }

                  const parsedDate = new Date(
                    `${publicationDate}T00:00:00Z`
                  );

                  if (
                    Number.isNaN(parsedDate.getTime()) ||
                    parsedDate.toISOString().slice(0, 10) !==
                    publicationDate
                  ) {
                    return false;
                  }
                }

                return (
                  (data.patent_number == null ||
                    typeof data.patent_number === "string") &&
                  (data.patent_status == null ||
                    typeof data.patent_status === "string") &&
                  (data.patent_of_awarding == null ||
                    typeof data.patent_of_awarding === "string")
                );
              };

              // Normalize a valid record before inserting/updating.
              const normalizePatent = (data) => ({
                sr_no:
                  data.sr_no === "" || data.sr_no == null
                    ? null
                    : Number(data.sr_no),

                faculty_name: data.faculty_name.trim(),

                publication_date: data.publication_date || null,

                patent_title: data.patent_title.trim(),

                patent_number:
                  String(data.patent_number ?? "").trim() || null,

                patent_status:
                  String(data.patent_status ?? "").trim() || null,

                patent_of_awarding:
                  String(data.patent_of_awarding ?? "").trim() || null,

                year: Number(data.year),
              });

              // Insert one record.
              const insertPatent = (data, callback) => {
                const record = normalizePatent(data);

                connection.query(
                  `INSERT INTO patent_publications
        (
          sr_no,
          faculty_name,
          publication_date,
          patent_title,
          patent_number,
          patent_status,
          patent_of_awarding,
          year
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    record.sr_no,
                    record.faculty_name,
                    record.publication_date,
                    record.patent_title,
                    record.patent_number,
                    record.patent_status,
                    record.patent_of_awarding,
                    record.year,
                  ],
                  callback
                );
              };

              // Validate an array of records for bulk import.
              const validatePatentRecords = (records) =>
                Array.isArray(records) &&
                records.length > 0 &&
                records.every(validatePatent);

              // CREATE
              if (request.operation === "create") {
                if (!validatePatent(proposed)) {
                  return failTransaction(400, {
                    message:
                      "The proposed patent publication data is invalid.",
                  });
                }

                return insertPatent(proposed, (err) => {
                  if (err) {
                    console.error("Patent publication create error:", err);
                    return publishError(err);
                  }

                  return publishError(null);
                });
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (
                  !Number.isSafeInteger(recordId) ||
                  recordId < 1
                ) {
                  return failTransaction(400, {
                    message: "The target patent publication ID is invalid.",
                  });
                }

                if (!validatePatent(proposed)) {
                  return failTransaction(400, {
                    message:
                      "The proposed patent publication data is invalid.",
                  });
                }

                const record = normalizePatent(proposed);

                return connection.query(
                  `UPDATE patent_publications
       SET sr_no = ?,
           faculty_name = ?,
           publication_date = ?,
           patent_title = ?,
           patent_number = ?,
           patent_status = ?,
           patent_of_awarding = ?,
           year = ?
       WHERE id = ?`,
                  [
                    record.sr_no,
                    record.faculty_name,
                    record.publication_date,
                    record.patent_title,
                    record.patent_number,
                    record.patent_status,
                    record.patent_of_awarding,
                    record.year,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) {
                      console.error("Patent publication update error:", err);
                      return publishError(err);
                    }

                    // MySQL affectedRows can be zero when no values changed.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM patent_publications WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message:
                                "The patent publication record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE SINGLE RECORD
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (
                  !Number.isSafeInteger(recordId) ||
                  recordId < 1
                ) {
                  return failTransaction(400, {
                    message: "The target patent publication ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM patent_publications WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) {
                      console.error("Patent publication delete error:", err);
                      return publishError(err);
                    }

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message:
                          "The patent publication record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              // BULK CREATE (Excel / CSV approval)
              if (request.operation === "bulk_create") {
                const records = proposed?.records;

                if (!validatePatentRecords(records)) {
                  return failTransaction(400, {
                    message:
                      "The proposed patent publication import is invalid. Check faculty names, patent titles, years, serial numbers, and publication dates.",
                  });
                }

                const normalizedRecords = records.map(normalizePatent);

                const values = normalizedRecords.map((record) => [
                  record.sr_no,
                  record.faculty_name,
                  record.publication_date,
                  record.patent_title,
                  record.patent_number,
                  record.patent_status,
                  record.patent_of_awarding,
                  record.year,
                ]);

                return connection.query(
                  `INSERT INTO patent_publications
        (
          sr_no,
          faculty_name,
          publication_date,
          patent_title,
          patent_number,
          patent_status,
          patent_of_awarding,
          year
        )
       VALUES ?`,
                  [values],
                  (err) => {
                    if (err) {
                      console.error(
                        "Patent publication bulk insert error:",
                        err
                      );
                      return publishError(err);
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE ALL RECORDS FOR A YEAR
              if (request.operation === "delete_by_year") {
                const year = Number(proposed?.year);
                const ids = proposed?.ids;

                if (
                  !Number.isInteger(year) ||
                  year < 1900 ||
                  year > 9999 ||
                  !Array.isArray(ids) ||
                  ids.length === 0 ||
                  !ids.every(
                    (id) =>
                      Number.isSafeInteger(Number(id)) &&
                      Number(id) > 0
                  )
                ) {
                  return failTransaction(400, {
                    message:
                      "The patent publication year or record IDs are invalid.",
                  });
                }

                const recordIds = [...new Set(ids.map(Number))];

                // Delete only the records included in the submitted request
                // and belonging to the requested year.
                return connection.query(
                  `DELETE FROM patent_publications
       WHERE year = ?
         AND id IN (?)`,
                  [year, recordIds],
                  (err, result) => {
                    if (err) {
                      console.error(
                        "Patent publication delete-by-year error:",
                        err
                      );
                      return publishError(err);
                    }

                    if (result.affectedRows !== recordIds.length) {
                      return failTransaction(409, {
                        message:
                          "Some patent publication records no longer exist or no longer belong to the selected year. No approval changes were committed.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              // Unsupported operation
              return failTransaction(400, {
                message:
                  `Unsupported patent publication operation: ${request.operation}`,
              });
            }


            // ================= PLACED STUDENTS APPROVAL =================
            if (request.entity_type === "placed_students") {
              const validatePlacedStudent = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                typeof data.name === "string" &&
                data.name.trim() !== "" &&
                typeof data.discipline === "string" &&
                data.discipline.trim() !== "" &&
                typeof data.organization === "string" &&
                data.organization.trim() !== "" &&
                data.package_lpa !== undefined &&
                data.package_lpa !== null &&
                data.package_lpa !== "" &&
                Number.isFinite(Number(data.package_lpa)) &&
                Number(data.package_lpa) >= 0 &&
                Number(data.package_lpa) < 1000 &&
                (data.photo == null || typeof data.photo === "string");

              // CREATE
              if (request.operation === "create") {
                if (!validatePlacedStudent(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed placed student data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO placed_students
        (name, discipline, organization, package_lpa, photo)
       VALUES (?, ?, ?, ?, ?)`,
                  [
                    proposed.name.trim(),
                    proposed.discipline.trim(),
                    proposed.organization.trim(),
                    Number(Number(proposed.package_lpa).toFixed(2)),
                    proposed.photo ?? null,
                  ],
                  publishError
                );
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target placed student ID is invalid.",
                  });
                }

                if (!validatePlacedStudent(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed placed student data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE placed_students
       SET name = ?,
           discipline = ?,
           organization = ?,
           package_lpa = ?,
           photo = ?
       WHERE id = ?`,
                  [
                    proposed.name.trim(),
                    proposed.discipline.trim(),
                    proposed.organization.trim(),
                    Number(Number(proposed.package_lpa).toFixed(2)),
                    proposed.photo ?? null,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    // Handle an unchanged record.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM placed_students WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message: "The placed student record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target placed student ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM placed_students WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The placed student record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message: `Unsupported placed student operation: ${request.operation}`,
              });
            }

            // ================= RECRUITERS APPROVAL =================
            if (request.entity_type === "recruiters") {
              const validateRecruiter = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                typeof data.company_name === "string" &&
                data.company_name.trim() !== "" &&
                (data.logo == null || typeof data.logo === "string") &&
                data.display_order !== undefined &&
                data.display_order !== null &&
                Number.isInteger(Number(data.display_order)) &&
                Number(data.display_order) >= 0;

              // CREATE
              if (request.operation === "create") {
                if (!validateRecruiter(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed recruiter data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO recruiters (company_name, logo, display_order)
       VALUES (?, ?, ?)`,
                  [
                    proposed.company_name.trim(),
                    proposed.logo ?? null,
                    Number(proposed.display_order),
                  ],
                  publishError
                );
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target recruiter ID is invalid.",
                  });
                }

                if (!validateRecruiter(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed recruiter data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE recruiters
       SET company_name = ?,
           logo = ?,
           display_order = ?
       WHERE id = ?`,
                  [
                    proposed.company_name.trim(),
                    proposed.logo ?? null,
                    Number(proposed.display_order),
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    // Handle unchanged records.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM recruiters WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message: "The recruiter record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target recruiter ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM recruiters WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The recruiter record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message: `Unsupported recruiter operation: ${request.operation}`,
              });
            }

            // ================= RESEARCH STUDENTS APPROVAL =================
            if (request.entity_type === "research_students") {
              const validateStudent = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                typeof data.name === "string" &&
                data.name.trim() !== "" &&
                typeof data.department === "string" &&
                data.department.trim() !== "" &&
                typeof data.category === "string" &&
                data.category.trim() !== "" &&
                typeof data.supervisor === "string" &&
                data.supervisor.trim() !== "";

              const studentValues = (data) => [
                data.name.trim(),
                data.department.trim(),
                data.category.trim(),
                data.supervisor.trim(),
              ];

              // CREATE
              if (request.operation === "create") {
                if (!validateStudent(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed research student data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO research_students
        (name, department, category, supervisor)
       VALUES (?, ?, ?, ?)`,
                  studentValues(proposed),
                  (err, result) => {
                    if (err) return publishError(err);
                    return publishError(null);
                  }
                );
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target research student ID is invalid.",
                  });
                }

                if (!validateStudent(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed research student data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE research_students
       SET name = ?,
           department = ?,
           category = ?,
           supervisor = ?
       WHERE id = ?`,
                  [...studentValues(proposed), recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    // MySQL can report zero affected rows when values are unchanged.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM research_students WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message: "The research student record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE ONE
              if (request.operation === "delete") {
                const recordId = Number(proposed?.id ?? request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target research student ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM research_students WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The research student record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              // BULK CREATE — EXCEL UPLOAD
              if (request.operation === "bulk_create") {
                const records = proposed?.records;

                if (
                  !Array.isArray(records) ||
                  records.length === 0 ||
                  !records.every(validateStudent)
                ) {
                  return failTransaction(400, {
                    message: "The proposed research student records are invalid.",
                  });
                }

                const values = records.map(studentValues);

                return connection.query(
                  `INSERT INTO research_students
        (name, department, category, supervisor)
       VALUES ?`,
                  [values],
                  (err) => {
                    if (err) return publishError(err);
                    return publishError(null);
                  }
                );
              }

              // DELETE ALL — DELETE ONLY THE REQUESTED IDS
              if (request.operation === "delete_all") {
                const ids = proposed?.ids;

                if (
                  !Array.isArray(ids) ||
                  ids.length === 0 ||
                  !ids.every(
                    (id) =>
                      (typeof id === "number" ||
                        (typeof id === "string" && id.trim() !== "")) &&
                      Number.isSafeInteger(Number(id)) &&
                      Number(id) > 0
                  )
                ) {
                  return failTransaction(400, {
                    message: "The proposed research student IDs are invalid.",
                  });
                }

                const uniqueIds = [...new Set(ids.map(Number))];

                return connection.query(
                  "DELETE FROM research_students WHERE id IN (?)",
                  [uniqueIds],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== uniqueIds.length) {
                      return failTransaction(409, {
                        message:
                          "Some research student records no longer exist. Refresh and review the request.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message: `Unsupported research student operation: ${request.operation}`,
              });
            }


            // ================= STUDENT GRIEVANCE APPROVAL =================
            if (request.entity_type === "student_grievance") {
              const validCategories = [
                "Anti-Ragging Committee",
                "Anti-Ragging Squad",
              ];

              const normalizeOptionalString = (value) => {
                if (value === undefined || value === null || value === "") {
                  return null;
                }

                return String(value).trim() || null;
              };

              const validateGrievance = (data) => {
                if (
                  !data ||
                  typeof data !== "object" ||
                  Array.isArray(data)
                ) {
                  return false;
                }

                // The router can submit a null Sr. No. for manual creation.
                const validSrNo =
                  data.sr_no === undefined ||
                  data.sr_no === null ||
                  data.sr_no === "" ||
                  (
                    Number.isInteger(Number(data.sr_no)) &&
                    Number(data.sr_no) > 0
                  );

                const validRepresentative =
                  data.representative === undefined ||
                  data.representative === null ||
                  typeof data.representative === "string";

                const validContact =
                  data.contact_no === undefined ||
                  data.contact_no === null ||
                  (
                    typeof data.contact_no === "string" &&
                    data.contact_no.trim().length <= 20
                  );

                const validEmail =
                  data.email_address === undefined ||
                  data.email_address === null ||
                  (
                    typeof data.email_address === "string" &&
                    data.email_address.trim().length <= 255
                  );

                return (
                  validSrNo &&
                  validRepresentative &&
                  typeof data.name === "string" &&
                  data.name.trim() !== "" &&
                  data.name.trim().length <= 255 &&
                  typeof data.designation === "string" &&
                  data.designation.trim() !== "" &&
                  data.designation.trim().length <= 255 &&
                  validContact &&
                  validEmail &&
                  typeof data.category === "string" &&
                  validCategories.includes(data.category)
                );
              };

              const grievanceValues = (data) => [
                data.sr_no === undefined ||
                  data.sr_no === null ||
                  data.sr_no === ""
                  ? null
                  : Number(data.sr_no),

                normalizeOptionalString(data.representative),
                data.name.trim(),
                data.designation.trim(),
                normalizeOptionalString(data.contact_no),
                normalizeOptionalString(data.email_address),
                data.category,
              ];

              // ================= CREATE =================
              if (request.operation === "create") {
                if (!validateGrievance(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed student grievance data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO student_grievance
              (sr_no, representative, name, designation,
                contact_no, email_address, category)
            VALUES(?, ?, ?, ?, ?, ?, ?)`,
                  grievanceValues(proposed),
                  publishError
                );
              }

              // ================= UPDATE =================
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target student grievance ID is invalid.",
                  });
                }

                if (!validateGrievance(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed student grievance data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE student_grievance
       SET sr_no = ?,
              representative = ?,
              name = ?,
              designation = ?,
              contact_no = ?,
              email_address = ?,
              category = ?
                WHERE id = ? `,
                  [...grievanceValues(proposed), recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM student_grievance WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message:
                                "The student grievance record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // ================= DELETE SINGLE RECORD =================
              if (request.operation === "delete") {
                const recordId = Number(
                  proposed?.id ?? request.record_id
                );

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target student grievance ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM student_grievance WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The student grievance record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              // ================= BULK CREATE / EXCEL IMPORT =================
              if (request.operation === "bulk_create") {
                if (
                  !proposed ||
                  typeof proposed !== "object" ||
                  !Array.isArray(proposed.records) ||
                  proposed.records.length === 0
                ) {
                  return failTransaction(400, {
                    message: "The proposed student grievance records are invalid.",
                  });
                }

                const invalidIndex = proposed.records.findIndex(
                  (record) => !validateGrievance(record)
                );

                if (invalidIndex !== -1) {
                  return failTransaction(400, {
                    message:
                      `Invalid student grievance data in imported record ${invalidIndex + 1}.`,
                  });
                }

                const values = proposed.records.map(grievanceValues);

                return connection.query(
                  `INSERT INTO student_grievance
              (sr_no, representative, name, designation,
                contact_no, email_address, category)
            VALUES ? `,
                  [values],
                  publishError
                );
              }

              // ================= DELETE BY CATEGORY =================
              if (request.operation === "delete_by_category") {
                const category = proposed?.category;
                const ids = proposed?.ids;

                if (
                  !validCategories.includes(category) ||
                  !Array.isArray(ids) ||
                  ids.length === 0 ||
                  ids.some(
                    (id) =>
                      !Number.isSafeInteger(Number(id)) ||
                      Number(id) < 1
                  )
                ) {
                  return failTransaction(400, {
                    message: "The proposed category deletion data is invalid.",
                  });
                }

                const uniqueIds = [...new Set(ids.map(Number))];

                // Delete only the IDs included in the approved request,
                // and ensure they still belong to the requested category.
                return connection.query(
                  `DELETE FROM student_grievance
       WHERE category = ?
              AND id IN(?)`,
                  [category, uniqueIds],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== uniqueIds.length) {
                      return failTransaction(409, {
                        message:
                          "Some records no longer exist in the requested category. Refresh the records and submit a new request.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message:
                  `Unsupported student grievance operation: ${request.operation} `,
              });
            }

            // ================= STUDENT SPEAK APPROVAL =================
            if (request.entity_type === "student_speak") {
              const validateStudentSpeak = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                typeof data.name === "string" &&
                data.name.trim() !== "" &&
                (data.year == null || typeof data.year === "string") &&
                typeof data.message === "string" &&
                data.message.trim() !== "" &&
                (data.image == null || typeof data.image === "string") &&
                (data.degree_specialization == null ||
                  typeof data.degree_specialization === "string") &&
                (data.year_of_passing == null ||
                  typeof data.year_of_passing === "string") &&
                (data.designation == null ||
                  typeof data.designation === "string") &&
                (data.company == null || typeof data.company === "string") &&
                (data.image_title == null || typeof data.image_title === "string") &&
                (data.image_alt == null || typeof data.image_alt === "string");

              // CREATE
              if (request.operation === "create") {
                if (!validateStudentSpeak(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed student speak data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO student_speak
        (
          name,
          year,
          message,
          image,
          degree_specialization,
          year_of_passing,
          designation,
          company,
          image_title,
          image_alt
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    proposed.name.trim(),
                    proposed.year ?? null,
                    proposed.message,
                    proposed.image ?? null,
                    proposed.degree_specialization ?? null,
                    proposed.year_of_passing ?? null,
                    proposed.designation ?? null,
                    proposed.company ?? null,
                    proposed.image_title ?? null,
                    proposed.image_alt ?? null,
                  ],
                  publishError
                );
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target student speak ID is invalid.",
                  });
                }

                if (!validateStudentSpeak(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed student speak data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE student_speak
       SET name = ?,
           year = ?,
           message = ?,
           image = ?,
           degree_specialization = ?,
           year_of_passing = ?,
           designation = ?,
           company = ?,
           image_title = ?,
           image_alt = ?
       WHERE id = ?`,
                  [
                    proposed.name.trim(),
                    proposed.year ?? null,
                    proposed.message,
                    proposed.image ?? null,
                    proposed.degree_specialization ?? null,
                    proposed.year_of_passing ?? null,
                    proposed.designation ?? null,
                    proposed.company ?? null,
                    proposed.image_title ?? null,
                    proposed.image_alt ?? null,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    // Handle unchanged records.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM student_speak WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message: "The student speak record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target student speak ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM student_speak WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The student speak record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message: `Unsupported student speak operation: ${request.operation}`,
              });
            }

            // ================= TESTIMONIALS APPROVAL =================
            if (request.entity_type === "testimonials") {
              const validateTestimonial = (data) =>
                data &&
                typeof data === "object" &&
                !Array.isArray(data) &&
                typeof data.title === "string" &&
                data.title.trim() !== "" &&
                (data.video_path == null ||
                  typeof data.video_path === "string") &&
                (data.video_url == null ||
                  typeof data.video_url === "string");

              // CREATE
              if (request.operation === "create") {
                if (!validateTestimonial(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed testimonial data is invalid.",
                  });
                }

                return connection.query(
                  `INSERT INTO testimonials (title, video_path, video_url)
       VALUES (?, ?, ?)`,
                  [
                    proposed.title.trim(),
                    proposed.video_path ?? null,
                    proposed.video_url ?? null,
                  ],
                  publishError
                );
              }

              // UPDATE
              if (request.operation === "update") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target testimonial ID is invalid.",
                  });
                }

                if (!validateTestimonial(proposed)) {
                  return failTransaction(400, {
                    message: "The proposed testimonial data is invalid.",
                  });
                }

                return connection.query(
                  `UPDATE testimonials
       SET title = ?,
           video_path = ?,
           video_url = ?
       WHERE id = ?`,
                  [
                    proposed.title.trim(),
                    proposed.video_path ?? null,
                    proposed.video_url ?? null,
                    recordId,
                  ],
                  (err, result) => {
                    if (err) return publishError(err);

                    // Handle an unchanged record.
                    if (result.affectedRows === 0) {
                      return connection.query(
                        "SELECT id FROM testimonials WHERE id = ?",
                        [recordId],
                        (checkError, rows) => {
                          if (checkError) return publishError(checkError);

                          if (!rows.length) {
                            return failTransaction(409, {
                              message: "The testimonial record no longer exists.",
                            });
                          }

                          return publishError(null);
                        }
                      );
                    }

                    return publishError(null);
                  }
                );
              }

              // DELETE
              if (request.operation === "delete") {
                const recordId = Number(request.record_id);

                if (!Number.isSafeInteger(recordId) || recordId < 1) {
                  return failTransaction(400, {
                    message: "The target testimonial ID is invalid.",
                  });
                }

                return connection.query(
                  "DELETE FROM testimonials WHERE id = ?",
                  [recordId],
                  (err, result) => {
                    if (err) return publishError(err);

                    if (result.affectedRows !== 1) {
                      return failTransaction(409, {
                        message: "The testimonial record no longer exists.",
                      });
                    }

                    return publishError(null);
                  }
                );
              }

              return failTransaction(400, {
                message: `Unsupported testimonial operation: ${request.operation}`,
              });
            }

            // ============================================
            // News APPROVAL HANDLERS
            // Add after publishError and before News CREATE
            // ============================================
            // CREATE
            if (request.operation === "create") {
              if (
                typeof proposed.title !== "string" ||
                !proposed.title.trim() ||
                !["admission", "examination"].includes(proposed.category)
              ) {
                return failTransaction(400, {
                  message: "The proposed news data is invalid.",
                });
              }

              return connection.query(
                `INSERT INTO news
                 (title, date, file_path, link_text, link_url, category)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  proposed.title.trim(),
                  proposed.date ?? null,
                  proposed.file_path ?? null,
                  proposed.link_text ?? "",
                  proposed.link_url ?? "",
                  proposed.category,
                ],
                publishError
              );
            }

            // UPDATE
            if (request.operation === "update") {
              const recordId = Number(request.record_id);

              if (!Number.isSafeInteger(recordId) || recordId < 1) {
                return failTransaction(400, {
                  message: "The target news ID is invalid.",
                });
              }

              if (
                typeof proposed.title !== "string" ||
                !proposed.title.trim() ||
                !["admission", "examination"].includes(proposed.category)
              ) {
                return failTransaction(400, {
                  message: "The proposed news data is invalid.",
                });
              }

              return connection.query(
                `UPDATE news
                 SET title = ?, date = ?, file_path = ?,
                     link_text = ?, link_url = ?, category = ?
                 WHERE id = ?`,
                [
                  proposed.title.trim(),
                  proposed.date ?? null,
                  proposed.file_path ?? null,
                  proposed.link_text ?? "",
                  proposed.link_url ?? "",
                  proposed.category,
                  recordId,
                ],
                (updateError, result) => {
                  if (updateError) return publishError(updateError);

                  if (result.affectedRows !== 1) {
                    return failTransaction(409, {
                      message:
                        "The news record no longer exists. Nothing was published.",
                    });
                  }

                  publishError(null);
                }
              );
            }

            // DELETE
            if (request.operation === "delete") {
              const recordId = Number(request.record_id);

              if (!Number.isSafeInteger(recordId) || recordId < 1) {
                return failTransaction(400, {
                  message: "The target news ID is invalid.",
                });
              }

              return connection.query(
                "DELETE FROM news WHERE id = ?",
                [recordId],
                (deleteError, result) => {
                  if (deleteError) return publishError(deleteError);

                  if (result.affectedRows !== 1) {
                    return failTransaction(409, {
                      message:
                        "The news record no longer exists. Nothing was deleted.",
                    });
                  }

                  publishError(null);
                }
              );
            }

            return failTransaction(400, {
              message: "Unsupported operation.",
            });
          }
        );
      });
    });
  }
);

// POST /api/admin/approvals/:id/reject
router.post(
  "/approvals/:id/reject",
  authorizeRole("superadmin"),
  (req, res) => {
    const requestId = Number(req.params.id);

    const comment =
      typeof req.body?.comment === "string"
        ? req.body.comment.trim()
        : "";

    if (!Number.isSafeInteger(requestId) || requestId < 1) {
      return res.status(400).json({
        message: "Invalid request ID.",
      });
    }

    if (comment.length > 2000) {
      return res.status(400).json({
        message: "Rejection reason cannot exceed 2000 characters.",
      });
    }

    // First fetch the request so we know who submitted it.
    db.query(
      `SELECT id, entity_type, operation, submitted_by, status
       FROM content_change_requests
       WHERE id = ?
       LIMIT 1`,
      [requestId],
      (selectError, requests) => {
        if (selectError) {
          console.error(
            "Load rejection request error:",
            selectError.message
          );

          return res.status(500).json({
            message: "Failed to load the approval request.",
          });
        }

        if (!requests.length) {
          return res.status(404).json({
            message: "Approval request not found.",
          });
        }

        const request = requests[0];

        if (request.status !== "pending") {
          return res.status(409).json({
            message: "Request not found or it has already been reviewed.",
          });
        }

        // Save the rejection decision and the review comment.
        db.query(
          `UPDATE content_change_requests
           SET status = 'rejected',
               reviewed_by = ?,
               review_comment = ?,
               reviewed_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status = 'pending'`,
          [req.admin.id, comment || null, requestId],
          (updateError, result) => {
            if (updateError) {
              console.error(
                "Reject approval error:",
                updateError.message
              );

              return res.status(500).json({
                message: "Failed to reject the request.",
              });
            }

            // Protect against simultaneous review attempts.
            if (result.affectedRows !== 1) {
              return res.status(409).json({
                message:
                  "Request not found or it has already been reviewed.",
              });
            }

            // The rejection has been saved. Return success independently
            // of whether email delivery succeeds.
            res.json({
              message:
                "Request rejected. Published content remains unchanged.",
              requestId,
            });

            // Notify the submitting admin.
            db.query(
              "SELECT email FROM admins WHERE id = ? LIMIT 1",
              [request.submitted_by],
              async (emailError, adminRows) => {
                if (emailError) {
                  console.error(
                    "Failed to fetch submitting admin email:",
                    emailError.message
                  );
                  return;
                }

                const adminEmail = adminRows?.[0]?.email;

                if (!adminEmail) {
                  console.error(
                    `No email found for submitting admin ID: ${request.submitted_by}`
                  );
                  return;
                }

                try {
                  await sendReviewResultNotification({
                    adminEmail,
                    requestId,
                    entityType: request.entity_type,
                    operation: request.operation,
                    status: "rejected",
                    reviewComment: comment,
                  });

                  console.log(
                    `Rejection notification sent for request #${requestId}`
                  );
                } catch (emailError) {
                  console.error(
                    "Rejection result email failed:",
                    emailError.message
                  );
                }
              }
            );
          }
        );
      }
    );
  }
);

// DELETE approval requests by submission date (superadmin only)
router.delete(
  "/approvals/by-date",
  authorizeRole("superadmin"),
  (req, res) => {
    const { fromDate, toDate } = req.body;

    // Validate YYYY-MM-DD dates
    const isValidDate = (value) => {
      if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
      ) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (!isValidDate(fromDate) || !isValidDate(toDate)) {
      return res.status(400).json({
        message: "Please provide valid From Date and To Date.",
      });
    }

    if (fromDate > toDate) {
      return res.status(400).json({
        message: "From Date cannot be later than To Date.",
      });
    }

    const sql = `
      DELETE FROM content_change_requests
      WHERE submitted_at >= ?
        AND submitted_at < DATE_ADD(?, INTERVAL 1 DAY)
    `;

    db.query(sql, [fromDate, toDate], (err, result) => {
      if (err) {
        console.error("Delete approval requests error:", err);

        return res.status(500).json({
          message: "Failed to delete approval requests.",
        });
      }

      return res.status(200).json({
        message: `${result.affectedRows} approval request(s) deleted successfully.`,
        deletedCount: result.affectedRows,
      });
    });
  }
);


/* ============================================
   USER MANAGEMENT
   Superadmin-only endpoints
   ============================================ */

// GET /api/admin/users
router.get(
  "/users",
  authorizeRole("superadmin"),
  (req, res) => {
    const sql = `
      SELECT id, full_name, email, role, is_active
      FROM admins
      ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Fetch admin accounts error:", err.message);
        return res.status(500).json({
          message: "Unable to load admin accounts.",
        });
      }

      return res.status(200).json({
        users: results,
      });
    });
  }
);

// PUT /api/admin/users/:id
router.put(
  "/users/:id",
  authorizeRole("superadmin"),
  (req, res) => {
    const { id } = req.params;
    const { fullName, email } = req.body;

    if (!fullName?.trim() || !email?.trim()) {
      return res.status(400).json({
        message: "Full name and email are required.",
      });
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    const checkSql = `
      SELECT id FROM admins
      WHERE email = ? AND id != ?
    `;

    db.query(checkSql, [cleanEmail, id], (err, results) => {
      if (err) {
        console.error("Check admin email error:", err.message);
        return res.status(500).json({
          message: "Unable to update admin account.",
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          message: "This email address is already registered.",
        });
      }

      const updateSql = `
        UPDATE admins
        SET full_name = ?, email = ?
        WHERE id = ?
      `;

      db.query(
        updateSql,
        [cleanName, cleanEmail, id],
        (err, result) => {
          if (err) {
            console.error("Update admin error:", err.message);
            return res.status(500).json({
              message: "Unable to update admin account.",
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              message: "Admin account not found.",
            });
          }

          return res.status(200).json({
            message: "Admin account updated successfully.",
          });
        }
      );
    });
  }
);

// POST /api/admin/users
// POST /api/admin/users - Create Admin Account
router.post(
  "/users",
  authorizeRole("superadmin"),
  async (req, res) => {
    try {
      const { fullName, email, password } = req.body;

      if (
        typeof fullName !== "string" ||
        !fullName.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        password.length < 8
      ) {
        return res.status(400).json({
          message: "Please provide a valid name, email, and password of at least 8 characters.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check whether the email already exists
      db.query(
        "SELECT id FROM admins WHERE email = ?",
        [normalizedEmail],
        async (findError, results) => {
          if (findError) {
            console.error("Check admin email error:", findError.message);
            return res.status(500).json({
              message: "Unable to create admin account.",
            });
          }

          if (results.length > 0) {
            return res.status(409).json({
              message: "An account with this email already exists.",
            });
          }

          try {
            const hashedPassword = await bcrypt.hash(password, 12);

            const sql = `
              INSERT INTO admins
                (full_name, email, password, role, is_active)
              VALUES (?, ?, ?, 'admin', 1)
            `;

            db.query(
              sql,
              [fullName.trim(), normalizedEmail, hashedPassword],
              (insertError, result) => {
                if (insertError) {
                  console.error("Create admin error:", insertError.message);

                  if (insertError.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                      message: "An account with this email already exists.",
                    });
                  }

                  return res.status(500).json({
                    message: "Unable to create admin account.",
                  });
                }

                return res.status(201).json({
                  message: "Admin account created successfully.",
                  userId: result.insertId,
                });
              }
            );
          } catch (hashError) {
            console.error("Password hashing error:", hashError.message);
            return res.status(500).json({
              message: "Unable to securely create admin account.",
            });
          }
        }
      );
    } catch (error) {
      console.error("Create admin error:", error.message);
      return res.status(500).json({
        message: "Unable to create admin account.",
      });
    }
  }
);

// POST /api/admin/users/:id/reset-password
router.post(
  "/users/:id/reset-password",
  authorizeRole("superadmin"),
  async (req, res) => {
    try {
      const adminId = Number(req.params.id);
      const { password } = req.body;

      if (!Number.isInteger(adminId) || adminId <= 0) {
        return res.status(400).json({
          message: "Invalid user ID.",
        });
      }

      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
          message: "Password must contain at least 8 characters.",
        });
      }

      // Verify that the account exists.
      db.query(
        "SELECT id, role FROM admins WHERE id = ?",
        [adminId],
        async (findError, users) => {
          if (findError) {
            console.error("Find admin error:", findError.message);

            return res.status(500).json({
              message: "Unable to find the admin account.",
            });
          }

          if (!users || users.length === 0) {
            return res.status(404).json({
              message: "Admin account not found.",
            });
          }

          try {
            // Hash the new password using the existing bcrypt method.
            const hashedPassword = await bcrypt.hash(password, 12);

            db.query(
              "UPDATE admins SET password = ? WHERE id = ?",
              [hashedPassword, adminId],
              (updateError, result) => {
                if (updateError) {
                  console.error(
                    "Reset password error:",
                    updateError.message
                  );

                  return res.status(500).json({
                    message: "Unable to reset password.",
                  });
                }

                if (result.affectedRows === 0) {
                  return res.status(404).json({
                    message: "Admin account not found.",
                  });
                }

                return res.status(200).json({
                  message: "Password reset successfully.",
                });
              }
            );
          } catch (hashError) {
            console.error(
              "Password hashing error:",
              hashError.message
            );

            return res.status(500).json({
              message: "Unable to securely reset the password.",
            });
          }
        }
      );
    } catch (error) {
      console.error("Reset password error:", error.message);

      return res.status(500).json({
        message: "Unable to reset password.",
      });
    }
  }
);

// DELETE /api/admin/users/:id
router.delete(
  "/users/:id",
  authorizeRole("superadmin"),
  (req, res) => {
    const adminId = Number(req.params.id);
    const loggedInAdminId = Number(req.admin?.id);

    if (!Number.isInteger(adminId) || adminId <= 0) {
      return res.status(400).json({
        message: "Invalid admin ID.",
      });
    }

    if (adminId === loggedInAdminId) {
      return res.status(403).json({
        message: "You cannot delete your own account.",
      });
    }

    const checkSql = `
      SELECT id, role
      FROM admins
      WHERE id = ?
    `;

    db.query(checkSql, [adminId], (err, results) => {
      if (err) {
        console.error("Check admin error:", err.message);
        return res.status(500).json({
          message: "Unable to delete admin account.",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Admin account not found.",
        });
      }

      if (results[0].role === "superadmin") {
        const countSql = `
          SELECT COUNT(*) AS total
          FROM admins
          WHERE role = 'superadmin'
        `;

        db.query(countSql, (err, countResults) => {
          if (err) {
            console.error("Superadmin count error:", err.message);
            return res.status(500).json({
              message: "Unable to verify superadmin accounts.",
            });
          }

          if (countResults[0].total <= 1) {
            return res.status(403).json({
              message: "The last superadmin account cannot be deleted.",
            });
          }

          deleteAdmin();
        });
      } else {
        deleteAdmin();
      }

      function deleteAdmin() {
        const deleteSql = `
          DELETE FROM admins
          WHERE id = ?
        `;

        db.query(deleteSql, [adminId], (err, result) => {
          if (err) {
            console.error("Delete admin error:", err.message);
            return res.status(500).json({
              message: "Unable to delete admin account.",
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              message: "Admin account not found.",
            });
          }

          return res.status(200).json({
            message: "Admin account deleted successfully.",
          });
        });
      }
    });
  }
);


/* GET /api/admin/my-requests
   Each admin sees only their own approval requests.
*/
router.get("/my-requests", (req, res) => {
  const sql = `
    SELECT *
    FROM content_change_requests
    WHERE submitted_by = ?
    ORDER BY id DESC
  `;

  db.query(sql, [req.admin.id], (err, results) => {
    if (err) {
      console.error("Fetch my requests error:", err.message);

      return res.status(500).json({
        message: "Failed to fetch your approval requests.",
      });
    }

    return res.status(200).json({
      requests: results,
    });
  });
});


module.exports = router;
