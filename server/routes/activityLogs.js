
const express = require("express");
const db = require("../config/db");

const router = express.Router();

// Superadmin-only access
function requireSuperAdmin(req, res, next) {
  if (req.admin?.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Superadmin privileges required.",
    });
  }

  next();
}

router.get("/", requireSuperAdmin, (req, res) => {
  const {
    search = "",
    module = "",
    action = "",
    fromDate = "",
    toDate = "",
    page = 1,
    limit = 20,
  } = req.query;

  const currentPage = Math.max(1, Number(page) || 1);

  const pageSize = Math.min(
    100,
    Math.max(1, Number(limit) || 20)
  );

  const offset = (currentPage - 1) * pageSize;

  let where = " WHERE 1=1 ";
  const params = [];

  if (search.trim()) {
    where += ` AND (
      admin_name LIKE ?
      OR admin_email LIKE ?
      OR description LIKE ?
      OR module LIKE ?
    )`;

    const value = `%${search.trim()}%`;
    params.push(value, value, value, value);
  }

  if (module) {
    where += " AND module = ?";
    params.push(module);
  }

  if (action) {
    where += " AND action = ?";
    params.push(action);
  }

  if (fromDate) {
    where += " AND created_at >= ?";
    params.push(`${fromDate} 00:00:00`);
  }

  if (toDate) {
    where += ` AND created_at < DATE_ADD(
      ?, INTERVAL 1 DAY
    )`;

    params.push(`${toDate} 00:00:00`);
  }

  // Fetch total count first
  db.query(
    `SELECT COUNT(*) AS total
     FROM admin_activity_logs
     ${where}`,
    params,
    (countError, countResult) => {
      if (countError) {
        console.error("Activity Log Count Error:", countError);

        return res.status(500).json({
          success: false,
          message: "Unable to fetch activity log count",
        });
      }

      const total = Number(countResult[0].total);

      // Fetch paginated activity logs
      db.query(
        `SELECT
          id,
          admin_id,
          admin_name,
          admin_email,
          admin_role,
          module,
          action,
          description,
          request_method,
          request_url,
          record_id,
          old_data,
          new_data,
          ip_address,
          response_status,
          created_at
         FROM admin_activity_logs
         ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
        (logsError, logs) => {
          if (logsError) {
            console.error("Activity Log Fetch Error:", logsError);

            return res.status(500).json({
              success: false,
              message: "Unable to fetch activity logs",
            });
          }

          return res.json({
            success: true,
            logs,
            total,
            page: currentPage,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
          });
        }
      );
    }
  );
});

module.exports = router;
