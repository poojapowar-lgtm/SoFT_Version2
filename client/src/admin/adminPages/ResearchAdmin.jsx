
import React, { useCallback, useEffect, useState } from "react";
import { PiExportBold } from "react-icons/pi";
import axios from "axios";

const API_URL = "http://localhost:5000/api/research";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";
const ENTITY_TYPE = "research";
const CURRENT_YEAR = String(new Date().getFullYear());

const initialForm = {
  name: "",
  department: "",
  category: "",
  supervisor: "",
  year: CURRENT_YEAR,
};

const ResearchAdmin = () => {
  const [list, setList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");

  const [file, setFile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

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

  // ================= NORMALIZATION HELPERS =================

  const normalizeValue = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

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
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed;
  };

  const getRequestData = (request) => {
    let data = parseRequestData(request.proposed_data);

    if (
      data.data &&
      typeof data.data === "object" &&
      !Array.isArray(data.data)
    ) {
      data = data.data;
    }

    return data;
  };

  const normalizeStatus = (status) => normalizeValue(status);

  const getStatusLabel = (status) => {
    switch (normalizeStatus(status)) {
      case "pending":
      case "pending_approval":
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

    if (["pending", "pending_approval"].includes(normalized)) {
      return "pending";
    }

    if (normalized === "rejected") return "rejected";
    if (normalized === "approved") return "approved";

    return "published";
  };

  const isCreateOperation = (operation) =>
    [
      "create",
      "insert",
      "add",
      "create_record",
      "bulk_create",
    ].includes(normalizeValue(operation));

  // ================= FETCH PUBLISHED DATA =================

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(API_URL);

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.records)
          ? res.data.records
          : Array.isArray(res.data?.research)
            ? res.data.research
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];

      setList(data);

      console.log("Research records loaded:", data);
    } catch (err) {
      console.error(
        "Error fetching research records:",
        err.response?.data || err.message
      );

      setMsg("Error loading research records.");
    }
  }, []);

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

      const researchRequests = data
        .filter((request) => {
          const entityType = normalizeValue(request.entity_type);

          return [
            "research",
            "research_student",
            "research_students",
            "student_research",
            "student_researches",
          ].includes(entityType);
        })
        .sort(
          (a, b) => Number(b.id || 0) - Number(a.id || 0)
        );

      setRequests(researchRequests);

      console.log(
        "Research approval requests:",
        researchRequests
      );
    } catch (err) {
      console.error(
        "Error fetching research approval requests:",
        err.response?.data || err.message
      );
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchRequests();
  }, [fetchData, fetchRequests]);

  // ================= LATEST APPROVAL REQUEST =================

  const getLatestRequest = (recordId) =>
    requests.find(
      (request) =>
        request.record_id != null &&
        String(request.record_id) === String(recordId)
    );

  // ================= PENDING / REJECTED CREATE REQUESTS =================

  const getPendingCreateRequests = () =>
    requests.filter((request) => {
      const status = normalizeStatus(request.status);

      return (
        isCreateOperation(request.operation) &&
        ["pending", "rejected"].includes(status)
      );
    });

  // ================= COMBINE PUBLISHED + REQUEST DATA =================

  const getCombinedResearch = () => {
    const publishedRows = list.map((item) => ({
      ...item,
      rowType: "published",
      approvalRequest: getLatestRequest(item.id),
    }));

    const requestRows = [];

    getPendingCreateRequests().forEach((request) => {
      const data = getRequestData(request);

      // Handle Excel bulk-create requests.
      if (
        normalizeValue(request.operation) === "bulk_create" &&
        Array.isArray(data.records)
      ) {
        data.records.forEach((record, index) => {
          requestRows.push({
            ...record,
            id: `request-${request.id}-${index}`,
            requestId: request.id,
            rowType: "request",
            approvalRequest: request,
          });
        });

        return;
      }

      // Handle normal single create requests.
      if (
        !list.some(
          (item) =>
            request.record_id != null &&
            String(item.id) === String(request.record_id)
        )
      ) {
        requestRows.push({
          id: `request-${request.id}`,
          requestId: request.id,
          rowType: "request",
          name: data.name || "",
          department: data.department || "",
          category: data.category || "",
          supervisor: data.supervisor || "",
          year: data.year || "",
          approvalRequest: request,
        });
      }
    });

    return [...publishedRows, ...requestRows];
  };

  const researchRows = getCombinedResearch();

  // ================= DYNAMIC AVAILABLE YEARS =================

  const availableYears = [
    ...new Set(
      [
        ...list.map((item) => String(item.year || "")),

        ...getPendingCreateRequests().flatMap((request) => {
          const data = getRequestData(request);

          if (
            normalizeValue(request.operation) === "bulk_create" &&
            Array.isArray(data.records)
          ) {
            return data.records.map((record) =>
              String(record.year || "")
            );
          }

          return [String(data.year || "")];
        }),
      ].filter((year) => /^\d{4}$/.test(year))
    ),
  ].sort((a, b) => Number(b) - Number(a));

  // ================= FILTER BY YEAR =================

  const filteredResearchRows =
    selectedYear === "all"
      ? researchRows
      : researchRows.filter(
        (item) => String(item.year) === selectedYear
      );

  // ================= EXCEL UPLOAD =================

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleExcelUpload = async () => {
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    if (
      !form.year ||
      !Number.isInteger(Number(form.year)) ||
      Number(form.year) < 1900 ||
      Number(form.year) > 9999
    ) {
      alert("Please enter a valid year in the form before uploading.");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    // Default year for Excel rows without a Year column/value.
    formData.append("year", form.year);

    try {
      setLoading(true);
      setMsg("");

      const config = getAuthConfig();

      await axios.post(
        `${API_URL}/upload-excel`,
        formData,
        {
          headers: {
            ...config.headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMsg("Excel upload request processed.");

      setFile(null);

      const input = document.getElementById(
        "research-excel-file"
      );

      if (input) input.value = "";

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error(
        "Excel upload error:",
        err.response?.data || err.message
      );

      setMsg(
        "Excel upload failed: " +
        (
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= EXPORT TO CSV =================

  const exportToCSV = () => {
    if (filteredResearchRows.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Sr No",
      "Name",
      "Department",
      "Category",
      "Supervisor",
      "Year",
      "Approval Status",
    ];

    const rows = filteredResearchRows.map((item, index) => [
      index + 1,
      item.name || "",
      item.department || "",
      item.category || "",
      item.supervisor || "",
      item.year || "",
      item.approvalRequest
        ? getStatusLabel(item.approvalRequest.status)
        : "Published",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
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

    const link = document.createElement("a");

    link.href = encodeURI(csvContent);
    link.download =
      selectedYear === "all"
        ? "research_student_list.csv"
        : `research_student_list_${selectedYear}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ================= FORM HANDLING =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ================= VALIDATION =================

  const validate = () => {
    const validationErrors = {};

    if (!form.name.trim()) {
      validationErrors.name = "Student name is required.";
    }

    if (!form.department.trim()) {
      validationErrors.department = "Department is required.";
    }

    if (
      !form.year ||
      !Number.isInteger(Number(form.year)) ||
      Number(form.year) < 1900 ||
      Number(form.year) > 9999
    ) {
      validationErrors.year = "Please enter a valid year.";
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  // ================= RESET FORM =================

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setErrors({});
  };

  // ================= ADD / UPDATE =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      setMsg("");

      const payload = {
        ...form,
        year: Number(form.year),
      };

      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          payload,
          getAuthConfig()
        );

        setMsg(
          "Research record update submitted for approval."
        );
      } else {
        await axios.post(
          API_URL,
          payload,
          getAuthConfig()
        );

        setMsg(
          "Research record creation submitted for approval."
        );
      }

      resetForm();

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error(
        "Error saving research record:",
        err.response?.data || err.message
      );

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error saving research record."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= EDIT =================

  const handleEdit = (item) => {
    if (item.rowType === "request") return;

    setForm({
      name: item.name || "",
      department: item.department || "",
      category: item.category || "",
      supervisor: item.supervisor || "",
      year: String(item.year || CURRENT_YEAR),
    });

    setEditingId(item.id);
    setErrors({});
    setMsg("");
  };

  // ================= DELETE SINGLE =================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this research record for deletion approval?"
      )
    ) {
      return;
    }

    try {
      setMsg("");
      setLoading(true);

      await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      setMsg(
        "Research record deletion submitted for approval."
      );

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error(
        "Error submitting research deletion:",
        err.response?.data || err.message
      );

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error submitting research deletion."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE ALL =================

  const handleDeleteAll = async () => {
    if (list.length === 0) {
      setMsg("No research records available to delete.");
      return;
    }

    const confirmed = window.confirm(
      `WARNING!\n\nAre you sure you want to permanently delete ALL ${list.length} research records?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setMsg("");
      setLoading(true);

      await axios.delete(
        `${API_URL}/delete-all`,
        getAuthConfig()
      );

      resetForm();

      setMsg("Delete All request processed.");

      await Promise.all([
        fetchData(),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error(
        "Delete All error:",
        err.response?.data || err.message
      );

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to process Delete All."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================

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
          <h3 className="card-title">
            {editingId ? "Edit Student" : "Add Student"}
          </h3>

          <form onSubmit={handleSubmit}>
            <label>
              Student Name*
              <input
                name="name"
                placeholder="Enter student name"
                value={form.name}
                onChange={handleChange}
                required
              />
              {errors.name && (
                <small className="error-text">
                  {errors.name}
                </small>
              )}
            </label>

            <label>
              Department*
              <input
                name="department"
                placeholder="Enter department"
                value={form.department}
                onChange={handleChange}
                required
              />
              {errors.department && (
                <small className="error-text">
                  {errors.department}
                </small>
              )}
            </label>

            <label>
              Category
              <input
                name="category"
                placeholder="Enter category"
                value={form.category}
                onChange={handleChange}
              />
            </label>

            <label>
              Supervisor
              <input
                name="supervisor"
                placeholder="Enter supervisor name"
                value={form.supervisor}
                onChange={handleChange}
              />
            </label>

            <label>
              Year*
              <input
                type="number"
                name="year"
                placeholder="Enter year"
                min="1900"
                max="9999"
                value={form.year}
                onChange={handleChange}
                required
              />
              {errors.year && (
                <small className="error-text">
                  {errors.year}
                </small>
              )}
            </label>

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
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* ================= TABLE + EXCEL UPLOAD ================= */}

        <div className="admin-card">
          <div className="export-delete">
            <h3 className="card-title">
              Student Research List
            </h3>



            {/* <button
              type="button"
              className="delete-all-btn"
              onClick={handleDeleteAll}
              disabled={list.length === 0 || loading}
            >
              Delete All Data
            </button> */}

          </div>

          {/* ================= EXCEL UPLOAD ================= */}

          <div style={{ marginBottom: "15px" }}>
            {/* ================= YEAR FILTER ================= */}

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

                  link.href = `${process.env.PUBLIC_URL}/assets/docs/sample_research_list.xlsx`;
                  link.download = "sample_research_list.xlsx";

                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                📥 Download Sample Excel
              </button>

              <input
                id="research-excel-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={handleExcelUpload}
                disabled={loading || !file}
              >
                {loading ? "Uploading..." : "Upload Excel"}
              </button>

              <button
                type="button"
                className="export-btn"
                onClick={exportToCSV}
                disabled={filteredResearchRows.length === 0}
              >
                Export Data
                <PiExportBold style={{ fontSize: "20px" }} />
              </button>
            </div>

            <p className="excel-note">
              Excel file must have these headers:
              <br />
              <strong>
                Sr No | Name | Department | Category | Supervisor | Year
              </strong>
              <br />
              If the Year column is not provided, the Year entered
              in the form will be used.
            </p>


          </div>



          {/* ================= RESEARCH TABLE ================= */}

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th>Supervisor</th>
                  <th>Year</th>
                  <th>Approval Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredResearchRows.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      No research records found.
                    </td>
                  </tr>
                ) : (
                  filteredResearchRows.map((item, index) => {
                    const status =
                      item.approvalRequest?.status || "published";

                    return (
                      <tr
                        key={
                          item.rowType === "request"
                            ? `request-${item.requestId}-${item.id}`
                            : `research-${item.id}`
                        }
                      >
                        <td>{index + 1}</td>
                        <td>{item.name || "-"}</td>
                        <td>{item.department || "-"}</td>
                        <td>{item.category || "-"}</td>
                        <td>{item.supervisor || "-"}</td>
                        <td>{item.year || "-"}</td>

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

export default ResearchAdmin;
