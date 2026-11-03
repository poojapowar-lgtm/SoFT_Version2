
console.log("Auth route loaded ✅");

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

router.post("/secure-soft", async (req, res) => {
  try {
    const { email, password } = req.body;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is missing from .env");
      return res.status(500).json({
        message: "Authentication is not configured.",
      });
    }

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Fetch admin details, including full_name.
    db.query(
      `SELECT id, full_name, email, password, role, is_active
       FROM admins
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail],
      async (err, results) => {
        if (err) {
          console.error("Database login error:", err.message);
          return res.status(500).json({
            message: "Unable to process login.",
          });
        }

        if (!results || results.length === 0) {
          return res.status(401).json({
            message: "Invalid email or password.",
          });
        }

        const admin = results[0];

        // Reject inactive accounts.
        if (Number(admin.is_active) !== 1) {
          return res.status(403).json({
            message: "Your account is inactive. Contact a superadmin.",
          });
        }

        // Only allow the two supported roles.
        if (!["admin", "superadmin"].includes(admin.role)) {
          return res.status(403).json({
            message: "Your account does not have a valid role.",
          });
        }

        // Compare submitted password with bcrypt hash.
        const passwordMatches = await bcrypt.compare(
          password,
          admin.password
        );

        if (!passwordMatches) {
          return res.status(401).json({
            message: "Invalid email or password.",
          });
        }

        // Return admin ID, name, email and role.
        const user = {
          id: admin.id,
          full_name: admin.full_name,
          email: admin.email,
          role: admin.role,
        };

        const token = jwt.sign(
          {
            id: admin.id,
            email: admin.email,
            role: admin.role,
          },
          jwtSecret,
          {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
          }
        );

        return res.json({
          message: "Login successful.",
          token,
          email: admin.email,
          user,
        });
      }
    );
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to process login.",
    });
  }
});

module.exports = router;
