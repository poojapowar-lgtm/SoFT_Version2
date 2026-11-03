
import React, { useEffect, useState, useCallback } from "react";
import { PiExportBold } from "react-icons/pi";
import axios from "axios";

const API_URL = "http://localhost:5000/api/patent-publications";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";

// Must match entity_type in the backend approval handler.
const ENTITY_TYPE = "patent_publications";

const INITIAL_FORM = {
  sr_no: "",
  faculty_name: "",
  publication_date: "",
  patent_title: "",
  patent_number: "",
  patent_status: "",
  patent_of_awarding: "",
  year: "2026",
};

const PatentPublicationAdmin = () => {
  const [list, setList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

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

    if (typeof data === "object") return data;

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

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.requests || [];

      setRequests(data);
    } catch (err) {
      console.error("Fetch approval requests error:", err);
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
        "Fetch patent years error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMsg(
        err.response?.data?.message ||
        "Failed to fetch patent publication years"
      );

      return [];
    }
  };

  // ================= FETCH DATA BY YEAR =================
  const fetchData = useCallback(async (year = selectedYear) => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${API_URL}/year/${year}`,
        getAuthConfig()
      );

      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(
        "Fetch patent publications error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMsg(
        err.response?.data?.message ||
        "Failed to fetch patent publications"
      );

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
        fetchData(initialYear),
        fetchRequests(),
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
  const getEntityRequests = () =>
    requests.filter(
      (request) => request.entity_type === ENTITY_TYPE
    );

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

  const getLatestRequest = (recordId) => {
    return getEntityRequests()
      .filter(
        (request) =>
          String(request.record_id) === String(recordId)
      )
      .sort((a, b) => Number(b.id) - Number(a.id))[0] || null;
  };

  const getCombinedPublications = () => {
    const entityRequests = getEntityRequests();

    const unpublishedRequests = entityRequests
      .filter((request) => {
        const operation = String(
          request.operation || ""
        ).toLowerCase();

        const status = String(
          request.status || ""
        ).toLowerCase();

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
          approvalStatus: request.status,
          isApprovalRequest: true,
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

  const displayedList = getCombinedPublications();

  // ================= FILE SELECTION =================
  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  // ================= EXCEL UPLOAD =================
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
        "Patent publication Excel upload submitted successfully."
      );

      setFile(null);

      const fileInput = document.getElementById("patent-excel-file");
      if (fileInput) fileInput.value = "";

      await Promise.all([
        fetchData(selectedYear),
        fetchRequests(),
        fetchYears(),
      ]);
    } catch (err) {
      console.error(
        "Excel upload error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMsg(
        "Excel upload failed: " +
        (
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.message ||
            err.response?.data?.error ||
            err.message
        )
      );
    }
  };

  // ================= EXPORT TO CSV =================
  const exportToCSV = () => {
    if (displayedList.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Sr. No.",
      "Name of Faculty",
      "Patent Publication Date",
      "Title of Patent",
      "Patent No.",
      "Patent Status",
      "Patent of Awarding",
      "Year",
      "Approval Status",
    ];

    const rows = displayedList.map((item, index) => [
      item.sr_no ?? index + 1,
      item.faculty_name || "",
      item.publication_date
        ? String(item.publication_date).slice(0, 10)
        : "",
      item.patent_title || "",
      item.patent_number || "",
      item.patent_status || "",
      item.patent_of_awarding || "",
      item.year || "",
      getStatusLabel(item.approvalStatus),
    ]);

    const escapeCSV = (value) =>
      `"${String(value).replace(/"/g, '""')}"`;

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
    link.download = `patent_publications_${selectedYear}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ================= FORM HANDLING =================
  const handleChange = (e) => {
    const { name, value } = e.target;

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

    if (!form.patent_title.trim()) {
      err.patent_title = "Patent title is required";
    }

    if (
      !form.year ||
      !Number.isInteger(Number(form.year)) ||
      Number(form.year) < 1900 ||
      Number(form.year) > 9999
    ) {
      err.year = "Enter a valid year";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const resetForm = () => {
    setForm({
      ...INITIAL_FORM,
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
      sr_no: form.sr_no ? Number(form.sr_no) : null,
      publication_date: form.publication_date || null,
      patent_status: form.patent_status || null,
      patent_of_awarding: form.patent_of_awarding.trim() || null,
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
          "Patent publication update submitted for approval."
        );
      } else {
        await axios.post(
          API_URL,
          payload,
          getAuthConfig()
        );

        setMsg(
          "Patent publication addition submitted for approval."
        );
      }

      const savedYear = String(payload.year);

      setEditingId(null);
      setErrors({});
      setForm({
        ...INITIAL_FORM,
        year: savedYear,
      });

      setSelectedYear(savedYear);

      await Promise.all([
        fetchData(savedYear),
        fetchRequests(),
        fetchYears(),
      ]);
    } catch (err) {
      console.error("Error saving patent publication:", err);

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error submitting patent publication for approval."
      );
    }
  };

  // ================= EDIT =================
  const handleEdit = (item) => {
    if (item.isApprovalRequest) return;

    setForm({
      sr_no: item.sr_no ?? "",
      faculty_name: item.faculty_name || "",
      publication_date: item.publication_date
        ? String(item.publication_date).slice(0, 10)
        : "",
      patent_title: item.patent_title || "",
      patent_number: item.patent_number || "",
      patent_status: item.patent_status || "",
      patent_of_awarding: item.patent_of_awarding || "",
      year: String(
        item.year ||
        (item.publication_date
          ? String(item.publication_date).slice(0, 4)
          : selectedYear)
      ),
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
        "Submit this patent publication for deletion approval?"
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
        "Patent publication deletion submitted for approval."
      );

      if (String(editingId) === String(id)) {
        resetForm();
      }

      await Promise.all([
        fetchData(selectedYear),
        fetchRequests(),
        fetchYears(),
      ]);
    } catch (err) {
      console.error("Delete patent publication error:", err);

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to submit deletion request."
      );
    }
  };

  // ================= DYNAMIC TABLE COLUMNS =================
  const hasValue = (key) =>
    displayedList.some(
      (item) =>
        item[key] !== null &&
        item[key] !== undefined &&
        String(item[key]).trim() !== ""
    );

  const showSrNo = hasValue("sr_no");
  const showFaculty = hasValue("faculty_name");
  const showPublicationDate = hasValue("publication_date");
  const showPatentTitle = hasValue("patent_title");
  const showPatentNumber = hasValue("patent_number");
  const showPatentStatus = hasValue("patent_status");
  const showPatentAwarding = hasValue("patent_of_awarding");
  const showYear = hasValue("year");

  const visibleColumnCount =
    [
      showSrNo,
      showFaculty,
      showPublicationDate,
      showPatentTitle,
      showPatentNumber,
      showPatentStatus,
      showPatentAwarding,
      showYear,
    ].filter(Boolean).length + 2; // Approval Status and Action

  // ================= DELETE ALL =================
  const handleDeleteAll = async () => {
    if (list.length === 0) {
      setMsg("No patent publications available to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Submit all patent publications for ${selectedYear} for deletion?\n\nThis operation may require administrator approval.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
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
        `Patent publication deletion for ${selectedYear} submitted.`
      );

      if (editingId) resetForm();

      await Promise.all([
        fetchData(selectedYear),
        fetchYears(),
        fetchRequests(),
      ]);
    } catch (err) {
      console.error(
        "Delete all patent publications error:",
        err.response?.data || err.message
      );

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to submit patent publication deletion."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      {msg && (
        <div className="admin-alert success" role="status">
          {msg}
        </div>
      )}

      <div className="admin-grid">
        {/* ================= FORM ================= */}
        <div className="admin-card">
          <h3 className="card-title">
            {editingId
              ? "Edit Patent Publication"
              : "Add Patent Publication"}
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
              Patent Publication Date
              <input
                type="date"
                name="publication_date"
                value={form.publication_date}
                onChange={handleChange}
              />
            </label>

            <label>
              Title of Patent *
              <textarea
                name="patent_title"
                placeholder="Enter title of patent"
                value={form.patent_title}
                onChange={handleChange}
                rows="3"
                required
              />
            </label>

            {errors.patent_title && (
              <span className="error">{errors.patent_title}</span>
            )}

            <label>
              Patent No.
              <input
                type="text"
                name="patent_number"
                placeholder="Enter patent number"
                value={form.patent_number}
                onChange={handleChange}
              />
            </label>

            <label>
              Patent Status
              <select
                name="patent_status"
                value={form.patent_status}
                onChange={handleChange}
              >
                <option value="">Select patent status</option>
                <option value="Published">Published</option>
                <option value="Filed">Filed</option>
                <option value="Pending">Pending</option>
                <option value="Granted">Granted</option>
                <option value="Rejected">Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </label>

            <label>
              Patent of Awarding
              <input
                type="text"
                name="patent_of_awarding"
                placeholder="Enter patent of awarding"
                value={form.patent_of_awarding}
                onChange={handleChange}
              />
            </label>

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

        {/* ================= TABLE + EXCEL UPLOAD ================= */}
        <div className="admin-card">
          <div className="export-delete">
            <h3 className="card-title">
              Patent Publication List
            </h3>

            {/* <button
                type="button"
                className="delete-all-btn"
                onClick={handleDeleteAll}
                disabled={list.length === 0 || loading}
              >
                {loading ? "Processing..." : "Delete All Data"}
              </button> */}

          </div>

          {/* YEAR FILTER */}
          <div className="excel-upload-row">
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

                link.href = `${process.env.PUBLIC_URL}/assets/docs/sample_patent_publications.xlsx`;
                link.download = "sample_patent_publications.xlsx";

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              📥 Download Sample Excel
            </button>

            <br />

            <input
              id="patent-excel-file"
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
              disabled={displayedList.length === 0}
            >
              Export Data
              <PiExportBold style={{ fontSize: "20px" }} />
            </button>

          </div>

          {/* EXCEL UPLOAD */}
          <div style={{ marginBottom: "15px" }}>
            <p className="excel-note">
              Excel file must contain these columns in this order:
              <br />
              <strong>
                Sr. No. | Name of Faculty | Patent Publication Date |
                Title of Patent | Patent No. | Patent Status |
                Patent of Awarding
              </strong>
              <br />
              Selected Year: <strong>{selectedYear}</strong>
            </p>


          </div>

          {/* DATA TABLE */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  {showSrNo && <th>Sr. No.</th>}
                  {showFaculty && <th>Name of Faculty</th>}
                  {showPublicationDate && (
                    <th>Patent Publication Date</th>
                  )}
                  {showPatentTitle && <th>Title of Patent</th>}
                  {showPatentNumber && <th>Patent No.</th>}
                  {showPatentStatus && <th>Patent Status</th>}
                  {showPatentAwarding && <th>Patent of Awarding</th>}
                  {showYear && <th>Year</th>}
                  <th>Approval Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount}>
                      Loading patent publications...
                    </td>
                  </tr>
                ) : displayedList.length > 0 ? (
                  displayedList.map((item, index) => (
                    <tr key={item.id}>
                      {showSrNo && (
                        <td>{item.sr_no ?? index + 1}</td>
                      )}

                      {showFaculty && (
                        <td>{item.faculty_name || "-"}</td>
                      )}

                      {showPublicationDate && (
                        <td>
                          {item.publication_date
                            ? String(item.publication_date).slice(0, 10)
                            : "-"}
                        </td>
                      )}

                      {showPatentTitle && (
                        <td>{item.patent_title || "-"}</td>
                      )}

                      {showPatentNumber && (
                        <td>{item.patent_number || "-"}</td>
                      )}

                      {showPatentStatus && (
                        <td>{item.patent_status || "-"}</td>
                      )}

                      {showPatentAwarding && (
                        <td>{item.patent_of_awarding || "-"}</td>
                      )}

                      {showYear && <td>{item.year || "-"}</td>}

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
                    <td colSpan={visibleColumnCount}>
                      No patent publications found for {selectedYear}.
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

export default PatentPublicationAdmin;
