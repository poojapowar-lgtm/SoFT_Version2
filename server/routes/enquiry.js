const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/verifyAdmin");


// ADD ENQUIRY (Public - from website form)
router.post("/", (req, res) => {
  const { name, email, mobile, course } = req.body;

  if (!name || !email || !mobile || !course) {
    return res.status(400).json("All fields are required");
  }

  db.query(
    "INSERT INTO enquiries (name, email, mobile, course) VALUES (?, ?, ?, ?)",
    [name, email, mobile, course],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json("Database error");
      }
      res.json("Enquiry submitted successfully");
    }
  );
});


// GET ALL ENQUIRIES (Admin Protected)
router.get("/", auth, (req, res) => {
  db.query(
    "SELECT * FROM enquiries ORDER BY id DESC",
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
});


// GET SINGLE ENQUIRY
router.get("/:id", auth, (req, res) => {
  db.query(
    "SELECT * FROM enquiries WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) return res.status(404).json("Not found");

      res.json(result[0]);
    }
  );
});


// ================= DELETE ALL ENQUIRIES =================
// DELETE /api/enquiry/delete-all

router.delete("/delete-all", auth, (req, res) => {
  const sql = "DELETE FROM enquiries";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Delete all enquiries error:", err);

      return res.status(500).json({
        message: "Failed to delete all enquiries.",
      });
    }

    res.status(200).json({
      message: "All enquiries deleted successfully.",
      deletedCount: result.affectedRows,
    });
  });
});


// ================= DELETE SINGLE ENQUIRY =================
// DELETE /api/enquiry/:id

router.delete("/:id", auth, (req, res) => {
  db.query(
    "DELETE FROM enquiries WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error("Delete enquiry error:", err);
        return res.status(500).json({
          message: "Failed to delete enquiry.",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Enquiry not found.",
        });
      }

      res.json({
        message: "Enquiry deleted successfully.",
      });
    }
  );
});

module.exports = router;