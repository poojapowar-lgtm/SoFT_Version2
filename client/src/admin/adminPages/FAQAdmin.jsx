import React, { useEffect, useState } from "react";
import axios from "axios";
import RichTextEditor from "../adminComponents/RichTextEditor";
import { PiExportBold } from "react-icons/pi";

const API_URL = "http://localhost:5000/api/faqs";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";

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

const FAQ = () => {
    const [faqList, setFaqList] = useState([]);
    const [faqRequests, setFaqRequests] = useState([]);

    const [form, setForm] = useState({
        sr_no: "",
        question: "",
        answer: "",
    });

    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // ================= FETCH PUBLISHED FAQs =================
    const fetchFAQs = async () => {
        try {
            setLoading(true);

            const res = await axios.get(API_URL);

            setFaqList(
                Array.isArray(res.data) ? res.data : []
            );
        } catch (err) {
            console.error("Error fetching FAQs:", err);
            setMessage("Unable to load FAQs.");
            setFaqList([]);
        } finally {
            setLoading(false);
        }
    };

    // ================= FETCH APPROVAL REQUESTS =================
    const fetchFAQRequests = async () => {
        try {
            const res = await axios.get(
                REQUESTS_URL,
                getAuthConfig()
            );

            const data = Array.isArray(res.data)
                ? res.data
                : res.data?.requests || [];

            setFaqRequests(data);
        } catch (err) {
            console.error("Error fetching FAQ approval requests:", err);
            setFaqRequests([]);
        }
    };

    useEffect(() => {
        fetchFAQs();
        fetchFAQRequests();
    }, []);

    // ================= PARSE PROPOSED DATA =================
    const parseRequestData = (request) => {
        if (!request?.proposed_data) return {};

        if (typeof request.proposed_data === "object") {
            return request.proposed_data;
        }

        try {
            return JSON.parse(request.proposed_data);
        } catch (err) {
            console.error("Unable to parse FAQ request data:", err);
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

    // ================= GET LATEST REQUEST FOR FAQ =================
    const getLatestRequest = (recordId) => {
        if (recordId == null) return null;

        return (
            faqRequests
                .filter(
                    (request) =>
                        request.entity_type === "faqs" &&
                        String(request.record_id) === String(recordId)
                )
                .sort(
                    (a, b) =>
                        Number(b.id || 0) - Number(a.id || 0)
                )[0] || null
        );
    };

    // ================= COMBINE FAQs AND CREATE REQUESTS =================
    const getCombinedFAQs = () => {
        const newFAQRequests = faqRequests
            .filter((request) => {
                const status = normalizeStatus(request.status);
                const operation = normalizeStatus(request.operation);

                return (
                    request.entity_type === "faqs" &&
                    operation === "create" &&
                    ["pending", "rejected"].includes(status)
                );
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

        const publishedFAQs = faqList.map((item) => {
            const latestRequest = getLatestRequest(item.id);

            return {
                ...item,
                isRequest: false,
                approvalStatus: latestRequest?.status || "published",
            };
        });

        return [...newFAQRequests, ...publishedFAQs].sort(
            (a, b) => {
                const aSr = Number(a.sr_no) || 0;
                const bSr = Number(b.sr_no) || 0;

                if (aSr && bSr && aSr !== bSr) {
                    return aSr - bSr;
                }

                if (aSr && !bSr) return -1;
                if (!aSr && bSr) return 1;

                return Number(a.id || 0) - Number(b.id || 0);
            }
        );
    };

    const combinedFAQs = getCombinedFAQs();

    // ================= RESET FORM =================
    const resetForm = () => {
        setForm({
            sr_no: "",
            question: "",
            answer: "",
        });

        setEditingId(null);
    };

    // ================= SUBMIT FAQ =================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const questionText = String(form.question || "")
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim();

        const answerText = String(form.answer || "")
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim();

        if (
            !form.sr_no ||
            !Number.isInteger(Number(form.sr_no)) ||
            Number(form.sr_no) < 1 ||
            !questionText ||
            !answerText
        ) {
            setMessage(
                "Please enter a valid serial number, question, and answer."
            );
            return;
        }

        try {
            const payload = {
                sr_no: Number(form.sr_no),
                question: form.question,
                answer: form.answer,
            };

            const config = getAuthConfig();

            if (editingId) {
                await axios.put(
                    `${API_URL}/${editingId}`,
                    payload,
                    config
                );

                setMessage(
                    "FAQ update submitted for approval."
                );
            } else {
                await axios.post(
                    API_URL,
                    payload,
                    config
                );

                setMessage(
                    "FAQ submitted for approval."
                );
            }

            resetForm();

            await Promise.all([
                fetchFAQs(),
                fetchFAQRequests(),
            ]);
        } catch (err) {
            console.error(
                "FAQ save error:",
                err.response?.data || err.message
            );

            setMessage(
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Unable to save FAQ."
            );
        }
    };

    // ================= EDIT FAQ =================
    const handleEdit = (item) => {
        if (item.isRequest) return;

        setForm({
            sr_no: item.sr_no ?? "",
            question: item.question || "",
            answer: item.answer || "",
        });

        setEditingId(item.id);
        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ================= DELETE FAQ =================
    const handleDelete = async (id) => {
        if (
            !window.confirm(
                "Submit this FAQ for deletion?"
            )
        ) {
            return;
        }

        try {
            await axios.delete(
                `${API_URL}/${id}`,
                getAuthConfig()
            );

            setMessage(
                "FAQ deletion submitted for approval."
            );

            if (String(editingId) === String(id)) {
                resetForm();
            }

            await Promise.all([
                fetchFAQs(),
                fetchFAQRequests(),
            ]);
        } catch (err) {
            console.error(
                "FAQ delete error:",
                err.response?.data || err.message
            );

            setMessage(
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Unable to delete FAQ."
            );
        }
    };

    // ================= EXPORT FAQs TO CSV =================
    const exportToCSV = () => {
        if (combinedFAQs.length === 0) {
            alert("No FAQ data to export.");
            return;
        }

        const headers = [
            "Sr. No.",
            "Question",
            "Answer",
            "Approval Status",
        ];

        const rows = combinedFAQs.map((item, index) => [
            item.sr_no ?? index + 1,
            item.question ?? "",
            item.answer ?? "",
            getStatusLabel(item.approvalStatus),
        ]);

        const csvContent =
            "\uFEFF" +
            [headers, ...rows]
                .map((row) =>
                    row
                        .map((value) =>
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
        link.download = "FAQs.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    // ================= DELETE ALL FAQs =================
    const handleDeleteAll = async () => {
        if (faqList.length === 0) {
            setMessage("No published FAQs available to delete.");
            return;
        }

        const confirmed = window.confirm(
            `WARNING!\n\nAre you sure you want to permanently delete ALL ${faqList.length} published FAQs?\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setMessage("");

            await axios.delete(
                `${API_URL}/delete-all`,
                getAuthConfig()
            );

            setFaqList([]);
            resetForm();

            await fetchFAQRequests();

            setMessage(
                "Delete-all request submitted for FAQs."
            );
        } catch (err) {
            console.error(
                "Delete all FAQs error:",
                err.response?.data || err.message
            );

            setMessage(
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Unable to delete all FAQs."
            );
        }
    };

    // ================= RENDER =================
    return (
        <div className="admin-page">
            {message && (
                <div className="admin-alert success success">
                    {message}
                </div>
            )}

            <div className="admin-grid">
                {/* ================= FAQ FORM ================= */}
                <div className="admin-card">
                    <h2 className="card-title">
                        {editingId ? "Edit FAQ" : "Add FAQ"}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <label>
                            Serial Number *
                            <input
                                type="number"
                                name="sr_no"
                                min="1"
                                value={form.sr_no}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        sr_no: e.target.value,
                                    }))
                                }
                                required
                            />
                        </label>

                        <label>
                            Question *
                            <input
                                type="text"
                                name="question"
                                value={form.question}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        question: e.target.value,
                                    }))
                                }
                                placeholder="Enter FAQ question..."
                                required
                            />
                        </label>

                        <label
                            style={{
                                display: "block",
                                marginTop: "20px",
                            }}
                        >
                            Answer *
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

                        <div style={{ marginTop: "55px" }}>
                            <button
                                className="form-btn"
                                type="submit"
                            >
                                {editingId
                                    ? "Submit Update for Approval"
                                    : "Submit"}
                            </button>

                            {editingId && (
                                <button
                                    className="form-btn"
                                    type="button"
                                    onClick={resetForm}
                                    style={{ marginLeft: "10px" }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* ================= FAQ TABLE ================= */}
                <div className="admin-card">
                    <div className="export-delete">
                        <h2 className="card-title">
                            Manage FAQs
                        </h2>

                        <div className="export-delete-buttons">
                            <button
                                type="button"
                                className="export-btn"
                                onClick={exportToCSV}
                                disabled={
                                    loading ||
                                    combinedFAQs.length === 0
                                }
                            >
                                Export Data
                                <PiExportBold
                                    style={{ fontSize: "20px" }}
                                />
                            </button>

                            {/* <button
                                type="button"
                                className="delete-all-btn"
                                onClick={handleDeleteAll}
                                disabled={
                                    loading ||
                                    faqList.length === 0
                                }
                            >
                                Delete All Data
                            </button> */}
                        </div>
                    </div>

                    {loading ? (
                        <p>Loading FAQs...</p>
                    ) : combinedFAQs.length === 0 ? (
                        <p>No FAQs found.</p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Sr. No.</th>
                                        <th>Question</th>
                                        <th>Answer</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {combinedFAQs.map((item, index) => (
                                        <tr
                                            key={
                                                item.isRequest
                                                    ? `request-${item.requestId}`
                                                    : `faq-${item.id}`
                                            }
                                        >
                                            <td>
                                                {item.sr_no ?? index + 1}
                                            </td>

                                            <td>
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            item.question || "",
                                                    }}
                                                />
                                            </td>

                                            <td>
                                                <div
                                                    className="faq-answer-preview"
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            item.answer || "",
                                                    }}
                                                />
                                            </td>

                                            <td>
                                                <span
                                                    className={`approval-status-btn ${getStatusClass(
                                                        item.approvalStatus
                                                    )}`}
                                                >
                                                    {getStatusLabel(
                                                        item.approvalStatus
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                {item.isRequest ? (
                                                    <span>
                                                        Awaiting review
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEdit(item)
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.id
                                                                )
                                                            }
                                                            style={{
                                                                marginLeft: "8px",
                                                            }}
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

export default FAQ;