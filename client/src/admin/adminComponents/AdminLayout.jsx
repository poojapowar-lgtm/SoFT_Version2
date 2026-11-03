import React, { useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../AdminPanel.css";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handlingBack = useRef(false);

  // Read the authenticated user from the current session.
  let adminUser = null;

  try {
    const storedUser = sessionStorage.getItem("adminUser");
    adminUser = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    adminUser = null;
  }

  const role = adminUser?.role;

  useEffect(() => {
    handlingBack.current = false;

    window.history.pushState(
      { adminPage: true },
      "",
      window.location.href
    );

    const handlePopState = () => {
      if (handlingBack.current) return;

      const shouldLogout = window.confirm(
        "Do you want to log out of the admin panel?"
      );

      if (shouldLogout) {
        handlingBack.current = true;

        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");

        // Remove legacy credentials, if any.
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        navigate("/admin/secure-soft", { replace: true });
      } else {
        window.history.pushState(
          { adminPage: true },
          "",
          window.location.href
        );
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, location.pathname]);

  return (
    <div className="admin-container">
      <Sidebar role={role} />

      <div className="admin-main">
        <Topbar />

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
