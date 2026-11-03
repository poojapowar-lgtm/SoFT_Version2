
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaSearch,
  FaHistory,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaDownload
} from "react-icons/fa";
import "../AdminPanel.css";
import "./ActivityLog.css";

const API_URL =
  "http://localhost:5000/api/activity-logs";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);

  const limit = 20;

  const getConfig = () => ({
    headers: {
      Authorization:
        `Bearer ${sessionStorage.getItem("adminToken")}`
    }
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await axios.get(API_URL, {
        ...getConfig(),
        params: {
          search,
          module,
          action,
          fromDate,
          toDate,
          page,
          limit
        }
      });

      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 0);

    } catch (error) {
      console.error("Fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, module, action, fromDate, toDate, page]);

  const getActionClass = (value) => {
    const classes = {
      CREATE: "activity-create",
      UPDATE: "activity-update",
      DELETE: "activity-delete",
      APPROVE: "activity-approve",
      REJECT: "activity-reject",
      LOGIN: "activity-login",
      LOGOUT: "activity-logout",
      LOGIN_FAILED: "activity-failed",
      VIEW: "activity-view",
      SUBMIT: "activity-submit"
    };

    return classes[value] || "activity-default";
  };

  const exportCSV = () => {
    const headers = [
      "Admin",
      "Email",
      "Role",
      "Module",
      "Action",
      "Description",
      "IP Address",
      "Date"
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = logs.map(log => [
      log.admin_name,
      log.admin_email,
      log.admin_role,
      log.module,
      log.action,
      log.description,
      log.ip_address,
      log.created_at
    ]);

    const csv = [
      headers,
      ...rows
    ].map(row => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Admin_Activity_Log.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="activity-page">

      <div className="activity-header">
        <div>
          <h2 className="card-title">
            <FaHistory /> Activity Log
          </h2>
          <p>Monitor all administrative activities.</p>
        </div>

        <button
          className="export-btn "
          onClick={exportCSV}
          disabled={!logs.length}
        >
          <FaDownload /> Export CSV
        </button>
      </div>

      <div className="activity-top">
        <div className="activity-total">
          <span>Total Activities</span>
          <h3>{total}</h3>
        </div>

        <div className="activity-filters">
          <div className="activity-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search admin, module or activity..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={module}
            onChange={e => {
              setModule(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Modules</option>
            {[
              "News",
              "Events",
              "Student Enquiries",
              "Members",
              "Student Speak",
              "Recruiters",
              "Faculty",
              "Research",
              "MOU",
              "Placed Students",
              "Alumni Startup",
              "Contact",
              "Testimonials",
              "Visitors",
              "Patent Publications",
              "Funded Research",
              "Consultancy Projects",
              "Examination Schedule",
              "Academic Calendar",
              "FAQs",
              "Student Grievance",
              "Admin Management"
            ].map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={action}
            onChange={e => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Actions</option>
            {[
              "CREATE",
              "UPDATE",
              "DELETE",
              "EXCEL_UPLOAD",
              "SUBMIT_FOR_APPROVAL",
              "APPROVE",
              "REJECT",
              "EXPORT"
            ].map(item => (
              <option key={item} value={item}>
                {item.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={e => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />

          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={e => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />

        </div>

      </div>

      <div className="activity-table-wrapper">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Module</th>
              <th>Action</th>
              <th>Description</th>
              <th>Date & Time</th>
              <th>Details</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Loading activities...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="6">
                  No activity records found.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <strong>{log.admin_name}</strong>
                    <small>{log.admin_role}</small>
                  </td>

                  <td>{log.module}</td>

                  <td>
                    <span className={`activity-badge ${getActionClass(log.action)
                      }`}>
                      {log.action}
                    </span>
                  </td>

                  <td>{log.description}</td>

                  <td>
                    {new Date(log.created_at).toLocaleString()}
                  </td>

                  <td>
                    <button
                      className="activity-view-btn"
                      onClick={() => setSelectedLog(log)}
                      aria-label="View activity details"
                    >
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="activity-pagination">
        <span>
          Showing {logs.length} of {total} activities
        </span>

        <div>
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => p - 1)}
          >
            <FaChevronLeft />
          </button>

          <span>{page} / {Math.max(totalPages, 1)}</span>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage(p => p + 1)}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {selectedLog && (
        <div
          className="activity-modal-overlay"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="activity-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="activity-modal-header">
              <h3>Activity Details</h3>

              <button onClick={() => setSelectedLog(null)}>
                <FaTimes />
              </button>
            </div>

            <p><strong>Admin:</strong> {selectedLog.admin_name}</p>
            <p><strong>Email:</strong> {selectedLog.admin_email}</p>
            <p><strong>Role:</strong> {selectedLog.admin_role}</p>
            <p><strong>Module:</strong> {selectedLog.module}</p>
            <p><strong>Action:</strong> {selectedLog.action}</p>
            <p><strong>Description:</strong> {selectedLog.description}</p>
            <p><strong>IP Address:</strong> {selectedLog.ip_address}</p>
            <p><strong>Status:</strong> {selectedLog.response_status}</p>
            <p><strong>Record ID:</strong> {selectedLog.record_id}</p>

            <h4>Previous Data</h4>
            <pre>
              {JSON.stringify(selectedLog.old_data, null, 2)}
            </pre>

            <h4>Updated Data</h4>
            <pre>
              {JSON.stringify(selectedLog.new_data, null, 2)}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};

export default ActivityLog;
