
import db from "../config/db.js";

export const logActivity = async (req, data = {}) => {
  try {
    const admin = data.admin ?? req.admin;

    if (!admin) {
      console.warn("Activity log skipped: Admin not found");
      return;
    }

    const adminId = admin.id ?? admin.admin_id ?? null;
    const adminName =
      admin.name ??
      admin.username ??
      admin.email ??
      "Unknown Admin";

    const adminEmail = admin.email ?? null;
    const adminRole = admin.role ?? "admin";

    const {
      module = "System",
      action = "UNKNOWN",
      description = "",
      recordId = null,
      oldData = null,
      newData = null,
      responseStatus = null
    } = data;

    await db.query(
      `INSERT INTO admin_activity_logs (
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
        user_agent,
        response_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        adminName,
        adminEmail,
        adminRole,
        module,
        action,
        description,
        req.method ?? null,
        req.originalUrl?.slice(0, 500) ?? null,
        recordId !== null ? String(recordId) : null,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        req.ip ?? null,
        req.get?.("user-agent") ?? null,
        responseStatus
      ]
    );

  } catch (error) {
    console.error("Activity Logger Error:", error);
  }
};
