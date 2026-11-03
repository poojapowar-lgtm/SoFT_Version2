
import React, { useEffect, useState } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";

const API_URL = "http://localhost:5000/api/alumni-startup";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";
const SERVER_URL = "http://localhost:5000";

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

const AlumniStartupAdmin = () => {
  const [list, setList] = useState([]);
  const [requests, setRequests] = useState([]);

  const [certificateFile, setCertificateFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    passing_year: "",
    startup_name: "",
    contact_number: "",
    email: "",
    certificate_link: "",
  });

  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState(null);

  // ================= FETCH PUBLISHED DATA =================
  const fetchData = async () => {
    try {
      const response = await axios.get(API_URL);

      if (Array.isArray(response.data)) {
        setList(response.data);
      } else {
        setList([]);
        setMsg("Unexpected data format received from the server.");
      }
    } catch (error) {
      console.error(
        "Fetch alumni startup error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        "Failed to load alumni startup data."
      );
    }
  };

  // ================= FETCH APPROVAL REQUESTS =================
  const fetchRequests = async () => {
    try {
      const response = await axios.get(
        REQUESTS_URL,
        getAuthConfig()
      );

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.requests)
          ? response.data.requests
          : [];

      console.log("All approval requests:", data);

      const filtered = data
        .filter((request) =>
          [
            "alumni_startup",
            "alumni_startups",
            "alumnistartup",
          ].includes(
            String(request.entity_type || "")
              .toLowerCase()
              .trim()
              .replace(/[\s-]+/g, "_")
          )
        )
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

      console.log("Alumni startup requests:", filtered);
      setRequests(filtered);
    } catch (error) {
      console.error(
        "Fetch alumni startup requests error:",
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

  // ================= FORM HANDLING =================
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      passing_year: "",
      startup_name: "",
      contact_number: "",
      email: "",
      certificate_link: "",
    });

    setCertificateFile(null);
    setEditingId(null);

    const fileInput = document.getElementById("certificate-upload");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ================= CERTIFICATE UPLOAD =================
  const handleCertificateChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setCertificateFile(null);
      return;
    }

    const allowedExtensions = /\.(pdf|jpe?g|png)$/i;

    if (!allowedExtensions.test(file.name)) {
      setMsg("Only PDF, JPG, JPEG, and PNG files are allowed.");
      event.target.value = "";
      setCertificateFile(null);
      return;
    }

    if (file.size > 500 * 1024) {
      setMsg("Certificate file size must not exceed 500 KB.");
      event.target.value = "";
      setCertificateFile(null);
      return;
    }

    setMsg("");
    setCertificateFile(file);
  };

  // ================= PARSE REQUEST DATA =================
  const parseRequestData = (data) => {
    if (!data) return {};

    let parsed = data;

    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return {};
      }
    }

    if (
      parsed?.data &&
      typeof parsed.data === "object" &&
      !Array.isArray(parsed.data)
    ) {
      return parsed.data;
    }

    return parsed && typeof parsed === "object" ? parsed : {};
  };

  // ================= COMBINE PUBLISHED DATA AND REQUESTS =================
  const getCombinedList = () => {
    const normalize = (value) =>
      String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, "_");

    const createRequests = requests
      .filter((request) => {
        const operation = normalize(request.operation);
        const status = normalize(request.status);

        return (
          ["create", "insert", "add", "create_record"].includes(operation) &&
          ["pending", "pending_approval", "rejected"].includes(status)
        );
      })
      .filter((request) => {
        const data = parseRequestData(request.proposed_data);

        // Avoid showing a request row if its record is already published.
        return !list.some(
          (item) =>
            request.record_id != null &&
            String(item.id) === String(request.record_id)
        );
      })
      .map((request) => {
        const data = parseRequestData(request.proposed_data);

        return {
          ...data,
          id: `request-${request.id}`,
          rowKey: `request-${request.id}`,
          displayStatus: normalize(request.status),
          isRequest: true,
          operation: request.operation,
        };
      });

    const publishedRows = list.map((item) => {
      const relatedRequests = requests
        .filter(
          (request) =>
            request.record_id != null &&
            String(request.record_id) === String(item.id)
        )
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

      const latestRequest = relatedRequests[0];
      const latestStatus = normalize(latestRequest?.status);

      return {
        ...item,
        rowKey: `startup-${item.id}`,
        displayStatus: ["pending", "pending_approval", "rejected"].includes(
          latestStatus
        )
          ? latestStatus
          : "published",
        isRequest: false,
        pendingOperation:
          ["pending", "pending_approval"].includes(latestStatus)
            ? latestRequest?.operation
            : null,
      };
    });

    return [...createRequests, ...publishedRows];
  };

  const displayList = getCombinedList();

  // ================= ADD / UPDATE REQUEST =================
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setMsg("Please enter the alumni name.");
      return;
    }

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value ?? "");
    });

    if (certificateFile) {
      formData.append("certificate", certificateFile);
    }

    try {
      const config = getAuthConfig();

      const response = editingId
        ? await axios.put(
          `${API_URL}/${editingId}`,
          formData,
          config
        )
        : await axios.post(
          API_URL,
          formData,
          config
        );

      setMsg(
        response.data?.message ||
        "Alumni startup approval request submitted successfully."
      );

      resetForm();

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (error) {
      console.error(
        "Save alumni startup error:",
        error.response?.status,
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error submitting alumni startup request."
      );
    }
  };

  // ================= EXCEL UPLOAD =================
  const handleExcelUpload = async () => {
    if (!excelFile) {
      setMsg("Please select an Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", excelFile);

    try {
      const response = await axios.post(
        `${API_URL}/upload-excel`,
        formData,
        getAuthConfig()
      );

      setMsg(
        response.data?.message ||
        "Excel uploaded successfully."
      );

      setExcelFile(null);

      const input = document.getElementById(
        "alumni-startup-excel"
      );

      if (input) {
        input.value = "";
      }

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (error) {
      console.error(
        "Excel upload error:",
        error.response?.status,
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

  // ================= EDIT =================
  const handleEdit = (item) => {
    setForm({
      name: item.name || "",
      passing_year: item.passing_year ?? item.year ?? "",
      startup_name: item.startup_name || item.startup || "",
      contact_number: item.contact_number || item.contact || "",
      email: item.email || "",
      certificate_link: item.certificate_link || "",
    });

    setCertificateFile(null);
    setEditingId(item.id);
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
        "Submit this alumni startup record for deletion approval?"
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
        "Alumni startup deletion request submitted successfully."
      );

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (error) {
      console.error(
        "Delete alumni startup error:",
        error.response?.status,
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Error submitting deletion request."
      );
    }
  };

  // ================= DELETE ALL =================
  const handleDeleteAll = async () => {
    if (list.length === 0) {
      setMsg("No alumni startup records available to delete.");
      return;
    }

    const confirmed = window.confirm(
      `WARNING!\n\nAre you sure you want to permanently delete ALL ${list.length} alumni startup records?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await axios.delete(
        `${API_URL}/delete-all`,
        getAuthConfig()
      );

      setMsg(
        response.data?.message ||
        "Bulk deletion request processed."
      );

      resetForm();
      setExcelFile(null);

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (error) {
      console.error(
        "Delete all alumni startups error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to delete all alumni startup records."
      );
    }
  };

  // ================= EXPORT TO CSV =================
  const exportToCSV = () => {
    if (list.length === 0) {
      setMsg("No data available to export.");
      return;
    }

    const headers = [
      "Sr No",
      "Name",
      "Year",
      "Startup",
      "Contact",
      "Email",
      "Certificate Link",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = list.map((item, index) => [
      index + 1,
      item.name,
      item.passing_year ?? item.year,
      item.startup_name ?? item.startup,
      item.contact_number ?? item.contact,
      item.email,
      item.certificate_link,
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "alumni_startups.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    setMsg("Alumni startup data exported successfully.");
  };

  // ================= STATUS LABEL =================
  const getStatusLabel = (status) => {
    const normalized = String(status || "").toLowerCase().trim();

    const labels = {
      pending: "Pending Approval",
      pending_approval: "Pending Approval",
      approved: "Approved",
      rejected: "Rejected",
      published: "Published",
    };

    return labels[normalized] || status || "Unknown";
  };
  // ================= SAMPLE EXCEL DOWNLOAD =================
  const downloadSampleExcel = () => {
    const link = document.createElement("a");

    link.href =
      `${process.env.PUBLIC_URL}/assets/docs/sample_alumni_startups.xlsx`;

    link.download = "sample_alumni_startups.xlsx";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ================= CERTIFICATE URL =================
  const getCertificateUrl = (file) => {
    if (!file) return "";

    return file.startsWith("http")
      ? file
      : `${SERVER_URL}/uploads/${file.replace(/^\/+/, "")}`;
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
            {editingId ? "Edit" : "Add"} Alumni Startup
          </h2>

          <form onSubmit={handleSubmit}>
            <label>
              Name of Alumni *
              <input
                name="name"
                placeholder="Enter alumni name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Year of Passing
              <input
                name="passing_year"
                placeholder="Enter passing year"
                value={form.passing_year}
                onChange={handleChange}
              />
            </label>

            <label>
              Startup Name *
              <input
                name="startup_name"
                placeholder="Enter startup name"
                value={form.startup_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Contact Number *
              <input
                name="contact_number"
                placeholder="Enter contact number"
                value={form.contact_number}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Email Address
              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label>
              Certificate Link (optional)
              <input
                type="url"
                name="certificate_link"
                placeholder="https://example.com/certificate"
                value={form.certificate_link}
                onChange={handleChange}
              />
            </label>

            <label>
              Upload Certificate (Max 500 KB)
              <input
                id="certificate-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleCertificateChange}
              />
              <small>
                Allowed formats: PDF, JPG, JPEG, PNG.
                Maximum size: 500 KB.
                {editingId &&
                  " Leave empty to retain the existing certificate."}
              </small>
            </label>

            <button
              className="form-btn"
              type="submit"
            >
              {editingId ? "Update" : "Submit"}
            </button>

            {editingId && (
              <button
                className="form-btn"
                type="button"
                onClick={resetForm}
                style={{ marginLeft: "10px" }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* ================= TABLE + EXCEL ================= */}
        <div className="admin-card">
          <div className="export-delete">
            <h2 className="card-title">
              Alumni Startups
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
              id="alumni-startup-excel"
              type="file"
              accept=".xlsx,.xls"
              className="excel-file-input"
              onChange={(event) =>
                setExcelFile(event.target.files?.[0] || null)
              }
            />

            <button
              type="button"
              onClick={handleExcelUpload}
              disabled={!excelFile}
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
              Excel file must have these exact headers:
              <br />
              <strong>
                Sr No | Name | Year | Startup | Contact | Email |
                Certificate Link
              </strong>
            </p>

          </div>

          {/* APPROVAL TABLE */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sr.</th>
                  <th>Name</th>
                  <th>Year</th>
                  <th>Startup</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Certificate</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      No alumni startup records or approval requests found.
                    </td>
                  </tr>
                ) : (
                  displayList.map((item, index) => {
                    const certificateFileName =
                      item.certificate_file ||
                      item.certificate ||
                      "";

                    return (
                      <tr key={item.rowKey}>
                        <td>{index + 1}</td>

                        <td>{item.name || "-"}</td>

                        <td>
                          {item.passing_year ?? item.year ?? "-"}
                        </td>

                        <td>
                          {item.startup_name ?? item.startup ?? "-"}
                        </td>

                        <td>
                          {item.contact_number ?? item.contact ?? "-"}
                        </td>

                        <td>
                          {item.email ? (
                            <a href={`mailto:${item.email}`}>
                              {item.email}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td>
                          {certificateFileName && (
                            <a
                              href={getCertificateUrl(certificateFileName)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              File
                            </a>
                          )}

                          {certificateFileName &&
                            item.certificate_link && <br />}

                          {item.certificate_link && (
                            <a
                              href={item.certificate_link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Link
                            </a>
                          )}

                          {!certificateFileName &&
                            !item.certificate_link &&
                            "-"}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniStartupAdmin;
