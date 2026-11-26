
import React, { useState } from "react";
import { MdAdminPanelSettings } from "react-icons/md";
import {
  FaChevronDown,
  FaChevronRight,
  FaUsersCog,
  FaClipboardCheck,
  FaHistory,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import "../AdminPanel.css";

const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState({});

  // Use the role passed from AdminLayout.
  const storedUser = sessionStorage.getItem("adminUser");
  let currentRole = role;

  if (!currentRole) {
    try {
      currentRole = storedUser
        ? JSON.parse(storedUser)?.role
        : null;
    } catch {
      currentRole = null;
    }
  }

  const isSuperadmin = currentRole === "superadmin";

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard" },

    {
      name: "Academics",
      children: [
        { name: "Board Members", path: "/admin/members" },
        { name: "Faculty Information", path: "/admin/faculty" },
        { name: "MOU Data", path: "/admin/mou" },
        { name: "Academic Calendar", path: "/admin/academic-calendar" },
        { name: "Student Grievance", path: "/admin/student-grievance" },
        { name: "Achievements", path: "/admin/achievements" },
        { name: "FAQ's", path: "/admin/faq" },
      ],
    },

    {
      name: "Examination",
      children: [
        { name: "News & Notices", path: "/admin/news" },
        {
          name: "Examination Schedule",
          path: "/admin/examination-schedule",
        },
      ],
    },

    {
      name: "Placement",
      children: [
        { name: "Placed Students", path: "/admin/placed-students" },
        { name: "Recruiters", path: "/admin/recruiters" },
      ],
    },

    {
      name: "Alumni",
      children: [
        { name: "Alumni Startup", path: "/admin/alumni-startup" },
        { name: "Student Speak", path: "/admin/student-speak" },
      ],
    },

    {
      name: "Research",
      children: [
        { name: "Research Data", path: "/admin/research" },
        {
          name: "Patent Publication",
          path: "/admin/patent-publication",
        },
        { name: "Funded Research", path: "/admin/funded-research" },
        {
          name: "Consultancy Projects",
          path: "/admin/consultancy-projects",
        },
      ],
    },

    {
      name: "Events",
      children: [
        { name: "Happnings Events", path: "/admin/events" },
        { name: "Upcoming Events", path: "/admin/upcoming-events" },
      ],
    },


    { name: "Testimonials", path: "/admin/testimonials" },
    { name: "Enquiry Form", path: "/admin/enquiry" },
    // { name: "Contact Form", path: "/admin/contact" },
  ];

  const toggleMenu = (name) => {
    setOpenMenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isPathActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(`${path}/`);

  return (
    <div className="admin-sidebar">
      <div className="admin-logo">
        <MdAdminPanelSettings />
        <h2>{isSuperadmin ? "Superadmin" : "Admin"}</h2>
      </div>

      <ul>
        {menu.map((item) => {
          const hasChildren = Boolean(item.children?.length);

          const isChildActive =
            hasChildren &&
            item.children.some((child) =>
              isPathActive(child.path)
            );

          const isOpen =
            openMenus[item.name] ?? isChildActive;

          return (
            <React.Fragment key={item.name}>
              <li
                className={`sidebar-item ${item.path && isPathActive(item.path)
                  ? "active"
                  : ""
                  } ${isChildActive ? "active" : ""} ${hasChildren && isOpen ? "dropdown-open" : ""
                  }`}
              >
                <span
                  className="sidebar-item-name"
                  onClick={() => {
                    if (hasChildren) {
                      toggleMenu(item.name);
                    } else {
                      navigate(item.path);
                    }
                  }}
                >
                  {item.name}
                </span>

                {hasChildren && (
                  <span
                    className="dropdown-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(item.name);
                    }}
                  >
                    {isOpen ? (
                      <FaChevronDown />
                    ) : (
                      <FaChevronRight />
                    )}
                  </span>
                )}
              </li>

              {hasChildren && isOpen && (
                <ul className="sidebar-submenu">
                  {item.children.map((child) => (
                    <li
                      key={child.path}
                      className={
                        isPathActive(child.path) ? "active" : ""
                      }
                      onClick={() => navigate(child.path)}
                    >
                      {child.name}
                    </li>
                  ))}
                </ul>
              )}
            </React.Fragment>
          );
        })}

        {/* Superadmin-only menu items */}
        {isSuperadmin && (
          <>
            <li
              className={`sidebar-item ${isPathActive("/admin/user-management") ? "active" : ""
                }`}
              onClick={() => navigate("/admin/user-management")}
            >
              <FaUsersCog />
              <span className="sidebar-item-name">
                User Management
              </span>
            </li>

            <li
              className={`sidebar-item ${isPathActive("/admin/pending-approvals") ? "active" : ""
                }`}
              onClick={() => navigate("/admin/pending-approvals")}
            >
              <FaClipboardCheck />
              <span className="sidebar-item-name">
                Pending Approvals
              </span>
            </li>

            <li
              className={`sidebar-item ${isPathActive("/admin/activity-logs") ? "active" : ""
                }`}
              onClick={() => navigate("/admin/activity-logs")}
            >
              <FaHistory />
              <span className="sidebar-item-name">
                Activity Logs
              </span>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;

