
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  FaCheck,
  FaTimes,
  FaSyncAlt,
  FaClipboardCheck,
  FaTrash,
  FaSearch,
} from "react-icons/fa";
import "./PendingApprovals.css";

const API_URL = "http://localhost:5000/api/admin/approvals";

const STATUS_OPTIONS = ["pending", "approved", "rejected"];

const getRequestsFromResponse = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

// Parse JSON fields
const parseData = (value) => {
  if (!value) return {};

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const PendingApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);

  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Search, module, action and date filters
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // Date-range deletion
  const [deleteFromDate, setDeleteFromDate] = useState("");
  const [deleteToDate, setDeleteToDate] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Authentication
  const getAuthConfig = useCallback(() => {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);

  // Fetch requests for selected status
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(API_URL, {
        ...getAuthConfig(),
        params: { status },
      });

      setRequests(getRequestsFromResponse(response));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load approval requests."
      );
    } finally {
      setLoading(false);
    }
  }, [status, getAuthConfig]);

  // Fetch all statuses for counts and module dropdown
  const fetchAllRequests = useCallback(async () => {
    try {
      const responses = await Promise.all(
        STATUS_OPTIONS.map((requestStatus) =>
          axios.get(API_URL, {
            ...getAuthConfig(),
            params: { status: requestStatus },
          })
        )
      );

      const combinedRequests = responses.flatMap(
        (response) => getRequestsFromResponse(response)
      );

      const uniqueRequests = Array.from(
        new Map(
          combinedRequests.map((request) => [
            String(request.id),
            request,
          ])
        ).values()
      );

      setAllRequests(uniqueRequests);

      return uniqueRequests;
    } catch (err) {
      console.error(
        "Failed to fetch approval counts:",
        err.response?.data || err.message
      );

      return null;
    }
  }, [getAuthConfig]);

  // Initial load and status changes
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  // Format dates
  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  };

  // Calculate status counts
  const counts = useMemo(() => {
    return allRequests.reduce(
      (result, request) => {
        const key = String(request.status || "")
          .trim()
          .toLowerCase();

        if (
          Object.prototype.hasOwnProperty.call(result, key)
        ) {
          result[key] += 1;
        }

        return result;
      },
      {
        pending: 0,
        approved: 0,
        rejected: 0,
      }
    );
  }, [allRequests]);

  // Filter module options from all statuses
  const moduleOptions = useMemo(() => {
    return [
      ...new Set(
        allRequests
          .map((request) => request.entity_type)
          .filter(Boolean)
      ),
    ].sort();
  }, [allRequests]);

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    const filtered = requests.filter((request) => {
      const searchValue = search.trim().toLowerCase();

      const searchableText = [
        request.id,
        request.entity_type,
        request.operation,
        request.submitted_by_name,
        request.submitted_by_email,
        request.submitted_by,
        request.record_id,
        request.review_comment,
        JSON.stringify(parseData(request.proposed_data)),
      ]
        .join(" ")
        .toLowerCase();

      // Search
      if (
        searchValue &&
        !searchableText.includes(searchValue)
      ) {
        return false;
      }

      // Module filter
      if (
        moduleFilter &&
        request.entity_type !== moduleFilter
      ) {
        return false;
      }

      // Action filter
      if (
        actionFilter &&
        request.operation?.toLowerCase() !== actionFilter
      ) {
        return false;
      }

      // Date filter
      if (!request.submitted_at) {
        return !fromDate && !toDate;
      }

      const submittedDate = new Date(request.submitted_at);

      if (Number.isNaN(submittedDate.getTime())) {
        return false;
      }

      const day = (date) => {
        const parsed = new Date(date);

        return new Date(
          parsed.getFullYear(),
          parsed.getMonth(),
          parsed.getDate()
        );
      };

      const requestDay = day(submittedDate);

      if (fromDate && requestDay < day(fromDate)) {
        return false;
      }

      if (toDate && requestDay > day(toDate)) {
        return false;
      }

      return true;
    });

    // Sort by submission date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.submitted_at || 0).getTime();
      const dateB = new Date(b.submitted_at || 0).getTime();

      return sortOrder === "newest"
        ? dateB - dateA
        : dateA - dateB;
    });
  }, [
    requests,
    search,
    moduleFilter,
    actionFilter,
    fromDate,
    toDate,
    sortOrder,
  ]);

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setModuleFilter("");
    setActionFilter("");
    setFromDate("");
    setToDate("");
    setSortOrder("newest");
  };

  // Refresh requests and counts
  const refreshApprovalData = async () => {
    await Promise.all([
      fetchRequests(),
      fetchAllRequests(),
    ]);
  };

  // Approve request
  const handleApprove = async (request) => {
    const confirmed = window.confirm(
      `Approve this ${request.entity_type} ${request.operation} request? This will apply the change to published content.`
    );

    if (!confirmed) return;

    setProcessingId(request.id);
    setMessage("");
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/${request.id}/approve`,
        {},
        getAuthConfig()
      );

      setMessage(
        response.data.message || "Request approved."
      );

      await refreshApprovalData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to approve the request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Reject request
  const handleReject = async (request) => {
    const comment = window.prompt(
      "Enter a reason for rejection (optional):"
    );

    if (comment === null) return;

    setProcessingId(request.id);
    setMessage("");
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/${request.id}/reject`,
        { comment },
        getAuthConfig()
      );

      setMessage(
        response.data.message || "Request rejected."
      );

      await refreshApprovalData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to reject the request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Delete approval requests by date range
  const handleDeleteByDate = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!deleteFromDate || !deleteToDate) {
      setError("Please select both deletion dates.");
      return;
    }

    if (deleteFromDate > deleteToDate) {
      setError(
        "From Date cannot be later than To Date."
      );
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete approval requests submitted from ${deleteFromDate} to ${deleteToDate}, inclusive? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await axios.delete(
        `${API_URL}/by-date`,
        {
          ...getAuthConfig(),
          data: {
            fromDate: deleteFromDate,
            toDate: deleteToDate,
          },
        }
      );

      setMessage(
        response.data.message ||
        `${response.data.deletedCount ?? "Selected"} request(s) deleted.`
      );

      await refreshApprovalData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete requests. Verify that the backend date-range deletion endpoint is implemented and authorized."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Render proposed data
  const renderProposedData = (request) => {
    const data = parseData(request.proposed_data);

    if (request.operation === "delete") {
      return (
        <div className="approval-delete-note">
          Delete published record #{request.record_id}
        </div>
      );
    }

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return <p>No proposed data available.</p>;
    }

    const ignoredFields = [
      "id",
      "created_at",
      "updated_at",
    ];

    const formatLabel = (key) =>
      key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        );

    const formatValue = (value) => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return "—";
      }

      if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
      }

      return String(value);
    };

    return (
      <div className="approval-data">
        {Object.entries(data)
          .filter(
            ([key]) => !ignoredFields.includes(key)
          )
          .map(([key, value]) => (
            <div
              className="approval-data-row"
              key={key}
            >
              <span>
                <b>{formatLabel(key)}:</b>
              </span>

              <span className="approval-data-value">
                {key === "file_path" && value ? (
                  <a
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View File
                  </a>
                ) : (
                  formatValue(value)
                )}
              </span>
            </div>
          ))}

        {request.operation === "update" && (
          <details className="approval-original">
            <summary>
              View previously published data
            </summary>

            <pre>
              {JSON.stringify(
                parseData(request.original_data),
                null,
                2
              )}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="admin-page">
      <div className="approval-page">

        {/* Header */}
        <div className="approval-header">
          <div>
            <h1 className="card-heading">
              <FaClipboardCheck /> Pending Approvals
            </h1>

            <p>
              Review and manage content changes submitted
              by administrators.
            </p>
          </div>

          <div className="approval-header-actions">
            <button
              type="button"
              className="approval-refresh"
              onClick={refreshApprovalData}
              disabled={loading}
            >
              <FaSyncAlt /> Refresh
            </button>
          </div>
        </div>

        {/* Status counts */}
        <div className="approval-header">
          <div className="approval-counts">
            {STATUS_OPTIONS.map((item) => (
              <button
                type="button"
                key={item}
                className={`approval-count-card ${item} ${
                  status === item ? "active" : ""
                }`}
                onClick={() => setStatus(item)}
              >
                <span>
                  {item.charAt(0).toUpperCase() +
                    item.slice(1)}
                </span>

                <strong>{counts[item]}</strong>
              </button>
            ))}
          </div>

          {/* Delete Requests Accordion */}
          <div className="approval-header-tools">
            <div className="approval-tools-accordion approval-delete-accordion">
              <button
                type="button"
                className="approval-tools-toggle"
                onClick={() =>
                  setDeleteOpen((prev) => !prev)
                }
                aria-expanded={deleteOpen}
              >
                <span>
                  <FaTrash /> Delete Requests
                </span>

                {deleteOpen ? "−" : "+"}
              </button>

              {deleteOpen && (
                <div className="approval-accordion-content">
                  <p>
                    Permanently delete approval requests
                    within the selected submission date range.
                    Published content will not be deleted.
                  </p>

                  <form onSubmit={handleDeleteByDate}>
                    <label>
                      From Date
                      <input
                        type="date"
                        value={deleteFromDate}
                        max={deleteToDate || undefined}
                        onChange={(event) =>
                          setDeleteFromDate(event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      To Date
                      <input
                        type="date"
                        value={deleteToDate}
                        min={deleteFromDate || undefined}
                        onChange={(event) =>
                          setDeleteToDate(event.target.value)
                        }
                        required
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={deleting}
                    >
                      <FaTrash />
                      {deleting
                        ? "Deleting..."
                        : "Delete Requests in Range"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unified Search and Filters */}
        <div className="approval-filters">

          {/* Search */}
          <div className="approval-search">
            <FaSearch />

            <input
              type="text"
              placeholder="Search admin, module or request..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(event) =>
              setModuleFilter(event.target.value)
            }
          >
            <option value="">All Modules</option>

            {moduleOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(event) =>
              setActionFilter(event.target.value)
            }
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>

          {/* Sort by Date */}
          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value)
            }
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* From Date */}
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) =>
              setFromDate(event.target.value)
            }
            aria-label="From date"
          />

          {/* To Date */}
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) =>
              setToDate(event.target.value)
            }
            aria-label="To date"
          />

          {/* Clear Filters */}
          <button
            type="button"
            className="approval-clear-filters"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

        {/* Filter result count */}
        <p className="approval-filter-count">
          Showing {filteredRequests.length} of{" "}
          {requests.length} {status} requests.
        </p>

        {/* Success Message */}
        {message && (
          <div
            className="approval-message success"
            role="status"
          >
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="approval-message error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="approval-empty">
            Loading requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="approval-empty">
            <h3>No {status} requests</h3>

            <p>
              No requests match the selected filters. New
              requests submitted by admins will appear here.
            </p>
          </div>
        ) : (
          <div className="approval-list">
            {filteredRequests.map((request) => (
              <article
                className="approval-card"
                key={request.id}
              >
                <div className="approval-card-header">
                  <div>
                    <p className="approval-request-id">
                      Request #{request.id}
                    </p>

                    <p style={{ color: "green" }}>
                      {request.entity_type} —{" "}
                      {request.operation}
                    </p>
                  </div>

                  <span
                    className={`approval-status-btn ${request.status}`}
                  >
                    {request.status}
                  </span>
                </div>

                <div className="approval-meta">
                  <span>
                    <strong>Submitted by:</strong>{" "}
                    {request.submitted_by_name ||
                      request.submitted_by_email ||
                      `Admin #${request.submitted_by}`}
                  </span>

                  <span>
                    <strong>Submitted:</strong>{" "}
                    {formatDate(request.submitted_at)}
                  </span>

                  {request.record_id && (
                    <span>
                      <strong>Record ID:</strong>{" "}
                      {request.record_id}
                    </span>
                  )}
                </div>

                <div className="approval-preview">
                  <p>
                    <b>Proposed change</b>
                  </p>

                  {renderProposedData(request)}
                </div>

                {request.status === "rejected" &&
                  request.review_comment && (
                    <p className="approval-reason">
                      <b>Rejection reason:</b>{" "}
                      {request.review_comment}
                    </p>
                  )}

                {request.status !== "pending" && (
                  <p className="approval-reviewed">
                    Reviewed by:{" "}
                    {request.reviewed_by_name ||
                      "Superadmin"}
                    {" · "}
                    {formatDate(request.reviewed_at)}
                  </p>
                )}

                {request.status === "pending" && (
                  <div className="approval-actions">
                    <button
                      type="button"
                      className="approve-btn"
                      onClick={() =>
                        handleApprove(request)
                      }
                      disabled={processingId !== null}
                    >
                      <FaCheck />

                      {processingId === request.id
                        ? "Processing..."
                        : "Approve"}
                    </button>

                    <button
                      type="button"
                      className="reject-btn"
                      onClick={() =>
                        handleReject(request)
                      }
                      disabled={processingId !== null}
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;
