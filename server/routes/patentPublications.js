
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


const ENTITY_TYPE = "patent_publications";

// ================= FILE UPLOAD CONFIG =================

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (![".xlsx", ".xls", ".csv"].includes(extension)) {
      return cb(
        new Error("Upload an Excel (.xlsx, .xls) or CSV file.")
      );
    }

    cb(null, true);
  },
});

// ================= HELPER FUNCTIONS =================

const isValidYear = (year) =>
  Number.isInteger(year) && year >= 1900 && year <= 9999;

const validateRecord = (data) => {
  const year = Number(data.year);
  const srNo =
    data.sr_no === "" || data.sr_no == null
      ? null
      : Number(data.sr_no);

  if (
    typeof data.faculty_name !== "string" ||
    !data.faculty_name.trim() ||
    typeof data.patent_title !== "string" ||
    !data.patent_title.trim() ||
    !isValidYear(year)
  ) {
    return {
      valid: false,
      message:
        "Faculty name, patent title, and a valid year are required.",
    };
  }

  if (srNo !== null && (!Number.isInteger(srNo) || srNo < 1)) {
    return {
      valid: false,
      message: "Enter a valid positive serial number.",
    };
  }

  return {
    valid: true,
    data: {
      sr_no: srNo,
      faculty_name: data.faculty_name.trim(),
      publication_date: data.publication_date || null,
      patent_title: data.patent_title.trim(),
      patent_number: String(data.patent_number ?? "").trim() || null,
      patent_status: String(data.patent_status ?? "").trim() || null,
      patent_of_awarding:
        String(data.patent_of_awarding ?? "").trim() || null,
      year,
    },
  };
};

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const facultyAliases = [
  "facultyname",
  "nameofresearcher",
  "nameoffaculty",
];

const titleAliases = [
  "titleofpatent",
  "patenttitle",
  "title",
];

const serialAliases = [
  "srno",
  "serialno",
  "serialnumber",
];

const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Uploaded file cleanup error:", err.message);
      }
    });
  }
};

