
import React from "react";
import { IoPersonCircleSharp } from "react-icons/io5";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PendingApprovalNotifications from "../hooks/PendingApprovalNotifications";
import "../AdminPanel.css";

const Topbar = () => {
  const navigate = useNavigate();

  const { pendingCount } = PendingApprovalNotifications();

  let username = "";
  let adminId = "";
  let email = sessionStorage.getItem("email") || "admin@soft.com";

  try {
    const adminUser = sessionStorage.getItem("adminUser");

    if (adminUser) {
      const user = JSON.parse(adminUser);

      username =
        user?.full_name ||
        user?.fullName ||
        user?.username ||
        user?.name ||
        "Admin";

      adminId = user?.id || "";

      email = user?.email || email;
    }
  } catch {
    console.error("Invalid adminUser data in sessionStorage");
  }

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmLogout) return;

    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUser");
    sessionStorage.removeItem("email");

    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("email");

    navigate("/admin/secure-soft", { replace: true });
  };

  return (
    <div className="admin-topbar">
      <h2 className="page-title">SoFT- Admin Panel</h2>

      <button
        type="button"
        className="header-notification-btn"
        onClick={() => navigate("/admin/pending-approvals")}
        title={`${pendingCount} pending requests`}
        aria-label={`${pendingCount} pending requests`}
      >
        <FaBell />

        {pendingCount > 0 && (
          <span className="notification-badge">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        )}
      </button>

      <div className="admin-info">
        <IoPersonCircleSharp className="admin-profile-icon" />

        <div className="admin-details">
          <span className="admin-username">{username}</span>

          {/* {adminId && (
            <span className="admin-id">
              Admin ID: {adminId}
            </span>
          )} */}

          <span className="admin-email">{email}</span>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Topbar;
