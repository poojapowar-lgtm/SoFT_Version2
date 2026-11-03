
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";

const API_URL = "http://localhost:5000/api/student-grievance";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";
const ENTITY_TYPE = "student_grievance";

const grievanceTypes = [
  { value: "Anti-Ragging Committee", label: "Anti-Ragging Committee" },
  { value: "Anti-Ragging Squad", label: "Anti-Ragging Squad" },
];

const initialForm = {
  representative: "",
  name: "",
  designation: "",
  contact_no: "",
  email_address: "",
};

const StudentGrievance = () => {
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [grievanceType, setGrievanceType] = useState(
    "Anti-Ragging Committee"
  );

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const getAuthConfig = () => {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      throw new Error(
        "Your admin session has expired. Please log in again."
      );
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Parse proposed_data whether stored as an object or JSON string.
  const parseRequestData = (data) => {
    if (!data) return {};

    if (typeof data === "object") return data;

    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  };

  const getRequestData = (request) => {
    const data = parseRequestData(request.proposed_data);

    if (
      data.data &&
      typeof data.data === "object" &&
      !Array.isArray(data.data)
    ) {
      return data.data;
    }

    return data;
  };

  const normalizeStatus = (status) =>
    String(status || "").toLowerCase().trim();

  const getStatusLabel = (status) => {
    switch (normalizeStatus(status)) {
      case "pending":
        return "Pending Approval";
      case "rejected":
        return "Rejected";
      case "approved":
        return "Approved";
      case "published":
        return "Published";
      default:
        return status || "Published";
    }
  };

  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);

    if (normalized === "pending") return "pending";
    if (normalized === "rejected") return "rejected";
    if (normalized === "approved") return "approved";

    return "published";
  };

  const isCreateOperation = (operation) =>
    ["create", "insert", "add"].includes(
      String(operation || "").toLowerCase().trim()
    );

  // ================= FETCH CATEGORY RECORDS =================
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${API_URL}?category=${encodeURIComponent(grievanceType)}`
      );

      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching grievance records:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load records. Please try again."
      );

      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [grievanceType]);

  // ================= FETCH APPROVAL REQUESTS =================
  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(
        REQUESTS_URL,
        getAuthConfig()
      );

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.requests)
          ? res.data.requests
          : [];

      setRequests(
        data
          .filter(
            (request) =>
              String(request.entity_type || "")
                .toLowerCase()
                .trim() === ENTITY_TYPE
          )
          .sort(
            (a, b) =>
              Number(b.id || 0) - Number(a.id || 0)
          )
      );
    } catch (err) {
      console.error(
        "Error fetching grievance approval requests:",
        err.response?.data || err.message
      );
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Return the latest request associated with an existing record.
  const getLatestRequest = (recordId) =>
    requests.find(
      (request) =>
        request.record_id != null &&
        String(request.record_id) === String(recordId)
    );

  // Pending/rejected create requests should appear before publication.
  const getPendingCreateRequests = () =>
    requests.filter((request) => {
      const status = normalizeStatus(request.status);
      const data = getRequestData(request);

      return (
        String(data.category || "") === grievanceType &&
        isCreateOperation(request.operation) &&
        ["pending", "rejected"].includes(status) &&
        !members.some(
          (item) =>
            request.record_id != null &&
            String(item.id) === String(request.record_id)
        )
      );
    });

  const getCombinedMembers = () => {
    const publishedRows = members.map((item) => ({
      ...item,
      rowType: "published",
      approvalRequest: getLatestRequest(item.id),
    }));

    const requestRows = getPendingCreateRequests().map((request) => {
      const data = getRequestData(request);

      return {
        id: `request-${request.id}`,
        requestId: request.id,
        rowType: "request",
        representative: data.representative || "",
        name: data.name || "",
        designation: data.designation || "",
        contact_no: data.contact_no || "",
        email_address: data.email_address || "",
        category: data.category || grievanceType,
        approvalRequest: request,
      };
    });

    return [...publishedRows, ...requestRows];
  };

  const displayedMembers = getCombinedMembers();

  // ================= FORM HANDLING =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleTypeChange = (type) => {
    setGrievanceType(type);
    resetForm();
    setFile(null);
    setMessage("");
    setError("");

    const fileInput = document.getElementById(
      "student-grievance-excel-file"
    );

    if (fileInput) fileInput.value = "";
  };

  // ================= ADD / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.representative.trim() ||
      !form.name.trim() ||
      !form.designation.trim()
    ) {
      setError(
        "Please fill in Representative, Name, and Designation."
      );
      return;
    }

    const payload = {
      representative: form.representative.trim(),
      name: form.name.trim(),
      designation: form.designation.trim(),
      contact_no: form.contact_no.trim(),
      email_address: form.email_address.trim(),
      category: grievanceType,
    };

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      if (editingId !== null) {
        await axios.put(
          `${API_URL}/${editingId}`,
          payload,
          getAuthConfig()
        );

        setMessage(
          "Record update submitted for approval."
        );
      } else {
        await axios.post(
          API_URL,
          payload,
          getAuthConfig()
        );

        setMessage(
          "Record creation submitted for approval."
        );
      }

      resetForm();

      await Promise.all([
        fetchMembers(),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error("Error submitting grievance record:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to submit record. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ================= EXCEL UPLOAD =================
  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setMessage("");
    setError("");
  };

  const handleExcelUpload = async () => {
    if (!file) {
      setError("Please select an Excel file.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      setError("Please upload an Excel file (.xlsx or .xls).");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", grievanceType);

    try {
      setUploading(true);
      setMessage("");
      setError("");

      const response = await axios.post(
        `${API_URL}/upload-excel`,
        formData,
        getAuthConfig()
      );

      setMessage(
        response.data?.message ||
        "Excel upload request processed."
      );

      setFile(null);

      const fileInput = document.getElementById(
        "student-grievance-excel-file"
      );

      if (fileInput) fileInput.value = "";

      await Promise.all([
        fetchMembers(),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error("Excel upload error:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Excel upload failed. Please check your file."
      );
    } finally {
      setUploading(false);
    }
  };

  // ================= EDIT =================
  const handleEdit = (item) => {
    if (item.rowType === "request") return;

    setForm({
      representative: item.representative || "",
      name: item.name || "",
      designation: item.designation || "",
      contact_no: item.contact_no || "",
      email_address: item.email_address || "",
    });

    setEditingId(item.id);
    setMessage("");
    setError("");
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this record for deletion approval?"
      )
    ) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      setMessage(
        "Record deletion submitted for approval."
      );

      if (String(editingId) === String(id)) {
        resetForm();
      }

      await Promise.all([
        fetchMembers(),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error("Error submitting record deletion:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to submit deletion request."
      );
    }
  };

  const selectedTypeLabel =
    grievanceTypes.find((type) => type.value === grievanceType)?.label ||
    "Student Grievance";

  // ================= EXPORT CSV =================
  const exportToCSV = () => {
    if (!displayedMembers.length) {
      setError("No records available to export.");
      return;
    }

    const headers = [
      "Sr. No.",
      "Representative",
      "Name",
      "Designation",
      "Contact No.",
      "Email Address",
      "Approval Status",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = displayedMembers.map((item, index) => [
      index + 1,
      item.representative,
      item.name,
      item.designation,
      item.contact_no,
      item.email_address,
      item.approvalRequest
        ? getStatusLabel(item.approvalRequest.status)
        : "Published",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${grievanceType
      .toLowerCase()
      .replace(/\s+/g, "_")}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    setError("");
  };

  // ================= DELETE ALL =================
  const handleDeleteAll = async () => {
    if (members.length === 0) {
      setError("There is no data to delete.");
      return;
    }

    const confirmed = window.confirm(
      `WARNING!\n\nAre you sure you want to permanently delete ALL ${members.length} records from ${selectedTypeLabel}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage("");
      setError("");

      await axios.delete(
        `${API_URL}/category/${encodeURIComponent(grievanceType)}`,
        getAuthConfig()
      );

      setMessage(
        `Delete request for ${selectedTypeLabel} records was processed.`
      );

      resetForm();

      await Promise.all([
        fetchMembers(),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error("Error processing Delete All:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to process Delete All."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      {message && (
        <div className="admin-alert success success">{message}</div>
      )}

      {error && (
        <div className="admin-alert success error">{error}</div>
      )}

      <div className="admin-grid">
        {/* FORM */}
        <div className="admin-card">
          <h2 className="card-title">
            {editingId !== null ? "Edit Record" : "Add Record"}
          </h2>

          <div className="switch-btns">
            {grievanceTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                className={`switch-btn ${grievanceType === type.value ? "active" : ""
                  }`}
                onClick={() => handleTypeChange(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Representative *
              <input
                type="text"
                name="representative"
                value={form.representative}
                onChange={handleChange}
                placeholder="Enter representative"
                required
              />
            </label>

            <label>
              Name *
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter name"
                required
              />
            </label>

            <label>
              Designation *
              <input
                type="text"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="Enter designation"
                required
              />
            </label>

            <label>
              Contact No.
              <input
                type="tel"
                name="contact_no"
                value={form.contact_no}
                onChange={handleChange}
                placeholder="Enter contact number"
              />
            </label>

            <label>
              Email Address
              <input
                type="email"
                name="email_address"
                value={form.email_address}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </label>

            <button
              className="form-btn"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : editingId !== null
                  ? "Submit Update for Approval"
                  : "Submit"}
            </button>

            {editingId !== null && (
              <button
                className="form-btn"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* RECORDS TABLE */}
        <div className="admin-card">
          <div className="export-delete">
            <h2 className="card-title">{selectedTypeLabel}</h2>

            {/* <div className="export-delete-buttons">
              <button
                type="button"
                className="delete-all-btn"
                onClick={handleDeleteAll}
                disabled={loading || members.length === 0}
              >
                Delete All Data
              </button>
            </div> */}
          </div>

          <div className="excel-upload-row">
            <button
              type="button"
              className="sample-excel-btn"
              onClick={() => {
                const link = document.createElement("a");

                link.href = `${process.env.PUBLIC_URL}/assets/docs/sample_student_grievance.xlsx`;
                link.download = "sample_student_grievance.xlsx";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              📥 Download Sample Excel
            </button>

            <input
              id="student-grievance-excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading}
            />

            <button
              type="button"
              onClick={handleExcelUpload}
              disabled={uploading || !file}
            >
              {uploading ? "Uploading..." : "Upload Excel"}
            </button>

            <button
              type="button"
              className="export-btn"
              onClick={exportToCSV}
              disabled={loading || displayedMembers.length === 0}
            >
              Export Data
              <PiExportBold style={{ fontSize: "20px" }} />
            </button>
          </div>

          {/* EXCEL UPLOAD */}
          <div style={{ marginBottom: "15px" }}>
            <p className="excel-note">
              Excel file must have these headers:
              <br />
              <strong>
                Representative | Name | Designation | Contact No. |
                Email Address
              </strong>
              <br />
              Selected category: <strong>{selectedTypeLabel}</strong>
            </p>


          </div>

          {loading ? (
            <p>Loading records...</p>
          ) : displayedMembers.length === 0 ? (
            <p>No records found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Representative</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Contact No.</th>
                    <th>Email Address</th>
                    <th>Approval Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedMembers.map((item, index) => {
                    const status =
                      item.approvalRequest?.status || "published";

                    return (
                      <tr
                        key={
                          item.rowType === "request"
                            ? `request-${item.requestId}`
                            : `grievance-${item.id}`
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{item.representative}</td>
                        <td>{item.name}</td>
                        <td>{item.designation}</td>

                        <td>
                          {item.contact_no ? (
                            <a href={`tel:${item.contact_no}`}>
                              {item.contact_no}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td>
                          {item.email_address ? (
                            <a href={`mailto:${item.email_address}`}>
                              {item.email_address}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td>
                          <span
                            className={`approval-status-btn  ${getStatusClass(status)}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </td>

                        <td>
                          <div className="table-actions">
                            {item.rowType === "request" ? (
                              <span>Awaiting review</span>
                            ) : (
                              <>
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
                                </button></>


                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentGrievance;