const saveChangeRequest = (
  recordId,
  operation,
  proposedData,
  originalData,
  submittedBy,
  res
) => {
  db.query(
    `INSERT INTO content_change_requests
    (
      entity_type,
      record_id,
      operation,
      proposed_data,
      original_data,
      status,
      submitted_by
    )
    VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [
      ENTITY_TYPE,
      recordId ?? null,
      operation,
      proposedData == null ? null : JSON.stringify(proposedData),
      originalData == null ? null : JSON.stringify(originalData),
      submittedBy,
    ],
    (err, result) => {
      if (err) {
        console.error("Patent approval request error:", err);

        return res.status(500).json({
          message: "Failed to submit patent publication change request.",
          error: err.sqlMessage || err.message,
        });
      }

      const requestId = result.insertId;
      const entityType = ENTITY_TYPE || "patent_publications";

      res.status(201).json({
        message: "Change request submitted for approval.",
        requestId,
        status: "pending",
      });

      // Retrieve the submitting admin's email.
      db.query(
        "SELECT email FROM admins WHERE id = ? LIMIT 1",
        [submittedBy],
        (adminErr, adminRows) => {
          if (adminErr) {
            console.error(
              "Failed to retrieve patent submitter email:",
              adminErr.message
            );
          }

          const adminEmail = adminRows?.[0]?.email;

          // 1. Notify Super Admin.
          sendApprovalNotification({
            requestId,
            entityType,
            operation,
            requestedBy: adminEmail || `Admin ID: ${submittedBy}`,
          }).catch((emailError) => {
            console.error(
              "Patent approval notification failed:",
              emailError.message
            );
          });

          // 2. Confirm submission to the requesting admin.
          if (!adminEmail) {
            console.error(
              `Patent request ${requestId}: submitting admin email is missing.`
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
              "Patent submission confirmation failed:",
              emailError.message
            );
          });
        }
      );
    }
  );
};

const insertRecords = (records, callback) => {
  const values = records.map((record) => [
    record.sr_no,
    record.faculty_name,
    record.publication_date,
    record.patent_title,
    record.patent_number,
    record.patent_status,
    record.patent_of_awarding,
    record.year,
  ]);

  db.query(
    `INSERT INTO patent_publications
      (sr_no, faculty_name, publication_date, patent_title,
       patent_number, patent_status, patent_of_awarding, year)
     VALUES ?`,
    [values],
    callback
  );
};

// ================= GET ALL PUBLISHED DATA =================
// GET /api/patent-publications

router.get("/", (req, res) => {
  db.query(
    `SELECT *
     FROM patent_publications
     ORDER BY year DESC, sr_no ASC, id ASC`,
    (err, results) => {
      if (err) {
        console.error("Fetch patent publications error:", err);

        return res.status(500).json({
          message: "Database error while fetching patent publications.",
        });
      }

      res.json(results);
    }
  );
});

// ================= GET MY CHANGE REQUESTS =================
// GET /api/patent-publications/my-requests

router.get("/my-requests", auth, (req, res) => {
  db.query(
    `SELECT *
     FROM content_change_requests
     WHERE entity_type = ? AND submitted_by = ?
     ORDER BY created_at DESC`,
    [ENTITY_TYPE, req.admin.id],
    (err, results) => {
      if (err) {
        console.error("Fetch patent requests error:", err);

        return res.status(500).json({
          message: "Failed to fetch patent publication requests.",
        });
      }

      res.json(results);
    }
  );
});

// ================= GET AVAILABLE YEARS =================
// GET /api/patent-publications/years

router.get("/years", (req, res) => {
  db.query(
    `SELECT DISTINCT year
     FROM patent_publications
     WHERE year IS NOT NULL
     ORDER BY year DESC`,
    (err, results) => {
      if (err) {
        console.error("Fetch patent publication years error:", err);

        return res.status(500).json({
          message: "Failed to fetch patent publication years.",
        });
      }

      res.json(results.map((row) => String(row.year)));
    }
  );
});

// ================= GET DATA BY YEAR =================
// GET /api/patent-publications/year/2026

router.get("/year/:year", (req, res) => {
  const yearText = String(req.params.year);
  const year = Number(yearText);

  if (!/^\d{4}$/.test(yearText) || !isValidYear(year)) {
    return res.status(400).json({ message: "Invalid year." });
  }

  db.query(
    `SELECT *
     FROM patent_publications
     WHERE year = ?
     ORDER BY sr_no ASC, id ASC`,
    [year],
    (err, results) => {
      if (err) {
        console.error("Fetch publications by year error:", err);

        return res.status(500).json({
          message: "Database error while fetching patent publications.",
        });
      }

      res.json(results);
    }
  );
});

// ================= CREATE MANUAL ENTRY =================
// POST /api/patent-publications

router.post("/", auth, (req, res) => {
  const validation = validateRecord(req.body);

  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const proposedData = validation.data;

  // Admin: submit for approval.
  if (req.admin?.role !== "superadmin") {
    return saveChangeRequest(
      null,
      "create",
      proposedData,
      null,
      req.admin.id,
      res
    );
  }

  // Superadmin: create directly.
  insertRecords([proposedData], (err, result) => {
    if (err) {
      console.error("Patent publication insert error:", err);

      return res.status(500).json({
        message: "Database error while adding patent publication.",
        error: err.sqlMessage || err.message,
      });
    }

    res.status(201).json({
      message: "Patent publication added successfully.",
      id: result.insertId,
    });
  });
});

// ================= UPLOAD EXCEL / CSV =================
// POST /api/patent-publications/upload-excel
// FormData fields: file, year

router.post("/upload-excel", auth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || "Unable to upload the file.",
      });
    }

    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No Excel or CSV file uploaded.",
    });
  }

  const uploadedPath = req.file.path;
  let cleaned = false;

  const cleanup = () => {
    if (!cleaned) {
      cleaned = true;
      cleanupFile(uploadedPath);
    }
  };

  try {
    const yearText = String(req.body.year ?? "").trim();
    const year = Number(yearText);

    if (!/^\d{4}$/.test(yearText) || !isValidYear(year)) {
      cleanup();

      return res.status(400).json({
        message: "Please select a valid year before uploading.",
      });
    }

    const workbook = xlsx.readFile(uploadedPath, {
      cellDates: true,
    });

    if (!workbook.SheetNames.length) {
      cleanup();

      return res.status(400).json({
        message: "The uploaded file contains no worksheet.",
      });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    });

    if (!rows.length) {
      cleanup();

      return res.status(400).json({
        message: "No data rows found in the uploaded file.",
      });
    }

    // Find the header row, allowing title rows above it.
    const headerIndex = rows.findIndex((row) => {
      const headers = row.map(normalizeHeader);

      return (
        headers.some((header) => facultyAliases.includes(header)) &&
        headers.some((header) => titleAliases.includes(header))
      );
    });

    if (headerIndex === -1) {
      cleanup();

      return res.status(400).json({
        message:
          "Required headers not found. Expected Name of Faculty and Title of Patent.",
        detectedHeaders: rows.slice(0, 5),
      });
    }

    const headers = rows[headerIndex].map(normalizeHeader);

    const findColumn = (...names) =>
      headers.findIndex((header) => names.includes(header));

    const columns = {
      srNo: findColumn(...serialAliases),
      faculty: findColumn(...facultyAliases),
      date: findColumn(
        "patentpublicationdate",
        "publicationdate",
        "date"
      ),
      title: findColumn(...titleAliases),
      number: findColumn("patentno", "patentnumber", "patentnum"),
      status: findColumn("patentstatus", "status"),
      awarding: findColumn(
        "patentofawarding",
        "patentawarding",
        "awarding"
      ),
    };

    const records = [];
    const seenSerials = new Set();

    // Validate all rows before submitting or inserting.
    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];

      if (row.every((cell) => String(cell ?? "").trim() === "")) {
        continue;
      }

      const facultyName = String(row[columns.faculty] ?? "").trim();
      const patentTitle = String(row[columns.title] ?? "").trim();

      if (!facultyName || !patentTitle) {
        throw new Error(
          `Faculty name and patent title are required in Excel row ${i + 1}.`
        );
      }

      let srNo = null;
      const srText =
        columns.srNo >= 0
          ? String(row[columns.srNo] ?? "").trim()
          : "";

      if (srText !== "") {
        srNo = Number(srText);

        if (!Number.isInteger(srNo) || srNo < 1) {
          throw new Error(
            `Invalid serial number in Excel row ${i + 1}.`
          );
        }

        if (seenSerials.has(srNo)) {
          throw new Error(
            `Duplicate serial number ${srNo} in Excel row ${i + 1}.`
          );
        }

        seenSerials.add(srNo);
      }

      // Parse publication date.
      let publicationDate = null;

      if (columns.date >= 0) {
        const rawDate = row[columns.date];

        if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
          publicationDate = [
            rawDate.getFullYear(),
            String(rawDate.getMonth() + 1).padStart(2, "0"),
            String(rawDate.getDate()).padStart(2, "0"),
          ].join("-");
        } else if (String(rawDate ?? "").trim()) {
          const textDate = String(rawDate).trim();

          let match = textDate.match(
            /^(\d{4})-(\d{2})-(\d{2})$/
          );

          if (match) {
            publicationDate = `${match[1]}-${match[2]}-${match[3]}`;
          } else {
            match = textDate.match(
              /^(\d{2})-(\d{2})-(\d{4})$/
            );

            if (match) {
              publicationDate = `${match[3]}-${match[2]}-${match[1]}`;
            } else {
              throw new Error(
                `Invalid publication date in Excel row ${i + 1}. Use YYYY-MM-DD or DD-MM-YYYY.`
              );
            }
          }

          // Reject impossible dates such as 2026-02-31.
          const parsedDate = new Date(`${publicationDate}T00:00:00Z`);

          if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== publicationDate
          ) {
            throw new Error(
              `Invalid publication date in Excel row ${i + 1}.`
            );
          }
        }
      }

      records.push({
        sr_no: srNo,
        faculty_name: facultyName,
        publication_date: publicationDate,
        patent_title: patentTitle,
        patent_number:
          columns.number >= 0
            ? String(row[columns.number] ?? "").trim() || null
            : null,
        patent_status:
          columns.status >= 0
            ? String(row[columns.status] ?? "").trim() || null
            : null,
        patent_of_awarding:
          columns.awarding >= 0
            ? String(row[columns.awarding] ?? "").trim() || null
            : null,
        year,
      });
    }

    if (!records.length) {
      cleanup();

      return res.status(400).json({
        message: "No valid data rows found in the uploaded file.",
      });
    }

    // Admin: submit the entire import as one approval request.
    if (req.admin?.role !== "superadmin") {
      cleanup();

      return saveChangeRequest(
        null,
        "bulk_create",
        { records },
        null,
        req.admin.id,
        res
      );
    }

    // Superadmin: insert the records directly.
    insertRecords(records, (err, result) => {
      cleanup();

      if (err) {
        console.error("Patent Excel insert error:", err);

        return res.status(500).json({
          message: "Failed to insert Excel data.",
          error: err.sqlMessage || err.message,
        });
      }

      res.status(201).json({
        message: `Excel uploaded successfully for ${year}.`,
        insertedCount: result.affectedRows,
        year,
      });
    });
  } catch (err) {
    cleanup();

    console.error("Patent Excel processing error:", err);

    return res.status(400).json({
      message: err.message || "Unable to process the uploaded file.",
    });
  }
});

// ================= UPDATE PUBLICATION =================
// PUT /api/patent-publications/:id

router.put("/:id", auth, (req, res) => {
  const { id } = req.params;
  const validation = validateRecord(req.body);

  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const proposedData = validation.data;

  db.query(
    "SELECT * FROM patent_publications WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) {
        console.error("Fetch patent publication error:", err);

        return res.status(500).json({
          message: "Database error while fetching publication.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          message: "Patent publication not found.",
        });
      }

      const originalData = rows[0];

      // Admin: submit update for approval.
      if (req.admin?.role !== "superadmin") {
        return saveChangeRequest(
          id,
          "update",
          proposedData,
          originalData,
          req.admin.id,
          res
        );
      }

      // Superadmin: update directly.
      db.query(
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
          proposedData.sr_no,
          proposedData.faculty_name,
          proposedData.publication_date,
          proposedData.patent_title,
          proposedData.patent_number,
          proposedData.patent_status,
          proposedData.patent_of_awarding,
          proposedData.year,
          id,
        ],
        (updateErr) => {
          if (updateErr) {
            console.error("Patent publication update error:", updateErr);

            return res.status(500).json({
              message: "Database error while updating publication.",
            });
          }

          res.json({
            message: "Patent publication updated successfully.",
          });
        }
      );
    }
  );
});

// ================= DELETE ALL PUBLICATIONS BY YEAR =================
// DELETE /api/patent-publications/delete-all?year=2026
// Must be declared before DELETE /:id.

router.delete("/delete-all", auth, (req, res) => {
  const yearText = String(req.query.year ?? "");
  const year = Number(yearText);

  if (!/^\d{4}$/.test(yearText) || !isValidYear(year)) {
    return res.status(400).json({
      message: "Please provide a valid year.",
    });
  }

  db.query(
    "SELECT * FROM patent_publications WHERE year = ?",
    [year],
    (err, rows) => {
      if (err) {
        console.error("Fetch publications for deletion error:", err);

        return res.status(500).json({
          message: "Failed to fetch publications for deletion.",
        });
      }

      if (!rows.length) {
        return res.json({
          message: `No patent publications found for ${year}.`,
          deletedCount: 0,
        });
      }

      // Admin: submit deletion of these specific records.
      if (req.admin?.role !== "superadmin") {
        return saveChangeRequest(
          null,
          "delete_by_year",
          {
            year,
            ids: rows.map((row) => row.id),
          },
          rows,
          req.admin.id,
          res
        );
      }

      // Superadmin: delete directly.
      db.query(
        "DELETE FROM patent_publications WHERE year = ?",
        [year],
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Delete publications by year error:", deleteErr);

            return res.status(500).json({
              message: "Database error while deleting publications.",
            });
          }

          res.json({
            message: `Patent publications for ${year} deleted successfully.`,
            deletedCount: result.affectedRows,
          });
        }
      );
    }
  );
});

// ================= DELETE SINGLE PUBLICATION =================
// DELETE /api/patent-publications/:id

router.delete("/:id", auth, (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM patent_publications WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) {
        console.error("Fetch publication before deletion error:", err);

        return res.status(500).json({
          message: "Database error while fetching publication.",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          message: "Patent publication not found.",
        });
      }

      const originalData = rows[0];

      // Admin: submit deletion for approval.
      if (req.admin?.role !== "superadmin") {
        return saveChangeRequest(
          id,
          "delete",
          { id: Number(id) },
          originalData,
          req.admin.id,
          res
        );
      }

      // Superadmin: delete directly.
      db.query(
        "DELETE FROM patent_publications WHERE id = ?",
        [id],
        (deleteErr, result) => {
          if (deleteErr) {
            console.error("Patent publication delete error:", deleteErr);

            return res.status(500).json({
              message: "Database error while deleting publication.",
            });
          }

          if (!result.affectedRows) {
            return res.status(404).json({
              message: "Patent publication not found.",
            });
          }

          res.json({
            message: "Patent publication deleted successfully.",
          });
        }
      );
    }
  );
});

module.exports = router;
