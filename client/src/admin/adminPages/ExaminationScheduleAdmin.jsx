
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";

const API_URL = "http://localhost:5000/api/examination-schedule";

const emptyForm = {
  examination: "",
  odd_semester: "",
  even_semester: "",
};

const ExaminationScheduleAdmin = () => {
  const [list, setList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // ================= AUTHENTICATION =================
  const getAuthConfig = () => {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      throw new Error("Session expired. Please log in again.");
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // ================= FETCH PUBLISHED SCHEDULES =================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(API_URL);

      setList(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error(
        "Fetch examination schedules error:",
        error
      );

      setMsg(
        error.response?.data?.message ||
        "Unable to fetch examination schedules."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= FETCH MY APPROVAL REQUESTS =================
  const fetchRequests = useCallback(async () => {
    try {
      setRequestsLoading(true);

      const response = await axios.get(
        `${API_URL}/my-requests`,
        getAuthConfig()
      );

      const data = Array.isArray(response.data?.requests)
        ? response.data.requests
        : [];

      setRequests(data);
    } catch (error) {
      console.error(
        "Fetch examination approval requests error:",
        error.response?.data || error.message
      );

      setRequests([]);

      setMsg(
        error.response?.data?.message ||
        error.message ||
        "Unable to fetch approval requests."
      );
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchRequests();
  }, [fetchData, fetchRequests]);

  // ================= REFRESH =================
  const refreshAll = async () => {
    await Promise.all([fetchData(), fetchRequests()]);
  };

  // ================= PARSE REQUEST DATA =================
  const parseData = (data) => {
    if (!data) return {};

    if (typeof data === "object") {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Unable to parse request data:", error);
      return {};
    }
  };

  // ================= REQUEST HELPERS =================
  const getOperationLabel = (operation) => {
    const labels = {
      create: "Create",
      update: "Update",
      delete: "Delete",
      bulk_create: "Excel Import",
    };

    return labels[operation] || operation || "Unknown";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending Approval",
      approved: "Approved",
      rejected: "Rejected",
      published: "Published",
    };

    return labels[status] || status || "Unknown";
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: {
        background: "#fff3cd",
        color: "#856404",
      },
      approved: {
        background: "#d4edda",
        color: "#155724",
      },
      rejected: {
        background: "#f8d7da",
        color: "#721c24",
      },
      published: {
        background: "#d4edda",
        color: "#155724",
      },
    };

    return (
      styles[String(status || "").toLowerCase()] || {
        background: "#e2e3e5",
        color: "#383d41",
      }
    );
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString();
  };

  // ================= COMBINE PUBLISHED AND REQUESTED DATA =================
  const getCombinedSchedules = () => {
    const relevantRequests = requests
      .filter(
        (request) =>
          request.entity_type === "examination_schedule"
      )
      .sort((a, b) => Number(b.id) - Number(a.id));

    // Display pending/rejected records submitted as new entries.
    const createRequests = relevantRequests
      .filter(
        (request) =>
          request.operation === "create" &&
          ["pending", "rejected"].includes(request.status)
      )
      .map((request) => {
        const data = parseData(request.proposed_data);

        return {
          ...data,
          id: `request-${request.id}`,
          rowKey: `request-${request.id}`,
          displayStatus: request.status,
          isRequest: true,
          requestId: request.id,
          operation: request.operation,
        };
      });

    // Display Excel imports awaiting approval as a single request.
    const bulkRequests = relevantRequests
      .filter(
        (request) =>
          request.operation === "bulk_create" &&
          ["pending", "rejected"].includes(request.status)
      )
      .map((request) => {
        const data = parseData(request.proposed_data);
        const count = Array.isArray(data) ? data.length : 0;

        return {
          examination: `Excel Import (${count} records)`,
          odd_semester: "—",
          even_semester: "—",
          id: `request-${request.id}`,
          rowKey: `request-${request.id}`,
          displayStatus: request.status,
          isRequest: true,
          requestId: request.id,
          operation: request.operation,
        };
      });

    // Published rows retain their existing values until approved.
    const publishedRows = list.map((item) => {
      const latestRequest = relevantRequests.find(
        (request) =>
          Number(request.record_id) === Number(item.id) &&
          ["update", "delete"].includes(request.operation)
      );

      const displayStatus =
        latestRequest &&
          ["pending", "rejected"].includes(latestRequest.status)
          ? latestRequest.status
          : "published";

      return {
        ...item,
        rowKey: `schedule-${item.id}`,
        displayStatus,
        isRequest: false,
        pendingOperation:
          latestRequest?.status === "pending"
            ? latestRequest.operation
            : null,
      };
    });

    return [
      ...createRequests,
      ...bulkRequests,
      ...publishedRows,
    ];
  };

  const displaySchedules = getCombinedSchedules();

  // ================= FILE SELECTION =================
  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setMsg("");
  };

  // ================= EXCEL UPLOAD =================
  const handleExcelUpload = async () => {
    if (!file) {
      setMsg("Please select an Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setMsg("");

      const response = await axios.post(
        `${API_URL}/upload-excel`,
        formData,
        getAuthConfig()
      );

      setMsg(
        response.data?.message ||
        "Excel processed successfully."
      );

      setFile(null);

      const fileInput = document.getElementById(
        "examination-schedule-file"
      );

      if (fileInput) {
        fileInput.value = "";
      }

      await refreshAll();
    } catch (error) {
      console.error("Excel upload error:", error);

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Excel upload failed."
      );
    }
  };

  // ================= EXPORT CSV =================
  const exportToCSV = () => {
    if (list.length === 0) {
      setMsg("No published examination schedules to export.");
      return;
    }

    const headers = [
      "Sr No",
      "Examination",
      "Odd Semester",
      "Even Semester",
    ];

    const rows = list.map((item, index) => [
      index + 1,
      item.examination || "",
      item.odd_semester || "",
      item.even_semester || "",
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Examination_Schedule.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ================= FORM HANDLING =================
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validate = () => {
    const validationErrors = {};

    if (!form.examination.trim()) {
      validationErrors.examination =
        "Examination name is required.";
    }

    if (!form.odd_semester.trim()) {
      validationErrors.odd_semester =
        "Odd semester details are required.";
    }

    if (!form.even_semester.trim()) {
      validationErrors.even_semester =
        "Even semester details are required.";
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  };

  // ================= CREATE / UPDATE =================
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMsg("");

    if (!validate()) return;

    try {
      const config = getAuthConfig();

      const response = editingId
        ? await axios.put(
          `${API_URL}/${editingId}`,
          form,
          config
        )
        : await axios.post(API_URL, form, config);

      setMsg(
        response.data?.message ||
        "Examination schedule request submitted."
      );

      resetForm();
      await refreshAll();
    } catch (error) {
      console.error(
        "Save examination schedule error:",
        error
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to save examination schedule."
      );
    }
  };

  // ================= EDIT =================
  const handleEdit = (item) => {
    if (item.isRequest) return;

    if (item.pendingOperation === "delete") {
      setMsg(
        "A deletion request is pending. Wait for superadmin review before editing this record."
      );
      return;
    }

    setForm({
      examination: item.examination || "",
      odd_semester: item.odd_semester || "",
      even_semester: item.even_semester || "",
    });

    setEditingId(item.id);
    setErrors({});
    setMsg("");
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this examination schedule for deletion?"
      )
    ) {
      return;
    }

    try {
      setMsg("");

      const response = await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      setMsg(
        response.data?.message ||
        "Examination schedule deletion request submitted."
      );

      if (Number(editingId) === Number(id)) {
        resetForm();
      }

      await refreshAll();
    } catch (error) {
      console.error(
        "Delete examination schedule error:",
        error
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to submit deletion request."
      );
    }
  };

  // ================= RENDER =================
  return (
    <div className="admin-page">
      {msg && (
        <div
          className="admin-alert success"
          role="status"
          aria-live="polite"
        >
          {msg}
          <button
            type="button"
            onClick={() => setMsg("")}
            aria-label="Dismiss message"
            style={{ marginLeft: "12px" }}
          >
            ×
          </button>
        </div>
      )}

      <div className="admin-grid">
        {/* ================= FORM ================= */}
        <div className="admin-card">
          <h3 className="card-title">
            {editingId
              ? "Edit Examination Schedule"
              : "Add Examination Schedule"}
          </h3>

          <form onSubmit={handleSubmit}>
            <label>
              Examination *
              <input
                type="text"
                name="examination"
                placeholder="Enter examination name"
                value={form.examination}
                onChange={handleChange}
                required
              />
            </label>

            {errors.examination && (
              <span className="error">
                {errors.examination}
              </span>
            )}

            <label>
              Odd Semester *
              <input
                type="text"
                name="odd_semester"
                placeholder="e.g. Semester III, V & VII"
                value={form.odd_semester}
                onChange={handleChange}
                required
              />
            </label>

            {errors.odd_semester && (
              <span className="error">
                {errors.odd_semester}
              </span>
            )}

            <label>
              Even Semester *
              <input
                type="text"
                name="even_semester"
                placeholder="e.g. Semester IV, VI & VIII"
                value={form.even_semester}
                onChange={handleChange}
                required
              />
            </label>

            {errors.even_semester && (
              <span className="error">
                {errors.even_semester}
              </span>
            )}

            <button className="form-btn" type="submit">
              {editingId ? "Update" : "Submit"}
            </button>

            {editingId && (
              <button
                className="form-btn"
                type="button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </form>

          <p>
            Admin changes require superadmin approval.
            Superadmin changes are published immediately.
          </p>
        </div>

        {/* ================= SCHEDULE TABLE ================= */}
        <div className="admin-card">
          <h3 className="card-title">
            Examination Schedules
          </h3>


          <div className="excel-upload-row">
            <button
              type="button"
              className="sample-excel-btn"
              onClick={() => {
                const link = document.createElement("a");

                link.href =
                  `${process.env.PUBLIC_URL}/assets/docs/sample_examination_schedule.xlsx`;

                link.download =
                  "sample_examination_schedule.xlsx";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              📥 Download Sample Excel
            </button>

            <input
              id="examination-schedule-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={handleExcelUpload}
              disabled={!file}
            >
              Upload Excel
            </button>

            <button
              type="button"
              className="export-btn"
              onClick={exportToCSV}
            >
              Export Data{" "}
              <PiExportBold style={{ fontSize: "20px" }} />
            </button>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <p className="excel-note">
              Excel column headers:
              <br />
              <strong>
                Examination | Odd Semester | Even Semester
              </strong>
            </p>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Examination</th>
                  <th>Odd Semester</th>
                  <th>Even Semester</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6">Loading schedules...</td>
                  </tr>
                ) : displaySchedules.length > 0 ? (
                  displaySchedules.map((item, index) => (
                    <tr key={item.rowKey}>
                      <td>{index + 1}</td>
                      <td>{item.examination || "—"}</td>
                      <td>{item.odd_semester || "—"}</td>
                      <td>{item.even_semester || "—"}</td>

                      <td>
                        <span
                          className={`approval-status-btn ${item.displayStatus}`}
                          style={{
                            ...getStatusStyle(item.displayStatus),
                            padding: "5px 10px",
                            borderRadius: "4px",
                            display: "inline-block",
                          }}
                        >
                          {getStatusLabel(item.displayStatus)}
                        </span>
                      </td>

                      <td>
                        {!item.isRequest ? (
                          <div className="table-actions">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span>Awaiting review</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      No examination schedules or requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExaminationScheduleAdmin;
