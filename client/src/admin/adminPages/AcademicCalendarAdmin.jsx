
import React, { useEffect, useState } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";
import RichTextEditor from "../adminComponents/RichTextEditor";

const API_URL = "http://localhost:5000/api/academic-calendar";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";

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

const normalizeValue = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const AcademicCalendarAdmin = () => {
  const [list, setList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    sr_no: "",
    program_name: "",
    date_and_event: "",
  });

  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  // ================= FETCH PUBLISHED DATA =================
  const fetchData = async () => {
    try {
      const response = await axios.get(API_URL);

      setList(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error(
        "Fetch academic calendar error:",
        error.response?.data || error.message
      );

      setMsg("Failed to fetch academic calendar data.");
    }
  };

  // ================= FETCH APPROVAL REQUESTS =================
  const fetchRequests = async () => {
    try {
      const response = await axios.get(
        REQUESTS_URL,
        getAuthConfig()
      );

      const allRequests = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.requests)
          ? response.data.requests
          : [];

      console.log("All approval requests:", allRequests);

      const calendarRequests = allRequests.filter(
        (request) =>
          normalizeValue(request.entity_type) ===
          "academic_calendar"
      );

      console.log(
        "Academic Calendar approval requests:",
        calendarRequests
      );

      setRequests(calendarRequests);
    } catch (error) {
      console.error(
        "Fetch academic calendar requests error:",
        error.response?.data || error.message
      );

      setRequests([]);
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchData();
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= EXCEL FILE SELECTION =================
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
      const config = getAuthConfig();

      const response = await axios.post(
        `${API_URL}/upload-excel`,
        formData,
        {
          ...config,
          headers: {
            ...config.headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMsg(
        response.data?.message ||
        "Excel uploaded successfully."
      );

      setFile(null);

      const input = document.getElementById(
        "academic-calendar-excel"
      );

      if (input) input.value = "";

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (error) {
      console.error(
        "Excel upload error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Excel upload failed."
      );
    }
  };

  // ================= EXPORT TO CSV =================
  const exportToCSV = () => {
    if (list.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Sr. No.",
      "Name of the Program",
      "Date and Event",
    ];

    const rows = list.map((item, index) => [
      item.sr_no || index + 1,
      item.program_name || "",
      item.date_and_event || "",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) =>
          row
            .map(
              (value) =>
                `"${String(value).replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "academic-calendar.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ================= PARSE PROPOSED DATA =================
  const parseRequestData = (data) => {
    if (!data) return {};

    let parsed = data;

    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (error) {
        console.error("Failed to parse proposed_data:", error);
        return {};
      }
    }

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    if (
      parsed.data &&
      typeof parsed.data === "object" &&
      !Array.isArray(parsed.data)
    ) {
      return parsed.data;
    }

    return parsed;
  };

  // ================= COMBINE DATA AND REQUESTS =================
  const getCombinedCalendar = () => {
    const calendarRequests = requests.filter(
      (request) =>
        normalizeValue(request.entity_type) ===
        "academic_calendar"
    );

    const createRequests = calendarRequests
      .filter((request) => {
        const operation = normalizeValue(request.operation);
        const status = normalizeValue(request.status);

        return (
          ["create", "insert", "add", "create_record"].includes(
            operation
          ) &&
          ["pending", "pending_approval", "rejected"].includes(
            status
          )
        );
      })
      .map((request) => {
        const data = parseRequestData(request.proposed_data);

        return {
          ...data,
          id: `request-${request.id}`,
          rowKey: `request-${request.id}`,
          displayStatus: normalizeValue(request.status),
          isRequest: true,
          operation: request.operation,
        };
      });

    const publishedRows = list.map((item) => {
      const relatedRequests = calendarRequests
        .filter(
          (request) =>
            request.record_id !== null &&
            request.record_id !== undefined &&
            item.id !== null &&
            item.id !== undefined &&
            String(request.record_id) === String(item.id)
        )
        .sort(
          (a, b) => Number(b.id || 0) - Number(a.id || 0)
        );

      const latestRequest = relatedRequests[0];
      const status = normalizeValue(latestRequest?.status);

      const displayStatus = [
        "pending",
        "pending_approval",
        "rejected",
        "approved",
      ].includes(status)
        ? status
        : "published";

      return {
        ...item,
        rowKey: `calendar-${item.id}`,
        displayStatus,
        isRequest: false,
        pendingOperation:
          ["pending", "pending_approval"].includes(displayStatus)
            ? latestRequest?.operation
            : null,
      };
    });

    return [...createRequests, ...publishedRows];
  };

  const displayList = getCombinedCalendar();

  // ================= FORM HANDLING =================
  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  // ================= VALIDATION =================
  const validate = () => {
    const validationErrors = {};

    if (
      !String(form.sr_no).trim() ||
      !Number.isInteger(Number(form.sr_no)) ||
      Number(form.sr_no) < 1
    ) {
      validationErrors.sr_no =
        "Enter a valid serial number greater than zero.";
    }

    if (!form.program_name.trim()) {
      validationErrors.program_name = "Required";
    }

    const eventText = String(form.date_and_event || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;|&#39;|&apos;/gi, " ")
      .trim();

    if (!eventText) {
      validationErrors.date_and_event = "Required";
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setForm({
      sr_no: "",
      program_name: "",
      date_and_event: "",
    });

    setEditingId(null);
    setErrors({});
  };

  // ================= ADD / UPDATE REQUEST =================
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    const payload = {
      sr_no: Number(form.sr_no),
      program_name: form.program_name.trim(),
      date_and_event: form.date_and_event,
    };

    try {
      const config = getAuthConfig();

      const response = editingId
        ? await axios.put(
          `${API_URL}/${editingId}`,
          payload,
          config
        )
        : await axios.post(
          API_URL,
          payload,
          config
        );

      setMsg(
        response.data?.message ||
        "Academic calendar approval request submitted successfully."
      );

      resetForm();

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (error) {
      console.error(
        "Save academic calendar error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error submitting academic calendar request."
      );
    }
  };

  // ================= EDIT =================
  const handleEdit = (item) => {
    setForm({
      sr_no: item.sr_no ?? "",
      program_name: item.program_name || "",
      date_and_event: item.date_and_event || "",
    });

    setEditingId(item.id);
    setErrors({});
    setMsg("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ================= DELETE REQUEST =================
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this academic calendar record for deletion approval?"
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      setMsg(
        response.data?.message ||
        "Academic calendar deletion request submitted successfully."
      );

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (error) {
      console.error(
        "Delete academic calendar error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to submit deletion request."
      );
    }
  };

  // ================= DELETE ALL =================
  const handleDeleteAll = async () => {
    if (list.length === 0) {
      setMsg(
        "No academic calendar records available to delete."
      );
      return;
    }

    const confirmed = window.confirm(
      `WARNING!\n\nAre you sure you want to permanently delete ALL ${list.length} academic calendar records?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setMsg("");

      const response = await axios.delete(
        `${API_URL}/delete-all`,
        getAuthConfig()
      );

      setMsg(
        response.data?.message ||
        "Academic calendar bulk deletion request processed."
      );

      resetForm();

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (error) {
      console.error(
        "Delete all academic calendar error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to delete all academic calendar records."
      );
    }
  };

  // ================= APPROVAL STATUS =================
  const getStatusLabel = (status) => {
    const normalized = normalizeValue(status);

    const labels = {
      pending: "Pending Approval",
      pending_approval: "Pending Approval",
      approved: "Approved",
      rejected: "Rejected",
      published: "Published",
    };

    return labels[normalized] || status || "Unknown";
  };

  // ================= DOWNLOAD SAMPLE EXCEL =================
  const downloadSampleExcel = () => {
    const link = document.createElement("a");

    link.href =
      `${process.env.PUBLIC_URL}/assets/docs/sample_academic-calendar.xlsx`;

    link.download = "sample_academic-calendar.xlsx";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-page">
      {msg && (
        <div className="admin-alert success">
          {msg}
        </div>
      )}

      <div className="admin-grid">
        {/* ================= FORM ================= */}
        <div className="admin-card">
          <h2 className="card-title">
            {editingId
              ? "Edit Academic Calendar"
              : "Add Academic Calendar"}
          </h2>

          <form onSubmit={handleSubmit}>
            <label>
              Sr. No. *
              <input
                type="number"
                name="sr_no"
                placeholder="Enter serial number"
                value={form.sr_no}
                onChange={handleChange}
                min="1"
                required
              />
            </label>

            {errors.sr_no && (
              <span className="error">
                {errors.sr_no}
              </span>
            )}

            <label>
              Name of the Program *
              <input
                type="text"
                name="program_name"
                placeholder="Enter program name"
                value={form.program_name}
                onChange={handleChange}
                required
              />
            </label>

            {errors.program_name && (
              <span className="error">
                {errors.program_name}
              </span>
            )}

            <label
              style={{
                display: "block",
                marginTop: "20px",
              }}
            >
              Date and Event *
            </label>

            <RichTextEditor
              value={form.date_and_event}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  date_and_event: value,
                }))
              }
              placeholder="Enter dates and events..."
            />

            {errors.date_and_event && (
              <span className="error">
                {errors.date_and_event}
              </span>
            )}

            <div style={{ marginTop: "55px" }}>
              <button
                className="form-btn"
                type="submit"
              >
                {editingId ? "Update" : "Submit"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="form-btn"
                  onClick={resetForm}
                  style={{ marginLeft: "10px" }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ================= TABLE + EXCEL ================= */}
        <div className="admin-card">
          <div className="export-delete">
            <h2 className="card-title">
              Academic Calendar List
            </h2>

            {/* <div className="export-delete-buttons">
            <button
                type="button"
                className="delete-all-btn"
                onClick={handleDeleteAll}
                disabled={list.length === 0}
              >
                Delete All Data
              </button>
            </div> */}
          </div>

          <div className="excel-upload-row">
            <button
              type="button"
              className="sample-excel-btn"
              onClick={downloadSampleExcel}
            >
              📥 Download Sample Excel
            </button>

            <input
              id="academic-calendar-excel"
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
              disabled={list.length === 0}
            >
              Export Data
              <PiExportBold
                style={{ fontSize: "20px" }}
              />
            </button>


          </div>

          {/* EXCEL UPLOAD */}
          <div style={{ marginBottom: "15px" }}>
            <p className="excel-note">
              Excel file must contain these columns in order:
              <br />
              <strong>
                Sr. No. | Name of the Program | Date and Event
              </strong>
            </p>


          </div>

          {/* RECORDS TABLE */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Name of the Program</th>
                  <th>Date and Event</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {displayList.length > 0 ? (
                  displayList.map((item, index) => (
                    <tr key={item.rowKey}>
                      <td>
                        {item.sr_no || index + 1}
                      </td>

                      <td>
                        {item.program_name || "-"}
                      </td>

                      <td>
                        <div
                          className="academic-event-content"
                          dangerouslySetInnerHTML={{
                            __html: item.date_and_event || "",
                          }}
                        />
                      </td>

                      <td>
                        <span
                          className={`approval-status-btn ${item.displayStatus}`}
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
                    <td
                      colSpan="5"
                      style={{ textAlign: "center" }}
                    >
                      No academic calendar records or approval
                      requests found.
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

export default AcademicCalendarAdmin;
