
import React, { useEffect, useState } from "react";
import axios from "axios";
import { IoClose } from "react-icons/io5";
import { PiExportBold } from "react-icons/pi";

const FacultyAdmin = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [facultyRequests, setFacultyRequests] = useState([]);

  const [form, setForm] = useState({
    name: "",
    designation: "",
    area_of_expertise: "",
    image: null,
  });

  const [preview, setPreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  const API_URL = "http://localhost:5000/api/faculty";
  const SERVER_URL = "http://localhost:5000";

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

  // Fetch published faculty records
  const fetchFaculty = async () => {
    try {
      const response = await axios.get(API_URL);

      setFacultyList(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error(
        "Error fetching faculty:",
        error.response?.data || error.message
      );

      setMsg("Failed to load faculty data.");
    }
  };

  const normalizeValue = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");


  const fetchFacultyRequests = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/my-requests",
        getAuthConfig()
      );

      const requests = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.requests)
          ? response.data.requests
          : [];

      console.log("All approval requests:", requests);

      const facultyOnly = requests.filter((request) => {
        const entity = normalizeValue(request.entity_type);

        return [
          "faculty",
          "faculty_member",
          "faculty_members",
        ].includes(entity);
      });

      console.log("Filtered faculty requests:", facultyOnly);

      setFacultyRequests(facultyOnly);
    } catch (error) {
      console.error(
        "Failed to fetch faculty approval requests:",
        error.response?.data || error.message
      );

      setFacultyRequests([]);
    }
  };

  // Load published faculty and approval requests
  useEffect(() => {
    fetchFaculty();
    fetchFacultyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle text inputs
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Handle image upload (maximum 100 KB)
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const maxSize = 100 * 1024;

    if (file.size > maxSize) {
      setMsg("Image must not exceed 100 KB.");
      event.target.value = "";

      setForm((previous) => ({
        ...previous,
        image: null,
      }));

      return;
    }

    setMsg("");

    setForm((previous) => ({
      ...previous,
      image: file,
    }));

    setPreview(URL.createObjectURL(file));
  };

  // Remove selected image or preview
  const removeImage = () => {
    setForm((previous) => ({
      ...previous,
      image: null,
    }));

    setPreview("");

    const fileInput = document.getElementById(
      "faculty-image-input"
    );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      name: "",
      designation: "",
      area_of_expertise: "",
      image: null,
    });

    setPreview("");
    setEditingId(null);

    const fileInput = document.getElementById(
      "faculty-image-input"
    );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Parse proposed_data whether it is an object or JSON string.
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
      parsed &&
      typeof parsed === "object" &&
      parsed.data &&
      typeof parsed.data === "object"
    ) {
      return parsed.data;
    }

    return parsed && typeof parsed === "object" ? parsed : {};
  };

  // Combine pending/rejected new requests with published faculty.
  const getCombinedFaculty = () => {
    const facultyOnly = facultyRequests.filter((request) =>
      [
        "faculty",
        "faculty_member",
        "faculty_members",
      ].includes(normalizeValue(request.entity_type))
    );

    // Show requests for new faculty that have not been published.
    const createRequests = facultyOnly
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
        const status = normalizeValue(request.status);

        return {
          ...data,
          id: `request-${request.id}`,
          rowKey: `request-${request.id}`,
          displayStatus: status,
          isRequest: true,
          operation: request.operation,
        };
      });

    // Show the latest applicable request status for existing records.
    const publishedRows = facultyList.map((item) => {
      const relatedRequests = facultyOnly
        .filter((request) => {
          if (
            request.record_id === null ||
            request.record_id === undefined
          ) {
            return false;
          }

          return (
            String(request.record_id) === String(item.id)
          );
        })
        .sort(
          (a, b) => Number(b.id || 0) - Number(a.id || 0)
        );

      const latestRequest = relatedRequests[0];
      const latestStatus = normalizeValue(latestRequest?.status);

      const displayStatus = latestRequest
        ? latestStatus === "pending" ||
          latestStatus === "pending_approval" ||
          latestStatus === "rejected" ||
          latestStatus === "approved"
          ? latestStatus
          : "published"
        : "published";

      return {
        ...item,
        rowKey: `faculty-${item.id}`,
        displayStatus,
        isRequest: false,
        pendingOperation:
          ["pending", "pending_approval"].includes(displayStatus)
            ? latestRequest?.operation
            : null,
      };
    });

    return [...createRequests, ...publishedRows];
  };

  const displayFaculty = getCombinedFaculty();

  // Submit new faculty or update request
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.designation.trim()) {
      setMsg("Name and Designation are required.");
      return;
    }

    const formData = new FormData();

    formData.append("name", form.name.trim());
    formData.append("designation", form.designation.trim());
    formData.append(
      "area_of_expertise",
      form.area_of_expertise
    );

    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      setMsg("");

      const config = getAuthConfig();

      const response = editingId
        ? await axios.put(
          `${API_URL}/${editingId}`,
          formData,
          config
        )
        : await axios.post(API_URL, formData, config);

      setMsg(
        response.data?.message ||
        "Faculty approval request submitted successfully."
      );

      resetForm();

      await Promise.all([
        fetchFaculty(),
        fetchFacultyRequests(),
      ]);
    } catch (error) {
      console.error(
        "Faculty submission error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to submit faculty request."
      );
    }
  };

  // Edit a published faculty record
  const handleEdit = (item) => {
    setForm({
      name: item.name || "",
      designation: item.designation || "",
      area_of_expertise: item.area_of_expertise || "",
      image: null,
    });

    setPreview(
      item.image
        ? `${SERVER_URL}/uploads/${item.image}`
        : ""
    );

    setEditingId(item.id);
    setMsg("");
  };

  // Submit faculty deletion request
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this faculty record for deletion approval?"
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
        "Faculty deletion request submitted successfully."
      );

      await Promise.all([
        fetchFaculty(),
        fetchFacultyRequests(),
      ]);
    } catch (error) {
      console.error(
        "Faculty deletion error:",
        error.response?.data || error.message
      );

      setMsg(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to submit faculty deletion request."
      );
    }
  };

  // Approval status label
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

  // Export published faculty records to CSV
  const exportToCSV = () => {
    if (facultyList.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = [
      "Sr. No.",
      "Name",
      "Designation",
      "Area of Expertise",
    ];

    const rows = facultyList.map((item, index) => [
      index + 1,
      item.name || "",
      item.designation || "",
      item.area_of_expertise || "",
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
    link.download = "faculty_list.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page">
      {msg && (
        <div className="admin-alert success">
          {msg}
        </div>
      )}

      <div className="admin-grid">
        {/* FACULTY FORM */}
        <div className="admin-card">
          <h2 className="card-title">
            {editingId ? "Edit Faculty" : "Add Faculty"}
          </h2>

          <form onSubmit={handleSubmit}>
            <label>
              Name *
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
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
                required
              />
            </label>

            <label>
              Area of Expertise
              <input
                type="text"
                name="area_of_expertise"
                value={form.area_of_expertise}
                onChange={handleChange}
              />
            </label>

            <label>
              Faculty Image (Maximum 100 KB)
              <input
                id="faculty-image-input"
                type="file"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
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
                  alt="Faculty preview"
                  className="preview-img"
                />

                <IoClose
                  role="button"
                  aria-label="Remove image preview"
                  onClick={removeImage}
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
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* FACULTY AND APPROVAL REQUESTS TABLE */}
        <div className="admin-card">
          <h2 className="card-title">
            All Faculty
          </h2>

          <button
            className="export-btn"
            type="button"
            onClick={exportToCSV}
            disabled={facultyList.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "30px",
              marginLeft: "auto",
              marginRight: "20px",
            }}
          >
            Export Data
            <PiExportBold style={{ fontSize: "20px" }} />
          </button>

          {displayFaculty.length === 0 ? (
            <p>No faculty or approval requests found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Expertise</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayFaculty.map((item, index) => (
                    <tr key={item.rowKey}>
                      <td>{index + 1}</td>

                      <td>
                        {item.image ? (
                          <img
                            src={
                              item.image.startsWith("http")
                                ? item.image
                                : `${SERVER_URL}/uploads/${item.image}`
                            }
                            width="50"
                            alt={item.name || "Faculty"}
                            className="table-img"
                          />
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>{item.name || "-"}</td>

                      <td>{item.designation || "-"}</td>

                      <td>
                        {item.area_of_expertise
                          ? item.area_of_expertise.slice(0, 40)
                          : "-"}
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

export default FacultyAdmin;
