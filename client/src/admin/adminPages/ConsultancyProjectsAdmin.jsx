
import React, { useEffect, useState } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";

const API_URL = "http://localhost:5000/api/consultancy-projects";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";

const ConsultancyProjectsAdmin = () => {
  const [list, setList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedYear, setSelectedYear] = useState("2026");

  const [form, setForm] = useState({
    sr_no: "",
    faculty_name: "",
    project_name: "",
    year: "2026",
  });

  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  // ================= AUTH CONFIG =================
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

  // ================= FETCH AVAILABLE YEARS =================
  const fetchYears = async () => {
    try {
      const res = await axios.get(`${API_URL}/years`);

      const years = Array.isArray(res.data)
        ? res.data.map(String)
        : Array.isArray(res.data?.years)
          ? res.data.years.map(String)
          : [];

      const sortedYears = [...new Set(years)].sort(
        (a, b) => Number(b) - Number(a)
      );

      setAvailableYears(sortedYears);

      return sortedYears;
    } catch (err) {
      console.error("Error fetching consultancy project years:", err);
      return [];
    }
  };

  // ================= FETCH PROJECTS BY YEAR =================
  const fetchData = async (year = selectedYear) => {
    try {
      const res = await axios.get(`${API_URL}/year/${year}`);

      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching consultancy projects:", err);
      setMsg("Failed to fetch consultancy project data.");
      setList([]);
    }
  };

  // ================= FETCH APPROVAL REQUESTS =================
  const fetchRequests = async () => {
    try {
      const res = await axios.get(REQUESTS_URL, getAuthConfig());

      const requestData = Array.isArray(res.data)
        ? res.data
        : res.data?.requests || [];

      setRequests(requestData);
    } catch (err) {
      console.error("Error fetching approval requests:", err);
      setRequests([]);
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    const initializeData = async () => {
      const years = await fetchYears();

      const defaultYear = years.includes("2026")
        ? "2026"
        : years[0] || "2026";

      setSelectedYear(defaultYear);

      setForm((prev) => ({
        ...prev,
        year: defaultYear,
      }));

      await Promise.all([
        fetchData(defaultYear),
        fetchRequests(),
      ]);
    };

    initializeData();
  }, []);

  // ================= FETCH WHEN SELECTED YEAR CHANGES =================
  useEffect(() => {
    if (!selectedYear) return;

    fetchData(selectedYear);
  }, [selectedYear]);

  // ================= PARSE PROPOSED DATA =================
  const parseRequestData = (request) => {
    if (!request?.proposed_data) return {};

    if (typeof request.proposed_data === "object") {
      return request.proposed_data;
    }

    try {
      return JSON.parse(request.proposed_data);
    } catch (err) {
      console.error("Invalid proposed_data:", err);
      return {};
    }
  };

  // ================= STATUS HELPERS =================
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
    switch (normalizeStatus(status)) {
      case "pending":
        return "pending";
      case "rejected":
        return "rejected";
      case "approved":
        return "approved";
      case "published":
        return "published";
      default:
        return "published";
    }
  };

  // ================= GET LATEST REQUEST =================
  const getLatestRequest = (recordId) => {
    if (recordId == null) return null;

    return (
      requests
        .filter(
          (request) =>
            request.entity_type === "consultancy_projects" &&
            String(request.record_id) === String(recordId)
        )
        .sort(
          (a, b) => Number(b.id || 0) - Number(a.id || 0)
        )[0] || null
    );
  };

  // ================= COMBINE PUBLISHED + NEW REQUESTS =================
  const getCombinedProjects = () => {
    const createRequests = requests
      .filter((request) => {
        const status = normalizeStatus(request.status);
        const operation = normalizeStatus(request.operation);

        if (
          request.entity_type !== "consultancy_projects" ||
          operation !== "create" ||
          !["pending", "rejected"].includes(status)
        ) {
          return false;
        }

        const proposedData = parseRequestData(request);

        return String(proposedData.year || "") === String(selectedYear);
      })
      .map((request) => {
        const proposedData = parseRequestData(request);

        return {
          ...proposedData,
          id: `request-${request.id}`,
          requestId: request.id,
          isRequest: true,
          approvalStatus: request.status,
        };
      });

    const publishedProjects = list.map((item) => {
      const latestRequest = getLatestRequest(item.id);

      return {
        ...item,
        isRequest: false,
        approvalStatus: latestRequest?.status || "published",
      };
    });

    return [...createRequests, ...publishedProjects].sort((a, b) => {
      const aSr = Number(a.sr_no) || 0;
      const bSr = Number(b.sr_no) || 0;

      if (aSr && bSr && aSr !== bSr) {
        return aSr - bSr;
      }

      if (aSr && !bSr) return -1;
      if (!aSr && bSr) return 1;

      return Number(a.id || 0) - Number(b.id || 0);
    });
  };

  const combinedProjects = getCombinedProjects();

  // ================= EXCEL FILE SELECTION =================
  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  // ================= EXCEL UPLOAD =================
  const handleExcelUpload = async () => {
    if (!file) {
      alert("Please select an Excel file.");
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
        res.data?.message || "Excel uploaded successfully."
      );

      setFile(null);

      const fileInput = document.getElementById(
        "consultancy-projects-excel"
      );

      if (fileInput) fileInput.value = "";

      await Promise.all([
        fetchData(selectedYear),
        fetchRequests(),
        fetchYears(),
      ]);
    } catch (err) {
      console.error("Excel upload error:", err);

      setMsg(
        "Excel upload failed: " +
        (err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data ||
          err.message)
      );
    }
  };

  // ================= EXPORT TO CSV =================
  const exportToCSV = () => {
    if (combinedProjects.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Sr. No.",
      "Name of Faculty",
      "Project Name",
      "Year",
      "Approval Status",
    ];

    const rows = combinedProjects.map((item, index) => [
      item.sr_no ?? index + 1,
      item.faculty_name || "",
      item.project_name || "",
      item.year ?? "",
      getStatusLabel(item.approvalStatus),
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
    link.download = `Consultancy_Projects_${selectedYear}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ================= FORM HANDLING =================
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ================= VALIDATION =================
  const validate = () => {
    const err = {};

    if (
      form.sr_no !== "" &&
      (!Number.isInteger(Number(form.sr_no)) ||
        Number(form.sr_no) < 1)
    ) {
      err.sr_no = "Enter a valid serial number.";
    }

    if (!form.faculty_name.trim()) {
      err.faculty_name = "Faculty name is required.";
    }

    if (!form.project_name.trim()) {
      err.project_name = "Project name is required.";
    }

    if (
      !form.year ||
      !Number.isInteger(Number(form.year)) ||
      Number(form.year) < 1900 ||
      Number(form.year) > 9999
    ) {
      err.year = "Enter a valid year.";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setForm({
      sr_no: "",
      faculty_name: "",
      project_name: "",
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
      const config = getAuthConfig();

      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          payload,
          config
        );

        setMsg(
          "Consultancy project update submitted for approval."
        );
      } else {
        await axios.post(API_URL, payload, config);

        setMsg(
          "Consultancy project submitted for approval."
        );
      }

      const savedYear = String(form.year);

      setSelectedYear(savedYear);

      resetForm();

      await Promise.all([
        fetchData(savedYear),
        fetchRequests(),
        fetchYears(),
      ]);
    } catch (err) {
      console.error("Error saving consultancy project:", err);

      setMsg(
        "Error saving data: " +
        (err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data ||
          err.message)
      );
    }
  };

  // ================= EDIT =================
  const handleEdit = (item) => {
    if (item.isRequest) return;

    setForm({
      sr_no: item.sr_no ?? "",
      faculty_name: item.faculty_name || "",
      project_name: item.project_name || "",
      year: String(item.year || selectedYear),
    });

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
        "Submit this consultancy project for deletion?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`, getAuthConfig());

      setMsg(
        "Consultancy project deletion submitted for approval."
      );

      await Promise.all([
        fetchData(selectedYear),
        fetchRequests(),
        fetchYears(),
      ]);
    } catch (err) {
      console.error("Delete consultancy project error:", err);

      setMsg(
        "Delete failed: " +
        (err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data ||
          err.message)
      );
    }
  };

  // ================= DELETE ALL BY YEAR =================
  const handleDeleteAll = async () => {
    if (list.length === 0) {
      setMsg(
        "No consultancy project records available to delete."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ALL consultancy projects for ${selectedYear}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setMsg("");

      await axios.delete(`${API_URL}/delete-all`, {
        ...getAuthConfig(),
        params: { year: selectedYear },
      });

      setList([]);

      if (editingId) {
        resetForm();
      }

      await fetchRequests();

      setMsg(
        `Delete-all request submitted for consultancy projects in ${selectedYear}.`
      );
    } catch (err) {
      console.error(
        "Delete all consultancy projects error:",
        err
      );

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to delete consultancy projects."
      );
    }
  };

  // ================= UI =================
  return (
    <div className="admin-page">
      {msg && <div className="admin-alert success">{msg}</div>}

      <div className="admin-grid">
        {/* ================= FORM ================= */}
        <div className="admin-card">
          <h3 className="card-title">
            {editingId
              ? "Edit Consultancy Project"
              : "Add Consultancy Project"}
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
              <span className="error">{errors.faculty_name}</span>
            )}

            <label>
              Project Name *
              <textarea
                name="project_name"
                placeholder="Enter consultancy project name"
                value={form.project_name}
                onChange={handleChange}
                required
                rows="3"
              />
            </label>

            {errors.project_name && (
              <span className="error">{errors.project_name}</span>
            )}

            <label>
              Year *
              <input
                type="number"
                name="year"
                min="1900"
                max="9999"
                placeholder="Enter year"
                value={form.year}
                onChange={handleChange}
                required
              />
            </label>

            {errors.year && (
              <span className="error">{errors.year}</span>
            )}

            <button className="form-btn" type="submit">
              {editingId ? "Submit Update" : "Submit"}
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
              Consultancy Projects List
            </h3>

          </div>


          <div className="excel-upload-row">

            {/* DYNAMIC YEAR FILTER */}
            <label>
              Select Year: 
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = e.target.value;

                  setSelectedYear(year);
                  setForm((prev) => ({
                    ...prev,
                    year,
                  }));
                  setMsg("");
                }}
              >
                {availableYears.length > 0 ? (
                  availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))
                ) : (
                  <option value={selectedYear}>{selectedYear}</option>
                )}
              </select>
            </label>

            <button
              type="button"
              className="sample-excel-btn"
              onClick={() => {
                const link = document.createElement("a");

                link.href = `${process.env.PUBLIC_URL}/assets/docs/sample_consultancy_projects.xlsx`;
                link.download = "sample_consultancy_projects.xlsx";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              📥 Download Sample Excel
            </button>

            <br />

            <input
              id="consultancy-projects-excel"
              type="file"
              accept=".xlsx,.xls,.csv"
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
              disabled={combinedProjects.length === 0}
            >
              Export Data
              <PiExportBold style={{ fontSize: "20px" }} />
            </button>
          </div>


          {/* EXCEL UPLOAD */}
          <div style={{ marginBottom: "15px" }}>
            <p className="excel-note">
              ⚠️ Excel columns must be in this exact order:
              <br />
              <strong>
                Sr. No. | Name of Faculty | Project name
              </strong>
              <br />
              The selected year will be applied to all uploaded records.
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
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {combinedProjects.length > 0 ? (
                  combinedProjects.map((item, index) => (
                    <tr
                      key={
                        item.isRequest
                          ? item.id
                          : `record-${item.id}`
                      }
                    >
                      <td>{item.sr_no ?? index + 1}</td>
                      <td>{item.faculty_name || ""}</td>
                      <td>{item.project_name || ""}</td>
                      <td>{item.year || ""}</td>

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
                        {item.isRequest ? (
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
                      No consultancy project records found for{" "}
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

export default ConsultancyProjectsAdmin;
