
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";

const StudentSpeakAdmin = () => {
  const API_URL = "http://localhost:5000/api/student-speak";
  const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";

  // Confirm this value matches entity_type saved by your backend.
  const ENTITY_TYPE = "student_speak";

  const [studentList, setStudentList] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);

  const [form, setForm] = useState({
    name: "",
    degree_specialization: "",
    year_of_passing: "",
    designation: "",
    company: "",
    message: "",
    image: null,
  });

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

  // ================= REQUEST HELPERS =================

  const parseRequestData = (request) => {
    let data = request?.proposed_data;

    if (!data) return {};

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return {};
      }
    }

    if (data?.data && typeof data.data === "object") {
      return data.data;
    }

    return data && typeof data === "object" ? data : {};
  };

  const getRequestData = (request) => parseRequestData(request);

  const normalizeStatus = (status) =>
    String(status || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

  const getStatusLabel = (status) => {
    const normalized = normalizeStatus(status);

    switch (normalized) {
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
        return status || "No Request";
    }
  };

  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);

    if (["pending", "pending_approval"].includes(normalized)) {
      return "pending";
    }

    if (normalized === "rejected") {
      return "rejected";
    }

    if (normalized === "approved") {
      return "approved";
    }

    if (normalized === "published") {
      return "published";
    }

    return "";
  };

  const getOperation = (request) =>
    String(request?.operation || request?.action || "")
      .trim()
      .toLowerCase();

  const isCreateRequest = (request) =>
    ["create", "insert", "add", "create_record"].includes(
      getOperation(request)
    );

  const isUnpublishedRequest = (request) =>
    ["pending", "pending_approval", "rejected"].includes(
      normalizeStatus(request?.status)
    );

  const getLatestRequest = (recordId) => {
    const matchingRequests = approvalRequests
      .filter(
        (request) =>
          String(request.record_id) === String(recordId) &&
          request.record_id !== null &&
          request.record_id !== undefined
      )
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

    return matchingRequests[0] || null;
  };

  // ================= FETCH PUBLISHED STUDENTS =================

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get(API_URL);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.students || res.data?.data || [];

      setStudentList(data);
    } catch (err) {
      console.error("Failed to load student testimonials:", err);
      setMsg("Failed to load student testimonials.");
    }
  }, []);

  // ================= FETCH APPROVAL REQUESTS =================

  const fetchApprovalRequests = useCallback(async () => {
    try {
      const res = await axios.get(REQUESTS_URL, getAuthConfig());

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.requests || [];

      const filteredRequests = data
        .filter(
          (request) =>
            String(request.entity_type || "").toLowerCase() ===
            ENTITY_TYPE.toLowerCase()
        )
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

      setApprovalRequests(filteredRequests);
    } catch (err) {
      console.error("Failed to load approval requests:", err);
    }
  }, []);

  const refreshData = async () => {
    await Promise.all([fetchStudents(), fetchApprovalRequests()]);
  };

  useEffect(() => {
    refreshData();
  }, [fetchStudents, fetchApprovalRequests]);

  // ================= INPUT CHANGE =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= FILE UPLOAD =================

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const maxSize = 100 * 1024;

    if (file.size > maxSize) {
      alert("Image must be less than 100KB.");
      e.target.value = "";
      return;
    }

    setForm((prev) => ({
      ...prev,
      image: file,
    }));
  };

  // ================= RESET FORM =================

  const resetForm = () => {
    setForm({
      name: "",
      degree_specialization: "",
      year_of_passing: "",
      designation: "",
      company: "",
      message: "",
      image: null,
    });

    setEditingId(null);

    const fileInput = document.getElementById("student-speak-image");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ================= SUBMIT FOR APPROVAL =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.message.trim()) {
      alert("Name and Message are required.");
      return;
    }

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key] !== null && form[key] !== undefined) {
        formData.append(key, form[key]);
      }
    });

    try {
      setLoading(true);
      setMsg("");

      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          formData,
          getAuthConfig()
        );

        setMsg("Student testimonial update submitted for approval.");
      } else {
        await axios.post(API_URL, formData, getAuthConfig());

        setMsg("Student testimonial submitted for approval.");
      }

      resetForm();
      await refreshData();
    } catch (err) {
      console.error(
        "Error submitting student testimonial:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error submitting student testimonial."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= EDIT =================

  const handleEdit = (item) => {
    setForm({
      name: item.name || "",
      degree_specialization: item.degree_specialization || "",
      year_of_passing: item.year_of_passing || "",
      designation: item.designation || "",
      company: item.company || "",
      message: item.message || "",
      image: null,
    });

    setEditingId(item.id);

    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ================= DELETE =================

  const handleDelete = async (id) => {
    if (!window.confirm("Submit this student testimonial for deletion approval?")) {
      return;
    }

    try {
      setMsg("");

      await axios.delete(`${API_URL}/${id}`, getAuthConfig());

      setMsg("Student testimonial deletion submitted for approval.");

      if (String(editingId) === String(id)) {
        resetForm();
      }

      await refreshData();
    } catch (err) {
      console.error(
        "Error submitting deletion:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error submitting deletion request."
      );
    }
  };

  // ================= CSV EXPORT =================

  const exportToCSV = () => {
    if (studentList.length === 0) {
      setMsg("No published student data available to export.");
      return;
    }

    const headers = [
      "Name",
      "Degree / Specialization",
      "Year of Passing",
      "Designation",
      "Company",
      "Message",
    ];

    const rows = studentList.map((student) => [
      student.name,
      student.degree_specialization,
      student.year_of_passing,
      student.designation,
      student.company,
      student.message,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "student_speak_data.csv";
    link.click();

    URL.revokeObjectURL(url);

    setMsg("Published student data exported successfully.");
  };

  // ================= DELETE ALL =================

  const handleDeleteAll = async () => {
    if (studentList.length === 0) {
      setMsg("No published student records available.");
      return;
    }

    const confirmed = window.confirm(
      `WARNING!\n\nAre you sure you want to permanently delete ALL ${studentList.length} student records?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMsg("");

      await axios.delete(`${API_URL}/delete-all`, getAuthConfig());

      setMsg("Delete All request processed. Refreshing records...");
      resetForm();

      await refreshData();
    } catch (err) {
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

  // ================= PENDING / REJECTED NEW SUBMISSIONS =================

  const pendingCreateRequests = approvalRequests.filter((request) => {
    if (!isCreateRequest(request) || !isUnpublishedRequest(request)) {
      return false;
    }

    const data = getRequestData(request);

    // Only show requests with enough information to identify a student
    // testimonial. Backend proposed_data should include these fields.
    return Boolean(data.name || data.message);
  });

  // ================= TABLE ROWS =================

  const publishedRows = studentList.map((student) => ({
    rowType: "published",
    rowKey: `published-${student.id}`,
    item: student,
    request: getLatestRequest(student.id),
  }));

  const unpublishedRows = pendingCreateRequests.map((request) => ({
    rowType: "request",
    rowKey: `request-${request.id}`,
    item: getRequestData(request),
    request,
  }));

  const tableRows = [...publishedRows, ...unpublishedRows];

  return (
    <div className="admin-page">
      {msg && <div className="admin-alert success">{msg}</div>}

      <div className="admin-grid">
        {/* ================= FORM ================= */}

        <div className="admin-card">
          <h3 className="card-title">
            {editingId ? "Edit Student" : "Add Student"}
          </h3>

          <form onSubmit={handleSubmit}>
            <label>
              Name *
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Degree & Specialization *
              <input
                name="degree_specialization"
                value={form.degree_specialization}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Year of Passing
              <input
                name="year_of_passing"
                value={form.year_of_passing}
                onChange={handleChange}
              />
            </label>

            <label>
              Current Designation *
              <input
                name="designation"
                value={form.designation}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Company *
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Message *
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Upload Image / Video
              <input
                id="student-speak-image"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              <small>Maximum file size: 100KB.</small>
            </label>

            <button className="form-btn" type="submit" disabled={loading}>
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
                disabled={loading}
                style={{ marginLeft: "8px" }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* ================= TABLE ================= */}

        <div className="admin-card">
          <div className="export-delete">
            <h3 className="card-title">All Students</h3>


              <button
                type="button"
                className="export-btn"
                onClick={exportToCSV}
                disabled={studentList.length === 0}
              >
                Export Data
                <PiExportBold style={{ fontSize: "20px" }} />
              </button>

              {/* <button
                type="button"
                className="delete-all-btn"
                onClick={handleDeleteAll}
                disabled={studentList.length === 0 || loading}
              >
                Delete All Data
              </button> */}
        
          </div>

          {tableRows.length === 0 ? (
            <p>No records found</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Degree</th>
                    <th>Year</th>
                    <th>Designation</th>
                    <th>Company</th>
                    <th>Message</th>
                    <th>Approval Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {tableRows.map((row, index) => {
                    const item = row.item;
                    const request = row.request;

                    const isPublished = row.rowType === "published";

                    const status = isPublished
                      ? request?.status || "published"
                      : request?.status || "pending";

                    const imageName =
                      item.image ||
                      item.image_path ||
                      item.file_path ||
                      "";

                    const imageUrl = imageName
                      ? imageName.startsWith("http")
                        ? imageName
                        : `http://localhost:5000/uploads/${imageName}`
                      : "";

                    return (
                      <tr key={row.rowKey}>
                        <td>{index + 1}</td>

                        <td>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              width="50"
                              alt={item.image_alt || item.name || "Student"}
                              title={item.image_title || item.name || "Student"}
                            />
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>{item.name || "—"}</td>
                        <td>{item.degree_specialization || "—"}</td>
                        <td>{item.year_of_passing || "—"}</td>
                        <td>{item.designation || "—"}</td>
                        <td>{item.company || "—"}</td>
                        <td>{item.message?.slice(0, 40) || "—"}</td>

                        <td>
                          <span
                            className={`approval-status-btn  ${getStatusClass(
                              status
                            )}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </td>

                        <td>
                          {isPublished ? (
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

export default StudentSpeakAdmin;
