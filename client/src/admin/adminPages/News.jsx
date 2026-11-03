
import React, { useEffect, useState } from "react";
import axios from "axios";

const News = () => {
  const [newsList, setNewsList] = useState([]);
  const [newsType, setNewsType] = useState("admission");
  const [newsRequests, setNewsRequests] = useState([]);

  const [form, setForm] = useState({
    title: "",
    date: "",
    file: null,
    link_text: "",
    link_url: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:5000/api/news";
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

  // Fetch published news for the selected category
  const fetchNews = async () => {
    try {
      const response = await axios.get(
        `${API_URL}?type=${newsType}`
      );

      setNewsList(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error(
        "Error fetching news:",
        error.response?.data || error.message
      );
    }
  };

  // Fetch approval requests submitted by the logged-in admin

  const fetchNewsRequests = async () => {
    try {
      const config = getAuthConfig();

      const response = await axios.get(
        "http://localhost:5000/api/admin/my-requests",
        config
      );

      console.log("News approval requests:", response.data);

      const requests = Array.isArray(response.data?.requests)
        ? response.data.requests
        : [];

      setNewsRequests(requests);
    } catch (error) {
      console.error(
        "Failed to fetch news approval requests:",
        error.response?.status,
        error.response?.data || error.message
      );

      setNewsRequests([]);
    }
  };


  // Load news and approval requests when the category changes
  useEffect(() => {
    fetchNews();
    fetchNewsRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsType]);

  // Handle text input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    const MAX_FILE_SIZE = 500 * 1024; // 500 KB

    if (selectedFile.size > MAX_FILE_SIZE) {
      setMessage("File size must not exceed 500 KB.");
      event.target.value = "";

      setForm((previousForm) => ({
        ...previousForm,
        file: null,
      }));

      return;
    }

    setMessage("");

    setForm((previousForm) => ({
      ...previousForm,
      file: selectedFile,
    }));
  };

  // Reset the form
  const resetForm = () => {
    setForm({
      title: "",
      date: "",
      file: null,
      link_text: "",
      link_url: "",
    });

    setEditingId(null);
  };

  // Parse proposed_data returned from the backend
  const parseRequestData = (data) => {
    if (!data) return {};

    if (typeof data === "object") {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error(
        "Failed to parse approval request data:",
        error
      );

      return {};
    }
  };

  // Combine published news and pending/rejected create requests

  const getCombinedNews = () => {
    // Show pending/rejected requests for newly created news.
    const createRequests = newsRequests
      .filter(
        (request) =>
          request.entity_type === "news" &&
          request.operation === "create" &&
          ["pending", "rejected"].includes(request.status)
      )
      .map((request) => {
        const data = parseRequestData(request.proposed_data);

        if (data.category && data.category !== newsType) {
          return null;
        }

        return {
          ...data,
          id: `request-${request.id}`,
          rowKey: `request-${request.id}`,
          displayStatus: request.status,
          isRequest: true,
          operation: request.operation,
        };
      })
      .filter(Boolean);

    // Show the latest request status for existing published news.
    const publishedRows = newsList.map((item) => {
      const relatedRequests = newsRequests
        .filter(
          (request) =>
            request.entity_type === "news" &&
            Number(request.record_id) === Number(item.id)
        )
        .sort((a, b) => Number(b.id) - Number(a.id));

      const latestRequest = relatedRequests[0];

      // Only display a non-published status if the latest request
      // is still pending or was rejected.
      const displayStatus =
        latestRequest &&
          ["pending", "rejected"].includes(latestRequest.status)
          ? latestRequest.status
          : "published";

      return {
        ...item,
        rowKey: `news-${item.id}`,
        displayStatus,
        isRequest: false,
        pendingOperation:
          latestRequest?.status === "pending"
            ? latestRequest.operation
            : null,
      };
    });

    return [...createRequests, ...publishedRows];
  };

  // Calculate rows after the helper function is defined
  const displayNews = getCombinedNews();

  // Submit new news or an update request
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Title required");
      return;
    }

    const formData = new FormData();

    formData.append("title", form.title);
    formData.append("date", form.date);
    formData.append("link_text", form.link_text);
    formData.append("link_url", form.link_url);
    formData.append("category", newsType);

    if (form.file) {
      formData.append("file", form.file);
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

      setMessage(
        response.data?.message ||
        "Request submitted successfully."
      );

      resetForm();

      // Refresh published news and approval requests
      await Promise.all([
        fetchNews(),
        fetchNewsRequests(),
      ]);
    } catch (error) {
      console.error(
        "News submission error:",
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to submit news request."
      );
    }
  };

  // Edit an existing published news record
  const handleEdit = (item) => {
    setForm({
      title: item.title || "",
      date: item.date
        ? String(item.date).slice(0, 10)
        : "",
      file: null,
      link_text: item.link_text || "",
      link_url: item.link_url || "",
    });

    setEditingId(item.id);
    setMessage("");
  };

  // Submit a deletion request
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Submit this news for deletion?"
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig()
      );

      setMessage(
        response.data?.message ||
        "Your deletion request has been submitted."
      );

      // The live record remains visible until deletion is approved
      await Promise.all([
        fetchNews(),
        fetchNewsRequests(),
      ]);
    } catch (error) {
      console.error(
        "News deletion error:",
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to submit the deletion request."
      );
    }
  };

  // Approval status label
  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending Approval",
      approved: "Approved",
      rejected: "Rejected",
      published: "Published",
    };

    return labels[status] || status || "Unknown";
  };

  return (
    <div className="admin-page">
      {message && (
        <div className="admin-alert success success">
          {message}
        </div>
      )}

      <div className="admin-grid">
        {/* NEWS FORM */}
        <div className="admin-card">
          <h2 className="card-title">
            {editingId ? "Edit News" : "Add News"}
          </h2>

          {/* CATEGORY BUTTONS */}
          <div className="switch-btns">
            <button
              type="button"
              className={`switch-btn ${newsType === "admission" ? "active" : ""
                }`}
              onClick={() => {
                setNewsType("admission");
                setMessage("");
              }}
            >
              Admission
            </button>

            <button
              type="button"
              className={`switch-btn ${newsType === "examination" ? "active" : ""
                }`}
              onClick={() => {
                setNewsType("examination");
                setMessage("");
              }}
            >
              Examination
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Title *
              <input
                type="text"
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
            <label>
              File (Max 500 KB)
              <input
                type="file"
                name="file"
                onChange={handleFileChange}
              />
              <small>
                Maximum allowed file size: 500 KB.
              </small>
            </label>

            <label>
              Link Text
              <input
                type="text"
                name="link_text"
                value={form.link_text}
                onChange={handleChange}
              />
            </label>

            <label>
              Link URL
              <input
                type="url"
                name="link_url"
                value={form.link_url}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </label>

            <button
              className="form-btn"
              type="submit"
            >
              {editingId ? "Update" : "Submit"}
            </button>

            {editingId && (
              <button
                type="button"
                className="form-btn"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* NEWS AND APPROVAL REQUESTS TABLE */}
        <div className="admin-card">
          <h2 className="card-title">
            {newsType === "admission"
              ? "Admission News"
              : "Examination News"}
          </h2>

          {displayNews.length === 0 ? (
            <p>
              No news or approval requests found.
            </p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Link</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {displayNews.map((item, index) => (
                    <tr key={item.rowKey}>
                      <td>{index + 1}</td>

                      <td>{item.title || "-"}</td>

                      <td>{item.date || "-"}</td>

                      <td>
                        {item.file_path ? (
                          <a
                            href={
                              item.file_path.startsWith("http")
                                ? item.file_path
                                : `${SERVER_URL}${item.file_path}`
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.link_text || "View File"}
                          </a>
                        ) : item.link_url ? (
                          <a
                            href={item.link_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.link_text || "Open Link"}
                          </a>
                        ) : (
                          "-"
                        )}
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

export default News;
