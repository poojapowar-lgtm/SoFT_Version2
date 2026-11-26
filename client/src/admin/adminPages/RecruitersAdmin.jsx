
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";

  const API_URL = "http://localhost:5000/api/recruiters";
  const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";
  const ENTITY_TYPE = "recruiters";

  const initialForm = {
    company_name: "",
    display_order: "",
    logo: null,
  };

const RecruitersAdmin = () => {
  const [list, setList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Parse request data regardless of whether it is stored as JSON or an object.
  const parseRequestData = (data) => {
    if (!data) return {};

    if (typeof data === "object") {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
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

  const getRequestData = (request) => {
    const parsed = parseRequestData(request.proposed_data);

    // Also support backends that nest proposed fields inside "data".
    if (
      parsed.data &&
      typeof parsed.data === "object" &&
      !Array.isArray(parsed.data)
    ) {
      return parsed.data;
    }

    return parsed;
  };

  const getRequestEntity = (request) =>
    String(request.entity_type || "").toLowerCase().trim();

  // Fetch currently published recruiters.
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(API_URL);
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading recruiters:", err);
      setMsg("Error loading recruiters.");
    }
  }, []);

  // Fetch approval requests for the logged-in admin.
  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(REQUESTS_URL, getAuthConfig());

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.requests)
          ? res.data.requests
          : [];

      setRequests(
        data
          .filter(
            (request) => getRequestEntity(request) === ENTITY_TYPE
          )
          .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
      );
    } catch (err) {
      console.error(
        "Error loading recruiter approval requests:",
        err.response?.data || err.message
      );
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchRequests();
  }, [fetchData, fetchRequests]);

  // Latest request associated with an existing published recruiter.
  const getLatestRequest = (recordId) =>
    requests.find(
      (request) =>
        request.record_id != null &&
        String(request.record_id) === String(recordId)
    );

  // Show pending/rejected create requests as separate table rows.
  const getPendingCreateRequests = () =>
    requests.filter((request) => {
      const status = normalizeStatus(request.status);
      const recordId = request.record_id;

      return (
        isCreateOperation(request.operation) &&
        ["pending", "rejected"].includes(status) &&
        !list.some(
          (item) =>
            recordId != null &&
            String(item.id) === String(recordId)
        )
      );
    });

  const getCombinedRecruiters = () => {
    const publishedRows = list.map((item) => ({
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
        company_name: data.company_name || "",
        display_order: data.display_order ?? "",
        logo: data.logo || data.logo_path || "",
        approvalRequest: request,
      };
    });

    return [...publishedRows, ...requestRows];
  };

  const recruiters = getCombinedRecruiters();

  // Handle text inputs.
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // File upload and preview.
  const handleFile = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    const maxSize = 50 * 1024;

    if (file.size > maxSize) {
      alert("File size should not be more than 50KB.");
      e.target.value = "";
      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setForm((prev) => ({
      ...prev,
      logo: file,
    }));

    setPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setForm(initialForm);
    setEditingId(null);
    setPreview(null);
  };

  // Submit new recruiter or an update for approval.
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.company_name.trim()) {
      alert("Company name is required.");
      return;
    }

    if (!editingId && !form.logo) {
      alert("Company logo is required.");
      return;
    }

    const fd = new FormData();
    fd.append("company_name", form.company_name.trim());
    fd.append("display_order", form.display_order);

    if (form.logo) {
      fd.append("logo", form.logo);
    }

    try {
      setLoading(true);
      setMsg("");

      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          fd,
          getAuthConfig()
        );

        setMsg(
          "Recruiter update submitted for approval."
        );
      } else {
        await axios.post(
          API_URL,
          fd,
          getAuthConfig()
        );

        setMsg(
          "Recruiter creation submitted for approval."
        );
      }

      resetForm();

      await Promise.all([fetchData(), fetchRequests()]);
    } catch (err) {
      console.error(
        "Error saving recruiter:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMsg(
        "Error: " +
        (
          err.response?.data?.message ||
          err.response?.data?.error ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : err.message)
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Edit an existing published recruiter.
  const handleEdit = (item) => {
    if (item.rowType === "request") return;

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setForm({
      company_name: item.company_name || "",
      display_order: item.display_order ?? "",
      logo: null,
    });

    setPreview(
      item.logo ? getLogoUrl(item.logo) : null
    );

    setEditingId(item.id);
    setMsg("");
  };

  const getLogoUrl = (logo) => {
    if (!logo) return "";

    if (/^https?:\/\//i.test(logo)) {
      return logo;
    }

    const normalizedPath = String(logo)
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    const uploadPath = normalizedPath.startsWith("uploads/")
      ? normalizedPath
      : `uploads/${normalizedPath}`;

    return `http://localhost:5000/${uploadPath}`;
  };

  // Submit deletion for approval.
  const handleDelete = async (id) => {
    if (!window.confirm("Submit this recruiter for deletion approval?")) {
      return;
    }

    try {
      setMsg("");

      await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      setMsg("Recruiter deletion submitted for approval.");

      await Promise.all([fetchData(), fetchRequests()]);
    } catch (err) {
      console.error(
        "Error submitting recruiter deletion:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMsg(
        "Error: " +
        (
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message
        )
      );
    }
  };

  // Export recruiters and their approval statuses to CSV.
  const exportToCSV = () => {
    if (recruiters.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Sr No",
      "Company",
      "Display Order",
      "Approval Status",
    ];

    const rows = recruiters.map((item, index) => [
      index + 1,
      item.company_name || "",
      item.display_order ?? "",
      item.approvalRequest
        ? getStatusLabel(item.approvalRequest.status)
        : "Published",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) =>
          row
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "recruiters_list.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete All is retained from the existing module.
  const handleDeleteAll = async () => {
    if (list.length === 0) {
      setMsg("No recruiters available to delete.");
      return;
    }

    const confirmed = window.confirm(
      `WARNING!\n\nAre you sure you want to permanently delete ALL ${list.length} recruiters?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${API_URL}/delete-all`,
        getAuthConfig()
      );

      setMsg("Delete All request processed.");

      resetForm();

      await Promise.all([fetchData(), fetchRequests()]);
    } catch (err) {
      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to process Delete All."
      );
    }
  };

  return (
    <div className="admin-page">
      {msg && <div className="admin-alert success">{msg}</div>}

      <div className="admin-grid">
        {/* FORM */}
        <div className="admin-card">
          <h3 className="card-title">
            {editingId ? "Edit Recruiter" : "Add Recruiter"}
          </h3>

          <form onSubmit={handleSubmit}>
            <label>
              Company Name *
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Display Order
              <input
                name="display_order"
                type="number"
                value={form.display_order}
                onChange={handleChange}
              />
            </label>

            <label>
              Logo {editingId ? "(Optional)" : "*"}
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                required={!editingId && !form.logo}
              />
              <small>Maximum file size: 50KB.</small>
            </label>

            {preview && (
              <div style={{ margin: "10px 0" }}>
                <img
                  src={preview}
                  alt="Recruiter logo preview"
                  width="100"
                  style={{
                    objectFit: "contain",
                    maxHeight: "100px",
                  }}
                />
              </div>
            )}

            <button
              className="form-btn"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : editingId
                  ? "Submit Update for Approval"
                  : "Submit"}
            </button>

            {editingId && (
              <button
                className="form-btn"
                type="button"
                onClick={resetForm}
                style={{ marginLeft: "8px" }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* TABLE */}
        <div className="admin-card">
          <div className="export-delete">
            <h3 className="card-title">Recruiters</h3>

            <div className="export-delete-buttons">
              <button
                type="button"
                className="export-btn"
                onClick={exportToCSV}
                disabled={recruiters.length === 0}
              >
                Export Data
                <PiExportBold style={{ fontSize: "20px" }} />
              </button>

              {/* <button
                type="button"
                className="delete-all-btn"
                onClick={handleDeleteAll}
                disabled={list.length === 0}
              >
                Delete All Data
              </button> */}
            </div>
          </div>

          {recruiters.length === 0 ? (
            <p>No recruiters found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Logo</th>
                    <th>Company</th>
                    <th>Order</th>
                    <th>Approval Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {recruiters.map((item, index) => {
                    const request = item.approvalRequest;
                    const status = request?.status || "published";

                    return (
                      <tr key={item.rowType === "request" ? item.id : `recruiter-${item.id}`}>
                        <td>{index + 1}</td>

                        <td>
                          {item.logo ? (
                            <img
                              src={getLogoUrl(item.logo)}
                              alt={`${item.company_name || "Recruiter"} logo`}
                              width="50"
                              style={{
                                objectFit: "contain",
                                maxHeight: "50px",
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>{item.company_name}</td>
                        <td>{item.display_order ?? "—"}</td>

                        <td>
                          <span
                            className={`approval-status-btn ${getStatusClass(status)}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </td>

                        <td>
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
                              </button>
                            </>
                          )}
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

export default RecruitersAdmin;
