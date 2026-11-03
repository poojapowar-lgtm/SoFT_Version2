import React, { useEffect, useState } from "react";
import axios from "axios";
import { IoClose } from "react-icons/io5";
import RichTextEditor from "../adminComponents/RichTextEditor";
import "react-quill-new/dist/quill.snow.css";

const API_URL = "http://localhost:5000/api/events";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";
const SERVER_URL = "http://localhost:5000";

const Events = () => {
  const [eventList, setEventList] = useState([]);
  const [eventRequests, setEventRequests] = useState([]);

  const [form, setForm] = useState({
    title: "",
    date: "",
    description: "",
    files: [],
    existingFiles: [],
    doc: null,
    existingDoc: "",
    link_text: "",
    link_url: "",
  });

  const [imgPreviews, setImgPreviews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

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

  // ================= FETCH EVENTS =================
  const fetchEvents = async () => {
    try {
      const res = await axios.get(API_URL);
      setEventList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setMessage(
        "Failed to load events: " +
        (err.response?.data?.message ||
          err.response?.data ||
          err.message)
      );
      setEventList([]);
    }
  };

  // ================= FETCH APPROVAL REQUESTS =================
  const fetchEventRequests = async () => {
    try {
      const res = await axios.get(REQUESTS_URL, getAuthConfig());

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.requests || [];

      setEventRequests(data);
    } catch (err) {
      console.error("Error fetching event approval requests:", err);
      setEventRequests([]);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchEventRequests();
  }, []);

  // ================= FILE PATH HELPERS =================
  const normalizeFilePaths = (filePath) => {
    if (!filePath) return [];

    try {
      const parsed =
        typeof filePath === "string"
          ? JSON.parse(filePath)
          : filePath;

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (path) => typeof path === "string" && path.trim()
        );
      }

      if (typeof parsed === "string" && parsed.trim()) {
        return [parsed];
      }

      return [];
    } catch {
      return typeof filePath === "string" && filePath.trim()
        ? [filePath]
        : [];
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return "";

    if (
      filePath.startsWith("http://") ||
      filePath.startsWith("https://") ||
      filePath.startsWith("blob:")
    ) {
      return filePath;
    }

    return `${SERVER_URL}${filePath.startsWith("/") ? "" : "/"
      }${filePath}`;
  };

  const getFirstImage = (filePath) => {
    return normalizeFilePaths(filePath)[0] || null;
  };

  // ================= PARSE REQUEST DATA =================
  const parseRequestData = (request) => {
    if (!request?.proposed_data) return {};

    if (typeof request.proposed_data === "object") {
      return request.proposed_data;
    }

    try {
      return JSON.parse(request.proposed_data);
    } catch (err) {
      console.error("Unable to parse event request data:", err);
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

  // ================= LATEST REQUEST FOR EVENT =================
  const getLatestRequest = (recordId) => {
    if (recordId == null) return null;

    return (
      eventRequests
        .filter(
          (request) =>
            request.entity_type === "events" &&
            String(request.record_id) === String(recordId)
        )
        .sort(
          (a, b) => Number(b.id || 0) - Number(a.id || 0)
        )[0] || null
    );
  };

  // ================= COMBINE EVENTS AND CREATE REQUESTS =================
  const getCombinedEvents = () => {
    const newEventRequests = eventRequests
      .filter((request) => {
        const status = normalizeStatus(request.status);
        const operation = normalizeStatus(request.operation);

        if (
          request.entity_type !== "events" ||
          operation !== "create" ||
          !["pending", "rejected"].includes(status)
        ) {
          return false;
        }

        return true;
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

    const publishedEvents = eventList.map((item) => {
      const latestRequest = getLatestRequest(item.id);

      return {
        ...item,
        isRequest: false,
        approvalStatus: latestRequest?.status || "published",
      };
    });

    return [...newEventRequests, ...publishedEvents].sort(
      (a, b) => {
        const aDate = String(a.date || "");
        const bDate = String(b.date || "");

        if (aDate && bDate && aDate !== bDate) {
          return bDate.localeCompare(aDate);
        }

        return Number(b.id || 0) - Number(a.id || 0);
      }
    );
  };

  const combinedEvents = getCombinedEvents();

  // ================= FORM CHANGE =================
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ================= IMAGE SELECTION =================
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const maxSize = 250 * 1024;

    const validFiles = selected.filter((file) => {
      if (file.size > maxSize) {
        alert(`${file.name} exceeds the 250KB size limit.`);
        return false;
      }

      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not a valid image.`);
        return false;
      }

      return true;
    });

    setForm((prev) => ({
      ...prev,
      files: [...prev.files, ...validFiles],
    }));

    setImgPreviews((prev) => [
      ...prev,
      ...validFiles.map((file) => URL.createObjectURL(file)),
    ]);

    // Allow selecting the same file again after removal.
    e.target.value = "";
  };

  // ================= DOCUMENT SELECTION =================
  const handleDocChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    if (selectedFile) {
      const allowedExtensions = /\.(pdf|doc|docx)$/i;

      if (!allowedExtensions.test(selectedFile.name)) {
        alert("Please select a PDF, DOC, or DOCX document.");
        e.target.value = "";
        return;
      }
    }

    setForm((prev) => ({
      ...prev,
      doc: selectedFile,
    }));
  };

  // ================= REMOVE NEW IMAGE =================
  const removeNewImage = (index) => {
    setForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));

    setImgPreviews((prev) => {
      const previewToRemove = prev[index];

      if (previewToRemove?.startsWith("blob:")) {
        URL.revokeObjectURL(previewToRemove);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  // ================= REMOVE EXISTING IMAGE =================
  const removeExistingImage = (index) => {
    setForm((prev) => ({
      ...prev,
      existingFiles: prev.existingFiles.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    imgPreviews.forEach((src) => {
      if (src.startsWith("blob:")) {
        URL.revokeObjectURL(src);
      }
    });

    setForm({
      title: "",
      date: "",
      description: "",
      files: [],
      existingFiles: [],
      doc: null,
      existingDoc: "",
      link_text: "",
      link_url: "",
    });

    setImgPreviews([]);
    setEditingId(null);

    const imageInput = document.getElementById("event-images");
    const docInput = document.getElementById("event-document");

    if (imageInput) imageInput.value = "";
    if (docInput) docInput.value = "";
  };

  // ================= ADD / UPDATE EVENT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Title is required.");
      return;
    }

    const formData = new FormData();

    formData.append("title", form.title.trim());
    formData.append("date", form.date);
    formData.append("description", form.description);
    formData.append("link_text", form.link_text);
    formData.append("link_url", form.link_url);

    form.files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append(
      "file_path",
      JSON.stringify(form.existingFiles)
    );

    if (form.doc) {
      formData.append("doc", form.doc);
    } else {
      formData.append("doc_path", form.existingDoc || "");
    }

    try {
      const config = getAuthConfig();

      if (editingId) {
        await axios.put(
          `${API_URL}/${editingId}`,
          formData,
          config
        );

        setMessage("Event update submitted for approval.");
      } else {
        await axios.post(API_URL, formData, config);

        setMessage("Event submitted for approval.");
      }

      resetForm();

      await Promise.all([
        fetchEvents(),
        fetchEventRequests(),
      ]);
    } catch (err) {
      console.error(
        "Event save error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMessage(
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : err.message) ||
        "Unable to save event."
      );
    }
  };

  // ================= EDIT EVENT =================
  const handleEdit = (item) => {
    if (item.isRequest) return;

    const existingFiles = normalizeFilePaths(item.file_path);

    resetForm();

    setForm({
      title: item.title || "",
      date: item.date || "",
      description: item.description || "",
      files: [],
      existingFiles,
      doc: null,
      existingDoc: item.doc_path || "",
      link_text: item.link_text || "",
      link_url: item.link_url || "",
    });

    setEditingId(item.id);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ================= DELETE EVENT =================
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this event for deletion?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`, getAuthConfig());

      setMessage("Event deletion submitted for approval.");

      await Promise.all([
        fetchEvents(),
        fetchEventRequests(),
      ]);
    } catch (err) {
      console.error(
        "Event delete error:",
        err.response?.status,
        err.response?.data || err.message
      );

      setMessage(
        err.response?.data?.message ||
        (typeof err.response?.data === "string"
          ? err.response.data
          : err.message) ||
        "Unable to delete event."
      );
    }
  };

  // ================= RENDER EVENT IMAGE =================
  const renderEventImage = (filePath, title) => {
    const imagePath = getFirstImage(filePath);

    if (!imagePath) return "No image";

    return (
      <img
        src={getFileUrl(imagePath)}
        alt={title || "Event"}
        title={title || "Event"}
        className="table-img"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  };

  // ================= RENDER =================
  return (
    <div className="admin-page">
      {message && (
        <div className="admin-alert success success">{message}</div>
      )}

      <div className="admin-grid">
        {/* ================= FORM ================= */}
        <div className="admin-card">
          <h2 className="card-title">
            {editingId ? "Edit Event" : "Add Event"}
          </h2>

          <form onSubmit={handleSubmit}>
            <label>
              Title *
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Date *
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </label>

            <label
              style={{
                display: "block",
                marginTop: "20px",
              }}
            >
              Description *
            </label>

            <RichTextEditor
              value={form.answer}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  answer: value,
                }))
              }
              placeholder="Enter FAQ answer..."
            />


            {/* IMAGE UPLOAD */}
            <label>
              Upload Images (maximum 250KB per image)
              <input
                id="event-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </label>

            {/* EXISTING IMAGES */}
            {form.existingFiles.length > 0 && (
              <div className="image-preview-container">
                {form.existingFiles.map((filePath, index) => (
                  <div
                    key={`existing-${filePath}-${index}`}
                    style={{
                      position: "relative",
                      display: "inline-block",
                    }}
                  >
                    <img
                      src={getFileUrl(filePath)}
                      alt="Existing event"
                      className="preview-img"
                    />

                    <IoClose
                      onClick={() => removeExistingImage(index)}
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
                ))}
              </div>
            )}

            {/* NEW IMAGE PREVIEWS */}
            {imgPreviews.length > 0 && (
              <div className="image-preview-container">
                {imgPreviews.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    style={{
                      position: "relative",
                      display: "inline-block",
                    }}
                  >
                    <img
                      src={src}
                      alt="New event preview"
                      className="preview-img"
                    />

                    <IoClose
                      onClick={() => removeNewImage(index)}
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
                ))}
              </div>
            )}

            {/* DOCUMENT UPLOAD */}
            <label>
              Upload Document (PDF / DOC / DOCX)
              <input
                id="event-document"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleDocChange}
              />
            </label>

            {form.doc && (
              <p style={{ fontSize: "12px", color: "#004d00" }}>
                📄 {form.doc.name}
              </p>
            )}

            {!form.doc && form.existingDoc && (
              <p style={{ fontSize: "12px", color: "#555" }}>
                📄{" "}
                <a
                  href={getFileUrl(form.existingDoc)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View existing document
                </a>
              </p>
            )}

            <label>
              Link Text
              <input
                name="link_text"
                value={form.link_text}
                onChange={handleChange}
              />
            </label>

            <label>
              Link URL
              <input
                name="link_url"
                type="url"
                value={form.link_url}
                onChange={handleChange}
              />
            </label>

            <button className="form-btn" type="submit">
              {editingId
                ? "Submit Update for Approval"
                : "Submit"}
            </button>

            {editingId && (
              <button
                className="form-btn"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* ================= EVENTS TABLE ================= */}
        <div className="admin-card">
          <h2 className="card-title">All Events</h2>

          {combinedEvents.length === 0 ? (
            <p>No events found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Image</th>
                    <th>Document</th>
                    <th>Link</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {combinedEvents.map((item, index) => (
                    <tr
                      key={
                        item.isRequest
                          ? `request-${item.requestId}`
                          : `event-${item.id}`
                      }
                    >
                      <td>{index + 1}</td>

                      <td>{item.title || ""}</td>

                      <td>{item.date || ""}</td>

                      <td>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: String(
                              item.description || ""
                            ).slice(0, 60),
                          }}
                        />
                        {String(item.description || "").length > 60
                          ? "..."
                          : ""}
                      </td>

                      <td>
                        {renderEventImage(
                          item.file_path,
                          item.title
                        )}
                      </td>

                      <td>
                        {item.doc_path ? (
                          <a
                            href={getFileUrl(item.doc_path)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            📄 View
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {item.link_url ? (
                          <a
                            href={item.link_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.link_text || "Open"}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

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

export default Events;