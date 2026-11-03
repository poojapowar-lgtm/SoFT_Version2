
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { CgMenuGridR } from "react-icons/cg";
import "./sidebar.css";

const Sidebar = ({ menuItems }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="sidebar">
      {/* Mobile menu toggle */}
      <button
        type="button"
        className="sidebar-menu-toggle"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <CgMenuGridR />
      </button>

      {/* Menu items */}
      <ul className={menuOpen ? "sidebar-menu-open" : ""}>
        {menuItems.map((item, index) => {
          const link = item.to || item.path;

          if (!link) return null;

          return (
            <li key={link || index}>
              <NavLink
                to={link}
                end={link === "/"}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  isActive ? "sidebar-link active" : "sidebar-link"
                }
              >
                <span className="menu-arrow"></span>
                {item.name}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;
