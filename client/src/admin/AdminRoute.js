
import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function clearAdminSession() {
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminUser");
}

function AdminRoute({
  children,
  allowedRoles = ["admin", "superadmin"],
}) {
  const token = sessionStorage.getItem("adminToken");
  const storedUser = sessionStorage.getItem("adminUser");

  if (!token || !storedUser) {
    clearAdminSession();
    return <Navigate to="/admin/secure-soft" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const user = JSON.parse(storedUser);

    // Validate token expiration and identity.
    if (
      typeof decoded.exp !== "number" ||
      !Number.isFinite(decoded.exp) ||
      decoded.exp * 1000 <= Date.now() ||
      !decoded.id ||
      !decoded.role
    ) {
      clearAdminSession();
      return <Navigate to="/admin/secure-soft" replace />;
    }

    // Ensure the stored login user matches the JWT.
    if (
      String(user.id) !== String(decoded.id) ||
      user.email !== decoded.email ||
      user.role !== decoded.role
    ) {
      clearAdminSession();
      return <Navigate to="/admin/secure-soft" replace />;
    }

    const role = decoded.role;

    if (!["admin", "superadmin"].includes(role)) {
      clearAdminSession();
      return <Navigate to="/admin/secure-soft" replace />;
    }

    // Restrict pages by role.
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  } catch {
    clearAdminSession();
    return <Navigate to="/admin/secure-soft" replace />;
  }

  return children;
}

export default AdminRoute;
