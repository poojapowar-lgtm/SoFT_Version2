
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { IoClose } from "react-icons/io5";

const TestimonialsAdmin = () => {
  const API_URL = "http://localhost:5000/api/testimonials";
  const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";

  // Must match entity_type saved by the backend approval handler.
  const ENTITY_TYPE = "testimonials";

  const [list, setList] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);

  const [form, setForm] = useState({
    title: "",
    video: null,
    existingVideo: "",
    video_url: "",
  });

  const [preview, setPreview] = useState(null);
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

  // ================= META / TITLE GENERATOR =================

  const generateTitle = (input) => {
    if (!input) return "";

    let name = input;

    if (input.startsWith("http")) {
      try {
        name = new URL(input).pathname.split("/").pop() || "";
      } catch {
        name = input.split("/").pop() || "";
      }
    }

    return name
      .replace(/^\d+-/, "")
      .split(".")[0]
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // ================= APPROVAL HELPERS =================

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

    if (
      data &&
      typeof data === "object" &&
      data.data &&
      typeof data.data === "object"
    ) {
      return data.data;
    }

    return data && typeof data === "object" ? data : {};
  };

  const normalizeStatus = (status) =>
    String(status || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

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
        return status || "No Request";
    }
  };

  const getStatusClass = (status) => {
    switch (normalizeStatus(status)) {
      case "pending":
      case "pending_approval":
        return "pending";
      case "rejected":
        return "rejected";
      case "approved":
        return "approved";
      case "published":
        return "published";
      default:
        return "";
    }
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
    const matches = approvalRequests
      .filter(
        (request) =>
          request.record_id !== null &&
          request.record_id !== undefined &&
          String(request.record_id) === String(recordId)
      )
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

    return matches[0] || null;
  };

  // ================= VIDEO URL HELPERS =================

  const getVideoUrl = (item) => {
    if (item?.video_url) {
      return item.video_url;
    }

    const videoPath = item?.video_path || item?.video || "";

    if (!videoPath) return "";

    if (/^https?:\/\//i.test(videoPath)) {
      return videoPath;
    }

    return `http://localhost:5000${
      videoPath.startsWith("/") ? "" : "/uploads/"
    }${videoPath}`;
  };

  // ================= FETCH PUBLISHED TESTIMONIALS =================

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(API_URL);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.testimonials || res.data?.data || [];

      setList(data);
    } catch (error) {
      console.error("Error loading testimonials:", error);
      setMsg("Error loading testimonials.");
    }
  }, []);

  // ================= FETCH APPROVAL REQUESTS =================

  const fetchApprovalRequests = useCallback(async () => {
    try {
      const res = await axios.get(REQUESTS_URL, getAuthConfig());

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.requests || [];

      const filtered = data
        .filter(
          (request) =>
            String(request.entity_type || "").toLowerCase() ===
            ENTITY_TYPE.toLowerCase()
        )
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

      setApprovalRequests(filtered);
    } catch (error) {
      console.error("Error loading approval requests:", error);
    }
  }, []);

  const refreshData = async () => {
    await Promise.all([fetchData(), fetchApprovalRequests()]);
  };

  useEffect(() => {
    refreshData();
  }, [fetchData, fetchApprovalRequests]);

  // ================= INPUT =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "video_url") {
      setForm((prev) => ({
        ...prev,
        video_url: value,
        title: prev.title || generateTitle(value),
      }));

      setPreview(value || null);
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // ================= VIDEO FILE =================

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please select a valid video file.");
      e.target.value = "";
      return;
    }

    setForm((prev) => ({
      ...prev,
      video: file,
      title: prev.title || generateTitle(file.name),
      video_url: "",
    }));

    setPreview(URL.createObjectURL(file));
  };

  // ================= REMOVE VIDEO =================

  const removeVideo = () => {
    setForm((prev) => ({
      ...prev,
      video: null,
      video_url: "",
      existingVideo: "",
    }));

    setPreview(null);

    const fileInput = document.getElementById("testimonial-video");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ================= RESET =================

  const resetForm = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setForm({
      title: "",
      video: null,
      existingVideo: "",
      video_url: "",
    });

    setPreview(null);
    setEditingId(null);

    const fileInput = document.getElementById("testimonial-video");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ================= SUBMIT FOR APPROVAL =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const videoUrl = form.video_url.trim();

    if (!editingId && !form.video && !videoUrl) {
      setMsg("Please upload a video or enter a video URL.");
      return;
    }

    if (editingId && !form.video && !videoUrl && !form.existingVideo) {
      setMsg("Please keep the existing video or upload a replacement.");
      return;
    }

    const finalTitle =
      form.title.trim() ||
      generateTitle(form.video?.name || videoUrl || form.existingVideo);

    if (!finalTitle) {
      setMsg("Please enter a testimonial title.");
      return;
    }

    const fd = new FormData();

    fd.append("title", finalTitle);
    fd.append("video_url", videoUrl);

    if (form.video) {
      fd.append("video", form.video);
    } else if (form.existingVideo) {
      fd.append("video_path", form.existingVideo);
    }

    try {
      setLoading(true);
      setMsg("");

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, fd, getAuthConfig());

        setMsg("Testimonial update submitted for approval.");
      } else {
        await axios.post(API_URL, fd, getAuthConfig());

        setMsg("Testimonial submitted for approval.");
      }

      resetForm();
      await refreshData();
    } catch (err) {
      console.error(
        "Error submitting testimonial:",
        err.response?.status,
        err.response?.data || err.message
      );

      const errorMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message ||
            err.response?.data?.error ||
            err.message;

      setMsg(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ================= EDIT =================

  const handleEdit = (item) => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setForm({
      title: item.title || "",
      video: null,
      existingVideo: item.video_path || "",
      video_url: item.video_url || "",
    });

    if (item.video_url) {
      setPreview(item.video_url);
    } else if (item.video_path) {
      setPreview(getVideoUrl(item));
    } else {
      setPreview(null);
    }

    setEditingId(item.id);
    setMsg("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ================= DELETE =================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this testimonial for deletion approval?"
      )
    ) {
      return;
    }

    try {
      setMsg("");

      await axios.delete(`${API_URL}/${id}`, getAuthConfig());

      setMsg("Testimonial deletion submitted for approval.");

      if (String(editingId) === String(id)) {
        resetForm();
      }

      await refreshData();
    } catch (error) {
      console.error(
        "Error submitting testimonial deletion:",
        error.response?.status,
        error.response?.data || error.message
      );

      setMsg(
        "Error: " +
          (error.response?.data?.message ||
            error.response?.data?.error ||
            error.message)
      );
    }
  };

  // ================= BUILD TABLE ROWS =================

  const pendingCreateRequests = approvalRequests.filter((request) => {
    if (!isCreateRequest(request) || !isUnpublishedRequest(request)) {
      return false;
    }

    const data = parseRequestData(request);

    return Boolean(data.title || data.video_url || data.video_path);
  });

  const publishedRows = list.map((item) => ({
    rowType: "published",
    rowKey: `published-${item.id}`,
    item,
    request: getLatestRequest(item.id),
  }));

  const requestRows = pendingCreateRequests.map((request) => ({
    rowType: "request",
    rowKey: `request-${request.id}`,
    item: parseRequestData(request),
    request,
  }));

  const tableRows = [...publishedRows, ...requestRows];

  // ================= UI =================

  return (
    <div className="admin-page">
      {msg && <div className="admin-alert success">{msg}</div>}

      <div className="admin-grid">
        {/* ================= FORM ================= */}

        <div className="admin-card">
          <h3 className="card-title">
            {editingId ? "Edit Testimonial" : "Add Testimonial"}
          </h3>

          <form onSubmit={handleSubmit}>
            <label>
              Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Video URL
              <input
                name="video_url"
                value={form.video_url}
                onChange={handleChange}
                placeholder="Enter video URL"
              />
            </label>

            <label>
              Upload Video
              <input
                id="testimonial-video"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
              />
            </label>

            {preview && (
              <div
                style={{
                  margin: "10px 0",
                  position: "relative",
                }}
              >
                {form.video_url ? (
                  <iframe
                    src={preview}
                    width="100%"
                    height="200"
                    title={form.title || "Video testimonial"}
                    style={{ border: "none" }}
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    width="100%"
                    style={{ maxHeight: "220px" }}
                  />
                )}

                <button
                  type="button"
                  onClick={removeVideo}
                  aria-label="Remove video"
                  title="Remove video"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: "#722327",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                  }}
                >
                  <IoClose size={20} />
                </button>
              </div>
            )}

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
          <h3 className="card-title">All Testimonials</h3>

          {tableRows.length === 0 ? (
            <p>No testimonials found</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Title</th>
                    <th>Video</th>
                    <th>Approval Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {tableRows.map((row, index) => {
                    const { item, request } = row;
                    const isPublished = row.rowType === "published";

                    const status = isPublished
                      ? request?.status || "published"
                      : request?.status || "pending";

                    const videoUrl = getVideoUrl(item);

                    return (
                      <tr key={row.rowKey}>
                        <td>{index + 1}</td>

                        <td>{item.title || "—"}</td>

                        <td>
                          {videoUrl ? (
                            <a
                              href={videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Video
                            </a>
                          ) : (
                            "No video available"
                          )}
                        </td>

                        <td>
                          <span
                            className={`approval-status-btn ${getStatusClass(
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

export default TestimonialsAdmin;
