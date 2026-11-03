
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";

const API_URL = "http://localhost:5000/api/funded-research";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";

// Ensure this matches the entity_type used by your backend approval handler.
const ENTITY_TYPE = "funded_research";

const EMPTY_FORM = {
  sr_no: "",
  faculty_name: "",
  project_name: "",
  year: "2026",
};

const FundedResearchAdmin = () => {
  const [list, setList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [availableYears, setAvailableYears] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
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

  // ================= PARSE REQUEST DATA =================
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

  // ================= FETCH APPROVAL REQUESTS =================
  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(
        REQUESTS_URL,
        getAuthConfig()
      );

      const requestData = Array.isArray(res.data)
        ? res.data
        : res.data?.requests || [];

      setRequests(requestData);
    } catch (err) {
      console.error("Error fetching approval requests:", err);
    }
  }, []);

  // ================= FETCH AVAILABLE YEARS =================
  const fetchYears = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/years`,
        getAuthConfig()
      );

      const years = Array.isArray(res.data)
        ? res.data.map(String)
        : [];

      setAvailableYears((previous) =>
        [...new Set([...previous, ...years])].sort(
          (a, b) => Number(b) - Number(a)
        )
      );

      return years;
    } catch (err) {
      console.error(
        "Fetch funded research years error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMsg(
        err.response?.data?.message ||
        "Failed to fetch funded research years"
      );

      return [];
    }
  };

  // ================= FETCH DATA BY YEAR =================
  const fetchData = useCallback(async (year = selectedYear) => {
    setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/year/${year}`);
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching funded research:", err);
      setMsg("Failed to fetch funded research data");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  // ================= INITIALIZE =================
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const years = await fetchYears();

      if (cancelled) return;

      const initialYear = years.includes("2026")
        ? "2026"
        : years[0] || "2026";

      setSelectedYear(initialYear);

      setForm((previous) => ({
        ...previous,
        year: initialYear,
      }));

      await Promise.all([
        fetchData(selectedYear),
        fetchRequests(),
        fetchYears(),
      ]);
    };

    initialize();

    return () => {
      cancelled = true;
    };
    // Initialize once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ================= APPROVAL HELPERS =================
  const getStatusLabel = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return "Pending Approval";
      case "rejected":
        return "Rejected";
      case "approved":
        return "Approved";
      case "published":
        return "Published";
      default:
        return "Published";
    }
  };

  const getStatusClass = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return "pending";
      case "rejected":
        return "rejected";
      case "approved":
        return "approved";
      default:
        return "published";
    }
  };

  const getRequestsForEntity = () =>
    requests.filter(
      (request) =>
        request.entity_type === ENTITY_TYPE
    );

  const getLatestRequest = (recordId) => {
    const matchingRequests = getRequestsForEntity()
      .filter(
        (request) =>
          String(request.record_id) === String(recordId)
      )
      .sort((a, b) => Number(b.id) - Number(a.id));

    return matchingRequests[0] || null;
  };

  // Include pending/rejected create requests that aren't published records yet.
  const getCombinedResearch = () => {
    const entityRequests = getRequestsForEntity();

    const unpublishedRequests = entityRequests
      .filter((request) => {
        const operation = String(request.operation || "").toLowerCase();
        const status = String(request.status || "").toLowerCase();

        if (
          !["create", "insert", "add"].includes(operation) ||
          !["pending", "rejected"].includes(status)
        ) {
          return false;
        }

        const data = parseRequestData(request.proposed_data);

        return String(data.year ?? selectedYear) === selectedYear;
      })
      .map((request) => {
        const data = parseRequestData(request.proposed_data);

        return {
          ...data,
          id: `request-${request.id}`,
          requestId: request.id,
          record_id: request.record_id,
          year: data.year ?? selectedYear,
          approvalStatus: request.status,
          isApprovalRequest: true,
          requestOperation: request.operation,
        };
      });

    const publishedRecords = list.map((item) => {
      const latestRequest = getLatestRequest(item.id);

      return {
        ...item,
        approvalStatus: latestRequest?.status || "published",
        isApprovalRequest: false,
      };
    });

    return [...unpublishedRequests, ...publishedRecords];
  };

  const displayedResearch = getCombinedResearch();

  // ================= EXCEL UPLOAD =================
  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleExcelUpload = async () => {
    if (!file) {
      alert("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", selectedYear);

    try {
      const res = await axios.post(
        `${API_URL}/upload-excel`,
        formData,
        getAuthConfig()
      );

      setMsg(
        res.data?.message ||
        "Excel upload submitted successfully"
      );
      setFile(null);

      const fileInput = document.getElementById(
        "funded-research-excel"
      );

      if (fileInput) fileInput.value = "";

      await Promise.all([
        fetchData(selectedYear),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error(
        "Excel upload error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMsg(
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : err.message)
      );
    }
  };

  // ================= EXPORT TO CSV =================
  const exportToCSV = () => {
    if (displayedResearch.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Sr. No.",
      "Name of Faculty",
      "Project Name",
      "Year",
      "Approval Status",
    ];

    const rows = displayedResearch.map((item, index) => [
      item.sr_no ?? index + 1,
      item.faculty_name || "",
      item.project_name || "",
      item.year || "",
      item.isApprovalRequest
        ? getStatusLabel(item.approvalStatus)
        : getStatusLabel(item.approvalStatus),
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
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Funded_Research_${selectedYear}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ================= FORM HANDLING =================
  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const validate = () => {
    const err = {};

    if (
      form.sr_no !== "" &&
      (!Number.isInteger(Number(form.sr_no)) ||
        Number(form.sr_no) < 1)
    ) {
      err.sr_no = "Enter a valid serial number";
    }

    if (!form.faculty_name.trim()) {
      err.faculty_name = "Faculty name is required";
    }

    if (!form.project_name.trim()) {
      err.project_name = "Project name is required";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      year: selectedYear,
    });

    setEditingId(null);
    setErrors({});
  };
  // ================= ADD / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      ...form,
      sr_no: form.sr_no === "" ? null : Number(form.sr_no),
      year: Number(form.year),
    };

    try {
      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          payload,
          getAuthConfig()
        );

        setMsg(
          "Funded research update submitted for approval."
        );
      } else {
        await axios.post(
          API_URL,
          payload,
          getAuthConfig()
        );

        setMsg(
          "Funded research addition submitted for approval."
        );
      }

      const savedYear = String(payload.year);

      setEditingId(null);
      setErrors({});

      setSelectedYear(savedYear);

      setForm({
        ...EMPTY_FORM,
        year: savedYear,
      });

      await Promise.all([
        fetchData(savedYear),
        fetchRequests(),
        fetchYears(),
      ]);
    } catch (err) {
      console.error("Error saving funded research:", err);

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : err.message) ||
        "Error submitting funded research for approval."
      );
    }
  };

  // ================= EDIT =================
  const handleEdit = (item) => {
    if (item.isApprovalRequest) return;

    const itemYear = String(item.year || selectedYear);

    setForm({
      sr_no: item.sr_no ?? "",
      faculty_name: item.faculty_name || "",
      project_name: item.project_name || "",
      year: itemYear,
    });

    setSelectedYear(itemYear);
    setEditingId(item.id);
    setErrors({});
    setMsg("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this funded research record for deletion approval?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      setMsg(
        "Funded research deletion submitted for approval."
      );

      await Promise.all([
        fetchData(selectedYear),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error("Error submitting deletion:", err);

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : err.message) ||
        "Failed to submit deletion request."
      );
    }
  };

  // ================= DELETE ALL BY YEAR =================
  const handleDeleteAll = async () => {
    if (list.length === 0) {
      setMsg(
        "No funded research records available to delete."
      );
      return;
    }

    const confirmed = window.confirm(
      `Submit all funded research records for ${selectedYear} for deletion?\n\nThis action may require administrator approval.`
    );

    if (!confirmed) return;

    try {
      setMsg("");

      const res = await axios.delete(
        `${API_URL}/delete-all`,
        {
          ...getAuthConfig(),
          params: { year: selectedYear },
        }
      );

      setMsg(
        res.data?.message ||
        `Funded research deletion for ${selectedYear} submitted.`
      );

      await Promise.all([
        fetchData(selectedYear),
        fetchRequests(),
      ]);

      if (editingId) {
        resetForm();
      }
    } catch (err) {
      console.error(
        "Delete all funded research error:",
        err
      );

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to submit funded research deletion."
      );
    }
  };

  return (
    <div className="admin-page">
      {msg && <div className="admin-alert success">{msg}</div>}

      <div className="admin-grid">
        {/* ================= FORM ================= */}
        <div className="admin-card">
          <h3 className="card-title">
            {editingId
              ? "Edit Funded Research"
              : "Add Funded Research"}
          </h3>

          <form onSubmit={handleSubmit}>

            <label>
              Name of Faculty *
              <input
                type="text"
                name="faculty_name"
                placeholder="Enter faculty name"
                value={form.faculty_name}
                onChange={handleChange}
                required
              />
            </label>

            {errors.faculty_name && (
              <span className="error">
                {errors.faculty_name}
              </span>
            )}

            <label>
              Project Name *
              <textarea
                name="project_name"
                placeholder="Enter project name"
                value={form.project_name}
                onChange={handleChange}
                required
                rows="3"
              />
            </label>

            {errors.project_name && (
              <span className="error">
                {errors.project_name}
              </span>
            )}

            <label>
              Year *
              <input
                type="number"
                name="year"
                min="1900"
                max="9999"
                placeholder="Enter year, e.g. 2026"
                value={form.year}
                onChange={handleChange}
                required
              />
            </label>

            {errors.year && (
              <span className="error">{errors.year}</span>
            )}
            <button className="form-btn" type="submit">
              {editingId
                ? "Submit Update for Approval"
                : "Submit"}
            </button>

            {editingId && (
              <button
                type="button"
                className="form-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* ================= TABLE + EXCEL ================= */}
        <div className="admin-card">
          <div className="export-delete">
            <h3 className="card-title">
              Funded Research List
            </h3>

            {/* <button
                type="button"
                className="delete-all-btn"
                onClick={handleDeleteAll}
                disabled={list.length === 0}
              >
                Delete All Data
              </button> */}

          </div>

          <div className="excel-upload-row">
            {/* YEAR FILTER */}
            <label>
              Select Year
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = e.target.value;

                  setSelectedYear(year);
                  setMsg("");

                  setForm((previous) => ({
                    ...previous,
                    year,
                  }));

                  setEditingId(null);
                  setErrors({});

                  fetchData(year);
                }}
              >
                {[...new Set([...availableYears, selectedYear])]
                  .sort((a, b) => Number(b) - Number(a))
                  .map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
              </select>
            </label>

            <button
              type="button"
              className="sample-excel-btn"
              onClick={() => {
                const link = document.createElement("a");

                link.href = `${process.env.PUBLIC_URL}/assets/docs/sample_funded_research.xlsx`;
                link.download = "sample_funded_research.xlsx";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              📥 Download Sample Excel
            </button>

            <br />

            <input
              id="funded-research-excel"
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
              disabled={displayedResearch.length === 0}
            >
              Export Data
              <PiExportBold style={{ fontSize: "20px" }} />
            </button>
          </div>
          {/* EXCEL UPLOAD */}
          <div style={{ marginBottom: "15px" }}>
            <p className="excel-note">
              Import records for the selected year.
              <br />
              <strong>
                Excel columns: Sr. No. | Name of Faculty | Project
                Name
              </strong>
              <br />
              The selected year will be assigned automatically to
              every imported row.
            </p>


          </div>

          {/* DATA TABLE */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Name of Faculty</th>
                  <th>Project Name</th>
                  <th>Year</th>
                  <th>Approval Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6">Loading funded research...</td>
                  </tr>
                ) : displayedResearch.length > 0 ? (
                  displayedResearch.map((item, index) => (
                    <tr key={item.id}>
                      <td>{item.sr_no ?? index + 1}</td>
                      <td>{item.faculty_name}</td>
                      <td>{item.project_name}</td>
                      <td>{item.year}</td>
                      <td>
                        <span
                          className={`approval-status-btn ${getStatusClass(
                            item.approvalStatus
                          )}`}
                        >
                          {getStatusLabel(item.approvalStatus)}
                        </span>
                      </td>
                      <td>
                        {item.isApprovalRequest ? (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      No funded research records found for{" "}
                      {selectedYear}.
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

export default FundedResearchAdmin;
