
import React, { useEffect, useState } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";

const MOUAdmin = () => {
  const [list, setList] = useState([]);
  const [mouRequests, setMouRequests] = useState([]);
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    company_name: "",
    address: "",
    mou_date: "",
    purpose: "",
    activities: "",
  });

  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  const API_URL = "http://localhost:5000/api/mou";
  const ADMIN_REQUESTS_URL =
    "http://localhost:5000/api/admin/my-requests";

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

  // ================= NORMALIZE VALUES =================

  const normalizeValue = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

  const isMOURequest = (request) => {
    const entity = normalizeValue(request.entity_type);

    return [
      "mou",
      "mous",
      "memorandum_of_understanding",
      "memorandums_of_understanding",
    ].includes(entity);
  };

  // ================= FETCH PUBLISHED MOU RECORDS =================

  const fetchData = async () => {
    try {
      const response = await axios.get(API_URL);

      const records = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data?.records)
            ? response.data.records
            : [];

      setList(records);
    } catch (error) {
      console.error(
        "Error fetching MOU records:",
        error.response?.data || error.message
      );

      setMsg("Failed to load MOU records.");
    }
  };

  // ================= FETCH APPROVAL REQUESTS =================

  const fetchMOURequests = async () => {
    try {
      const response = await axios.get(
        ADMIN_REQUESTS_URL,
        getAuthConfig()
      );

      const requests = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.requests)
          ? response.data.requests
          : [];

      console.log("All approval requests:", requests);

      const filteredRequests = requests.filter(isMOURequest);

      console.log("Filtered MOU approval requests:", filteredRequests);

      setMouRequests(filteredRequests);
    } catch (error) {
      console.error(
        "Failed to fetch MOU approval requests:",
        error.response?.data || error.message
      );

      setMouRequests([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchMOURequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= PARSE PROPOSED DATA =================

  const parseRequestData = (data) => {
    if (!data) return {};

    let parsed = data;

    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (error) {
        console.error("Unable to parse MOU proposed_data:", error);
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

  // ================= COMBINE MOU AND REQUESTS =================

  const getCombinedMOU = () => {
    const relevantRequests = mouRequests.filter(isMOURequest);

    // Include pending/rejected creation requests as separate rows.
    const createRequests = relevantRequests
      .filter((request) => {
        const operation = normalizeValue(request.operation);
        const status = normalizeValue(request.status);

        const isCreate = [
          "create",
          "insert",
          "add",
          "create_record",
        ].includes(operation);

        const isUnpublished = [
          "pending",
          "pending_approval",
          "rejected",
        ].includes(status);

        return isCreate && isUnpublished;
      })
      .map((request) => {
        const data = parseRequestData(request.proposed_data);

        return {
          ...data,
          id: `request-${request.id}`,
          rowKey: `request-${request.id}`,
          displayStatus: normalizeValue(request.status),
          isRequest: true,
          requestOperation: normalizeValue(request.operation),
        };
      });

    // Attach the latest request status to each published record.
    const publishedRows = list.map((item) => {
      const relatedRequests = relevantRequests
        .filter((request) => {
          if (
            request.record_id === null ||
            request.record_id === undefined ||
            item.id === null ||
            item.id === undefined
          ) {
            return false;
          }

          return String(request.record_id) === String(item.id);
        })
        .sort(
          (a, b) => Number(b.id || 0) - Number(a.id || 0)
        );

      const latestRequest = relatedRequests[0];
      const latestStatus = normalizeValue(latestRequest?.status);

      const displayStatus = [
        "pending",
        "pending_approval",
        "rejected",
        "approved",
      ].includes(latestStatus)
        ? latestStatus
        : "published";

      return {
        ...item,
        rowKey: `mou-${item.id}`,
        displayStatus,
        isRequest: false,
        requestOperation: normalizeValue(latestRequest?.operation),
      };
    });

    return [...createRequests, ...publishedRows];
  };

  const displayMOU = getCombinedMOU();

  // ================= STATUS LABEL =================

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

  // ================= EXCEL UPLOAD =================

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
  };

  const handleExcelUpload = async () => {
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setMsg("");

      await axios.post(
        `${API_URL}/upload-excel`,
        formData,
        getAuthConfig()
      );

      setMsg("Excel upload completed successfully.");

      setFile(null);

      await Promise.all([
        fetchData(),
        fetchMOURequests(),
      ]);
    } catch (error) {
      console.error(
        "MOU Excel upload error:",
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
      "Sr No",
      "Company Name",
      "Address",
      "Date",
      "Purpose",
      "Activities",
    ];

    const rows = list.map((item, index) => [
      index + 1,
      item.company_name || "",
      item.address || "",
      item.mou_date || "",
      item.purpose || "",
      item.activities || "",
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "MOU_list.csv";

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
  };

  const validate = () => {
    const validationErrors = {};

    if (!form.company_name.trim()) {
      validationErrors.company_name = "Company name is required.";
    }

    if (!form.mou_date.trim()) {
      validationErrors.mou_date = "MOU date is required.";
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const resetForm = () => {
    setForm({
      company_name: "",
      address: "",
      mou_date: "",
      purpose: "",
      activities: "",
    });

    setEditingId(null);
    setErrors({});
  };

  // ================= ADD / UPDATE MOU =================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      setMsg("");

      const config = getAuthConfig();

      const response = editingId
        ? await axios.put(
          `${API_URL}/${editingId}`,
          form,
          config
        )
        : await axios.post(
          API_URL,
          form,
          config
        );

      setMsg(
        response.data?.message ||
        "MOU request submitted successfully."
      );

      resetForm();

      await Promise.all([
        fetchData(),
        fetchMOURequests(),
      ]);
    } catch (error) {
      console.error(
        "MOU submission error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error submitting MOU request."
      );
    }
  };

  // ================= EDIT MOU =================

  const handleEdit = (item) => {
    setForm({
      company_name: item.company_name || "",
      address: item.address || "",
      mou_date: item.mou_date
        ? String(item.mou_date).slice(0, 10)
        : "",
      purpose: item.purpose || "",
      activities: item.activities || "",
    });

    setEditingId(item.id);
    setErrors({});
    setMsg("");
  };

  // ================= DELETE MOU =================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this MOU record for deletion approval?"
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
        "MOU deletion request submitted successfully."
      );

      await Promise.all([
        fetchData(),
        fetchMOURequests(),
      ]);
    } catch (error) {
      console.error(
        "MOU deletion error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to submit MOU deletion request."
      );
    }
  };

  // ================= DELETE ALL MOU RECORDS =================

  const handleDeleteAll = async () => {
    if (list.length === 0) {
      setMsg("No MOU records available to delete.");
      return;
    }

    const confirmed = window.confirm(
      `WARNING!\n\nAre you sure you want to permanently delete ALL ${list.length} MOU records?\n\nThis action cannot be undone.`
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
        "All MOU records deleted successfully."
      );

      resetForm();

      await Promise.all([
        fetchData(),
        fetchMOURequests(),
      ]);
    } catch (error) {
      console.error(
        "Delete all MOU error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to delete all MOU records."
      );
    }
  };

  return (
    <div className="admin-page">
      {msg && <div className="admin-alert success">{msg}</div>}

      <div className="admin-grid">
        {/* MOU FORM */}
        <div className="admin-card">
          <h3 className="card-title">
            {editingId ? "Edit MOU" : "Add MOU"}
          </h3>

          <form onSubmit={handleSubmit}>
            <label>
              Company Name *
              <input
                name="company_name"
                placeholder="Enter company name"
                value={form.company_name}
                onChange={handleChange}
                required
              />
            </label>

            {errors.company_name && (
              <span className="error">
                {errors.company_name}
              </span>
            )}

            <label>
              Address
              <input
                name="address"
                placeholder="Enter address"
                value={form.address}
                onChange={handleChange}
              />
            </label>

            <label>
              MOU Date *
              <input
                type="date"
                name="mou_date"
                value={form.mou_date}
                onChange={handleChange}
                required
              />
            </label>

            {errors.mou_date && (
              <span className="error">
                {errors.mou_date}
              </span>
            )}

            <label>
              Purpose
              <input
                name="purpose"
                placeholder="Enter purpose"
                value={form.purpose}
                onChange={handleChange}
              />
            </label>

            <label>
              Activities
              <input
                name="activities"
                placeholder="Enter activities"
                value={form.activities}
                onChange={handleChange}
              />
            </label>

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
        </div>

        {/* MOU TABLE AND EXCEL */}
        <div className="admin-card">
          <div className="export-delete">
            <h3 className="card-title">MOU List</h3>

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
              onClick={() => {
                const link = document.createElement("a");

                link.href = `${process.env.PUBLIC_URL}/assets/docs/sample_MOU_list.xlsx`;
                link.download = "sample_MOU_list.xlsx";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              📥 Download Sample Excel
            </button>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={handleExcelUpload}
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
              <PiExportBold style={{ fontSize: "20px" }} />
            </button>


          </div>

          {/* EXCEL UPLOAD */}
          <div style={{ marginBottom: "15px" }}>
            <p className="excel-note">
              Excel file must have these exact headers:
              <br />
              <strong>
                Sr.No | Company Name | Address | Date | Purpose | Activities
              </strong>
            </p>


          </div>

          {/* MOU TABLE */}
          {displayMOU.length === 0 ? (
            <p>No MOU records or approval requests found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Company</th>
                    <th>Address</th>
                    <th>Date</th>
                    <th>Purpose</th>
                    <th>Activities</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {displayMOU.map((item, index) => (
                    <tr key={item.rowKey}>
                      <td>{index + 1}</td>
                      <td>{item.company_name || "-"}</td>
                      <td>{item.address || "-"}</td>
                      <td>{item.mou_date || "-"}</td>
                      <td>{item.purpose || "-"}</td>
                      <td>{item.activities || "-"}</td>

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

export default MOUAdmin;
