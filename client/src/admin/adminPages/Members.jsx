
import React, { useEffect, useState } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";

const API_URL = "http://localhost:5000/api/members";
const ADMIN_REQUESTS_URL =
  "http://localhost:5000/api/admin/my-requests";

const memberTypes = [
  { value: "governing", label: "Governing Body" },
  { value: "board", label: "Board Members" },
  { value: "research_committee", label: "Research Committee" },
];

const Members = () => {
  const [members, setMembers] = useState([]);
  const [memberRequests, setMemberRequests] = useState([]);
  const [memberType, setMemberType] = useState("governing");

  const [form, setForm] = useState({
    name: "",
    designation: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);

  const selectedTypeLabel =
    memberTypes.find((type) => type.value === memberType)?.label ||
    "Members";

  // Authentication configuration
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

  // Fetch published members
  const fetchMembers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}?type=${memberType}`
      );

      setMembers(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error(
        "Error fetching members:",
        err.response?.data || err.message
      );

      setMembers([]);
      setError(
        err.response?.data?.message ||
        "Unable to load members."
      );
    }
  };

  // Fetch approval requests for the logged-in admin
  const fetchMemberRequests = async () => {
    try {
      const response = await axios.get(
        ADMIN_REQUESTS_URL,
        getAuthConfig()
      );

      const requests = Array.isArray(response.data?.requests)
        ? response.data.requests
        : [];

      setMemberRequests(requests);
    } catch (err) {
      console.error(
        "Failed to fetch member approval requests:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMemberRequests([]);
    }
  };

  // Load records and approval requests when category changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        await Promise.all([
          fetchMembers(),
          fetchMemberRequests(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberType]);

  // Parse proposed_data
  const parseRequestData = (data) => {
    if (!data) return {};

    if (typeof data === "object") {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch (err) {
      console.error("Unable to parse request data:", err);
      return {};
    }
  };

  // Combine published members with approval requests
  const getCombinedMembers = () => {
    // Pending/rejected newly created members
    const createRequests = memberRequests
      .filter(
        (request) =>
          request.entity_type === "members" &&
          request.operation === "create" &&
          ["pending", "rejected"].includes(request.status)
      )
      .map((request) => {
        const data = parseRequestData(request.proposed_data);

        if (
          data.member_type &&
          data.member_type !== memberType
        ) {
          return null;
        }

        return {
          ...data,
          id: `request-${request.id}`,
          rowKey: `request-${request.id}`,
          displayStatus: request.status,
          isRequest: true,
          requestId: request.id,
          operation: request.operation,
        };
      })
      .filter(Boolean);

    // Published members with the latest related request status
    const publishedRows = members.map((member) => {
      const relatedRequests = memberRequests
        .filter(
          (request) =>
            request.entity_type === "members" &&
            Number(request.record_id) === Number(member.id)
        )
        .sort((a, b) => Number(b.id) - Number(a.id));

      const latestRequest = relatedRequests[0];

      const displayStatus =
        latestRequest &&
          ["pending", "rejected"].includes(latestRequest.status)
          ? latestRequest.status
          : "published";

      return {
        ...member,
        rowKey: `member-${member.id}`,
        displayStatus,
        isRequest: false,
        pendingOperation:
          latestRequest?.status === "pending"
            ? latestRequest.operation
            : null,
      };
    });

    return [...createRequests, ...publishedRows];
  };

  const displayMembers = getCombinedMembers();

  // Status labels
  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending Approval",
      approved: "Approved",
      rejected: "Rejected",
      published: "Published",
    };

    return labels[status] || status || "Unknown";
  };

  // Input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setForm({
      name: "",
      designation: "",
    });

    setEditingId(null);
  };

  // Change member category
  const handleTypeChange = (type) => {
    setMemberType(type);
    resetForm();
    setMessage("");
    setError("");
  };

  // Add or update member
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.designation.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      designation: form.designation.trim(),
      member_type: memberType,
    };

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const response = editingId
        ? await axios.put(
          `${API_URL}/${editingId}`,
          payload,
          getAuthConfig()
        )
        : await axios.post(
          API_URL,
          payload,
          getAuthConfig()
        );

      setMessage(
        response.data?.message ||
        "Request submitted successfully."
      );

      resetForm();

      await Promise.all([
        fetchMembers(),
        fetchMemberRequests(),
      ]);
    } catch (err) {
      console.error(
        "Error saving member:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to save member."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Select Excel file
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    setFile(selectedFile);
    setMessage("");
    setError("");
  };

  // Excel bulk upload
  const handleExcelUpload = async () => {
    if (!file) {
      setError("Please select an Excel file.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("member_type", memberType);

      const token = sessionStorage.getItem("adminToken");

      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }

      const response = await axios.post(
        `${API_URL}/upload-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data?.message ||
        "Excel upload request submitted successfully."
      );

      setFile(null);

      const fileInput = document.getElementById(
        "members-excel-file"
      );

      if (fileInput) {
        fileInput.value = "";
      }

      await Promise.all([
        fetchMembers(),
        fetchMemberRequests(),
      ]);
    } catch (err) {
      console.error(
        "Excel upload error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Excel upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  // Edit member
  const handleEdit = (item) => {
    setForm({
      name: item.name || "",
      designation: item.designation || "",
    });

    setEditingId(item.id);
    setMessage("");
    setError("");
  };

  // Delete one member
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to submit this member deletion?"
      )
    ) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const response = await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      setMessage(
        response.data?.message ||
        "Deletion request submitted successfully."
      );

      if (String(editingId) === String(id)) {
        resetForm();
      }

      await Promise.all([
        fetchMembers(),
        fetchMemberRequests(),
      ]);
    } catch (err) {
      console.error(
        "Error deleting member:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to delete member."
      );
    }
  };

  // Export published member records to CSV
  const exportToCSV = () => {
    if (!members.length) {
      setError("No member data available to export.");
      return;
    }

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const headers = ["Sr. No.", "Name", "Designation"];

    const rows = members.map((member, index) => [
      index + 1,
      member.name,
      member.designation,
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
    link.download = `${memberType}_members.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    setError("");
  };

  // Delete all members in the selected category
  const handleDeleteAll = async () => {
    if (members.length === 0) {
      setError("There are no published records to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to submit a request to delete all ${members.length} records from ${selectedTypeLabel}?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const response = await axios.delete(
        `${API_URL}/type/${memberType}`,
        getAuthConfig()
      );

      setMessage(
        response.data?.message ||
        "Delete-all request submitted successfully."
      );

      resetForm();

      await Promise.all([
        fetchMembers(),
        fetchMemberRequests(),
      ]);
    } catch (err) {
      console.error(
        "Delete-all error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to submit delete-all request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      {message && (
        <div className="admin-alert success success">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-alert success error">
          {error}
        </div>
      )}

      <div className="admin-grid">
        {/* MEMBER FORM */}
        <div className="admin-card">
          <h2 className="card-title">
            {editingId ? "Edit Member" : "Add Member"}
          </h2>

          <div className="switch-btns">
            {memberTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                className={`switch-btn ${memberType === type.value ? "active" : ""
                  }`}
                onClick={() => handleTypeChange(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Name *
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter member name"
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

            <button
              className="form-btn"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Please wait..."
                : editingId
                  ? "Update"
                  : "Submit"}
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
        </div>

        {/* MEMBERS TABLE */}
        <div className="admin-card">
          <div className="export-delete">
            <h2 className="card-title">
              {selectedTypeLabel}
            </h2>


            {/* <button
                type="button"
                className="delete-all-btn"
                onClick={handleDeleteAll}
                disabled={loading || members.length === 0}
              >
                Delete All Data
              </button> */}

          </div>

          <div className="excel-upload-row">
            <button
              type="button"
              className="sample-excel-btn"
              onClick={() => {
                const link = document.createElement("a");

                link.href = `${process.env.PUBLIC_URL}/assets/docs/sample_members.xlsx`;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              📥 Download Sample Excel
            </button>

            <input
              id="members-excel-file"
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
              disabled={loading || members.length === 0}
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
              <strong>Name | Designation</strong>
              <br />
              Records will be added to:
              <strong> {selectedTypeLabel}</strong>
            </p>


          </div>

          {loading ? (
            <p>Loading members...</p>
          ) : displayMembers.length === 0 ? (
            <p>No members or approval requests found.</p>
          ) : (
            <div className="admin-table-wrapper">

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayMembers.map((item, index) => (
                    <tr key={item.rowKey}>
                      <td>{index + 1}</td>
                      <td>{item.name || "-"}</td>
                      <td>{item.designation || "-"}</td>
                      <td>
                        <span
                          className={`approval-status-btn ${item.displayStatus}`}
                        >
                          {getStatusLabel(item.displayStatus)}
                        </span>
                      </td>
                      <td>
                        {!item.isRequest ? (
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
                            </button>
                          </>
                        ) : (
                          <span>Awaiting review</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Members;
