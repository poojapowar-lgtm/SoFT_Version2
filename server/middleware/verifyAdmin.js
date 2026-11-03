const jwt = require("jsonwebtoken");
const db = require("../config/db");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. Please log in.",
    });
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is missing from .env");

    return res.status(500).json({
      message: "Server authentication is not configured.",
    });
  }

  let verified;

  try {
    verified = jwt.verify(token, jwtSecret);
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token. Please log in again.",
    });
  }

  if (!verified.id) {
    return res.status(401).json({
      message: "Invalid token. Please log in again.",
    });
  }

  // Verify the current account and role from the database.
  db.query(
    `SELECT id, email, role, is_active
     FROM admins
     WHERE id = ?
     LIMIT 1`,
    [verified.id],
    (err, results) => {
      if (err) {
        console.error("Admin verification error:", err.message);

        return res.status(500).json({
          message: "Unable to verify your account.",
        });
      }

      if (!results || results.length === 0) {
        return res.status(401).json({
          message: "Account not found. Please log in again.",
        });
      }

      const admin = results[0];

      if (Number(admin.is_active) !== 1) {
        return res.status(403).json({
          message: "Your account is inactive. Contact a superadmin.",
        });
      }

      if (!["admin", "superadmin"].includes(admin.role)) {
        return res.status(403).json({
          message: "Access denied. Invalid admin role.",
        });
      }

      // Use current database details, not just the JWT's old role.
      req.user = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      };

      req.admin = req.user;

      next();
    }
  );
};
