
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { IoClose } from "react-icons/io5";
import { PiExportBold } from "react-icons/pi";

const API_URL = "http://localhost:5000/api/placed-students";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";

// Must match entity_type used in your backend approval handler.
const ENTITY_TYPE = "placed_students";

const INITIAL_FORM = {
  name: "",
  discipline: "",
  organization: "",
  package_lpa: "",
};

const PlacedStudentsAdmin = () => {
  const [list, setList] = useState([]);
  const [requests, setRequests] = useState([]);

  const [file, setFile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);
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

    if (typeof data === "object") return data;

    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  };

  // ================= FETCH STUDENTS =================
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await axios.get(API_URL);
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch placed students error:", err);
      setMsg("Failed to fetch placed students.");
      setList([]);
    } finally {
      setLoading(false);
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
        : res.data?.requests || [];

      setRequests(data);
    } catch (err) {
      console.error("Fetch approval requests error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchRequests();
  }, [fetchData, fetchRequests]);

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

  const getCombinedStudents = () => {
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

        return true;
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

    const publishedStudents = list.map((item) => {
      const latestRequest = getLatestRequest(item.id);

      return {
        ...item,
        approvalStatus: latestRequest?.status || "published",
        isApprovalRequest: false,
      };
    });

    return [...unpublishedRequests, ...publishedStudents];
  };

  const displayedList = getCombinedStudents();

  // ================= IMAGE HANDLING =================
  const handlePhotoChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    // Keep the original 100 KB validation.
    if (selectedFile.size > 100 * 1024) {
      alert("Image must be less than 100KB.");
      e.target.value = "";
      return;
    }

    setPhoto(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const clearPhoto = () => {
    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setPhoto(null);
    setPreview("");

    const input = document.getElementById("placed-student-photo");
    if (input) input.value = "";
  };

  // ================= EXCEL UPLOAD =================
  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleExcelUpload = async () => {
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API_URL}/upload-excel`,
        formData,
        {
          ...getAuthConfig(),
          headers: {
            ...getAuthConfig().headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMsg(
        res.data?.message ||
        "Placed students Excel upload submitted successfully."
      );

      setFile(null);

      const input = document.querySelector(
        ".excel-file-input"
      );

      if (input) input.value = "";

      await Promise.all([fetchData(), fetchRequests()]);
    } catch (err) {
      console.error("Excel upload error:", err);

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Excel upload failed."
      );
    }
  };

  // ================= EXPORT TO CSV =================
  const exportToCSV = () => {
    if (displayedList.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Sr No",
      "Name",
      "Discipline",
      "Organization",
      "Package In LPA",
      "Approval Status",
    ];

    const rows = displayedList.map((item, index) => [
      index + 1,
      item.name || "",
      item.discipline || "",
      item.organization || "",
      item.package_lpa ?? "",
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
        .join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "placed_students_list.csv";

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

    if (!form.name.trim()) {
      err.name = "Name is required.";
    }

    if (!form.discipline.trim()) {
      err.discipline = "Discipline is required.";
    }

    if (!form.organization.trim()) {
      err.organization = "Organization is required.";
    }

    if (
      form.package_lpa === "" ||
      !Number.isFinite(Number(form.package_lpa)) ||
      Number(form.package_lpa) < 0
    ) {
      err.package_lpa = "Enter a valid package amount.";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const resetForm = () => {
    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setForm(INITIAL_FORM);
    setPhoto(null);
    setPreview("");
    setEditingId(null);
    setErrors({});

    const input = document.getElementById("placed-student-photo");
    if (input) input.value = "";
  };

  // ================= ADD / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const formData = new FormData();

    formData.append("name", form.name.trim());
    formData.append("discipline", form.discipline.trim());
    formData.append("organization", form.organization.trim());
    formData.append("package_lpa", form.package_lpa);

    if (photo) {
      formData.append("photo", photo);
    }

    try {
      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          formData,
          {
            ...getAuthConfig(),
            headers: {
              ...getAuthConfig().headers,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setMsg(
          "Placed student update submitted for approval."
        );
      } else {
        await axios.post(
          API_URL,
          formData,
          {
            ...getAuthConfig(),
            headers: {
              ...getAuthConfig().headers,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setMsg(
          "Placed student addition submitted for approval."
        );
      }

      resetForm();

      await Promise.all([fetchData(), fetchRequests()]);
    } catch (err) {
      console.error("Save placed student error:", err);

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to submit placed student for approval."
      );
    }
  };

  // ================= EDIT =================
  const handleEdit = (item) => {
    if (item.isApprovalRequest) return;

    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setForm({
      name: item.name || "",
      discipline: item.discipline || "",
      organization: item.organization || "",
      package_lpa: item.package_lpa ?? "",
    });

    setEditingId(item.id);
    setPhoto(null);
    setErrors({});
    setMsg("");

    setPreview(
      item.photo
        ? `http://localhost:5000/uploads/${item.photo}`
        : ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this placed student record for deletion approval?"
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
        "Placed student deletion submitted for approval."
      );

      if (String(editingId) === String(id)) {
        resetForm();
      }

      await Promise.all([fetchData(), fetchRequests()]);
    } catch (err) {
      console.error("Delete placed student error:", err);

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to submit deletion request."
      );
    }
  };

  // ================= DELETE ALL =================
  const handleDeleteAll = async () => {
    if (list.length === 0) {
      setMsg("No placed students available to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Submit all ${list.length} placed student records for deletion?\n\nThis operation may require administrator approval.`
    );

    if (!confirmed) return;

    try {
      setMsg("");

      const res = await axios.delete(
        `${API_URL}/delete-all`,
        getAuthConfig()
      );

      setMsg(
        res.data?.message ||
        "Placed student bulk deletion submitted."
      );

      if (editingId) resetForm();

      await Promise.all([fetchData(), fetchRequests()]);
    } catch (err) {
      console.error("Delete all placed students error:", err);

      setMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to submit bulk deletion request."
      );
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
            {editingId ? "Edit Student" : "Add Student"}
          </h3>

          <form onSubmit={handleSubmit}>
            <label>
              Name *
              <input
                name="name"
                placeholder="Enter name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
            {errors.name && (
              <span className="error">{errors.name}</span>
            )}

            <label>
              Discipline *
              <input
                name="discipline"
                placeholder="Enter discipline"
                value={form.discipline}
                onChange={handleChange}
                required
              />
            </label>
            {errors.discipline && (
              <span className="error">{errors.discipline}</span>
            )}

            <label>
              Organization *
              <input
                name="organization"
                placeholder="Enter organization"
                value={form.organization}
                onChange={handleChange}
                required
              />
            </label>
            {errors.organization && (
              <span className="error">{errors.organization}</span>
            )}

            <label>
              Package (LPA)
              <input
                type="number"
                name="package_lpa"
                min="0"
                step="any"
                placeholder="Enter package"
                value={form.package_lpa}
                onChange={handleChange}
              />
            </label>
            {errors.package_lpa && (
              <span className="error">{errors.package_lpa}</span>
            )}

            {/* IMAGE */}
            <div className="image-upload">
              <label>
                Upload Photo (Max 100KB)
                <input
                  id="placed-student-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>

              {preview && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginTop: "8px",
                  }}
                >
                  <img
                    src={preview}
                    alt="Student preview"
                    className="preview-img"
                  />

                  <IoClose
                    onClick={clearPhoto}
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-6px",
                      background: "#722327",
                      color: "#fff",
                      borderRadius: "50%",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                  />
                </div>
              )}
            </div>

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

        {/* ================= TABLE ================= */}
        <div className="admin-card">
          <div className="export-delete">
            <h3 className="card-title">Students List</h3>

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

                link.href = `${process.env.PUBLIC_URL}/assets/docs/sample_students_list.xlsx`;
                link.download = "sample_students_list.xlsx";

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
              className="excel-file-input"
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
              Excel file must have these exact headers:
              <br />
              <strong>
                Sr No | Name of Students | Discipline |
                Industry/Organization | Package In LPA
              </strong>
            </p>


          </div>

          {/* DATA TABLE */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Discipline</th>
                  <th>Organization</th>
                  <th>Package</th>
                  <th>Approval Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8">Loading placed students...</td>
                  </tr>
                ) : displayedList.length > 0 ? (
                  displayedList.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        {item.photo && (
                          <img
                            src={
                              item.photo.startsWith("http")
                                ? item.photo
                                : `http://localhost:5000/uploads/${item.photo}`
                            }
                            alt={item.name || "Student"}
                            className="table-img"
                          />
                        )}
                      </td>

                      <td>{item.name || "-"}</td>
                      <td>{item.discipline || "-"}</td>
                      <td>{item.organization || "-"}</td>
                      <td>{item.package_lpa ?? "-"}</td>

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
                    <td colSpan="8">No placed students found.</td>
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

export default PlacedStudentsAdmin;
