
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { PiExportBold } from "react-icons/pi";
import RichTextEditor from "../adminComponents/RichTextEditor";
import "react-quill-new/dist/quill.snow.css";
import { IoClose } from "react-icons/io5";
import DOMPurify from "dompurify";

const API_URL = "http://localhost:5000/api/achievements";
const REQUESTS_URL = "http://localhost:5000/api/admin/my-requests";
const ENTITY_TYPE = "achievements";

const achievementTypes = [
    { value: "Faculty", label: "Faculty Achievements" },
    { value: "Student", label: "Student Achievements" },
];

const initialForm = {
    name: "",
    academic_year: "",
    event_category: "",
    competition_activity: "",
    description: "",
};

const AchievementsAdmin = () => {
    const [achievements, setAchievements] = useState([]);
    const [requests, setRequests] = useState([]);

    const [achievementType, setAchievementType] = useState("Faculty");

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [expandedDescriptions, setExpandedDescriptions] = useState({});

    const [preview, setPreview] = useState("");

    const [file, setFile] = useState(null);
    const [existingImage, setExistingImage] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const IMAGE_BASE_URL = "http://localhost:5000/";

    // ================= ADMIN ROLE =================

    const getAdminDetails = () => {
        try {
            return JSON.parse(
                sessionStorage.getItem("adminUser") || "{}"
            );
        } catch {
            return {};
        }
    };

    const isSuperAdmin =
        String(getAdminDetails().role || "")
            .toLowerCase()
            .trim() === "superadmin";

    // ================= AUTH CONFIG =================

    const getAuthConfig = () => {
        const token = sessionStorage.getItem("adminToken");

        if (!token) {
            throw new Error(
                "Your admin session has expired. Please log in again."
            );
        }

        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    };

    // ================= REQUEST HELPERS =================

    const parseRequestData = (data) => {
        if (!data) return {};

        if (typeof data === "object") return data;

        try {
            return JSON.parse(data);
        } catch {
            return {};
        }
    };

    const getRequestData = (request) => {
        const data = parseRequestData(request.proposed_data);

        if (
            data.data &&
            typeof data.data === "object" &&
            !Array.isArray(data.data)
        ) {
            return data.data;
        }

        return data;
    };

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
        const normalized = normalizeStatus(status);

        if (normalized === "pending") return "pending";
        if (normalized === "rejected") return "rejected";
        if (normalized === "approved") return "approved";

        return "published";
    };

    const isCreateOperation = (operation) =>
        ["create", "insert", "add"].includes(
            String(operation || "").toLowerCase().trim()
        );

    // ================= FETCH ACHIEVEMENTS =================

    const fetchAchievements = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}?type=${encodeURIComponent(achievementType)}`
            );

            setAchievements(
                Array.isArray(response.data) ? response.data : []
            );
        } catch (err) {
            console.error("Fetch achievements error:", err);

            setError(
                err.response?.data?.error ||
                "Unable to load achievements. Please try again."
            );

            setAchievements([]);
        } finally {
            setLoading(false);
        }
    }, [achievementType]);

    // ================= FETCH APPROVAL REQUESTS =================

    const fetchRequests = useCallback(async () => {
        try {
            const response = await axios.get(
                REQUESTS_URL,
                getAuthConfig()
            );

            const data = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data?.requests)
                    ? response.data.requests
                    : [];

            setRequests(
                data
                    .filter(
                        (request) =>
                            String(request.entity_type || "")
                                .toLowerCase()
                                .trim() === ENTITY_TYPE
                    )
                    .sort(
                        (a, b) =>
                            Number(b.id || 0) - Number(a.id || 0)
                    )
            );
        } catch (err) {
            console.error(
                "Fetch achievement requests error:",
                err.response?.data || err.message
            );
        }
    }, []);

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // ================= LATEST REQUEST =================

    const getLatestRequest = (recordId) =>
        requests.find(
            (request) =>
                request.record_id != null &&
                String(request.record_id) === String(recordId)
        );

    // ================= PENDING CREATE REQUESTS =================

    const getPendingCreateRequests = () =>
        requests.filter((request) => {
            const status = normalizeStatus(request.status);
            const data = getRequestData(request);

            return (
                data.achievement_type === achievementType &&
                isCreateOperation(request.operation) &&
                ["pending", "rejected"].includes(status)
            );
        });

    // ================= COMBINE RECORDS =================

    const getCombinedAchievements = () => {
        const publishedRows = achievements.map((item) => ({
            ...item,
            rowType: "published",
            approvalRequest: getLatestRequest(item.id),
        }));

        const requestRows = getPendingCreateRequests().map(
            (request) => {
                const data = getRequestData(request);

                return {
                    ...data,
                    id: `request-${request.id}`,
                    requestId: request.id,
                    rowType: "request",
                    approvalRequest: request,
                };
            }
        );

        return [...publishedRows, ...requestRows];
    };

    const displayedAchievements = getCombinedAchievements();

    // ================= FORM HANDLING =================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
        setFile(null);
        setExistingImage("");

        const fileInput = document.getElementById(
            "achievement-image-file"
        );

        if (fileInput) {
            fileInput.value = "";
        }
    };

    const handleTypeChange = (type) => {
        setAchievementType(type);

        resetForm();

        setMessage("");
        setError("");
    };

    // ================= IMAGE HANDLING =================
    const clearPhoto = () => {
        if (preview?.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        setFile(null);
        setExistingImage("");
        setPreview("");

        const input = document.getElementById("achievement-image-file");

        if (input) input.value = "";
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(selectedFile.type)) {
            setError("Only JPG, PNG and WEBP images are allowed.");
            clearPhoto();
            return;
        }

        if (selectedFile.size > 100 * 1024) {
            setError("Image must not exceed 100 KB.");
            clearPhoto();
            return;
        }

        if (preview?.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setError("");
        setMessage("");
    };

    // ================= ADD / UPDATE =================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !form.name.trim() ||
            !form.academic_year.trim() ||
            !form.event_category.trim()
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (editingId === null && !file) {
            setError("Please upload an achievement image.");
            return;
        }

        const formData = new FormData();

        formData.append("achievement_type", achievementType);
        formData.append("name", form.name.trim());
        formData.append("academic_year", form.academic_year.trim());
        formData.append("event_category", form.event_category.trim());
        formData.append(
            "competition_activity",
            form.competition_activity.trim()
        );
        formData.append("description", form.description.trim());

        if (file) {
            formData.append("image", file);
        }

        try {
            setSubmitting(true);
            setMessage("");
            setError("");

            const config = getAuthConfig();

            if (editingId !== null) {
                await axios.put(
                    `${API_URL}/${editingId}`,
                    formData,
                    config
                );

                setMessage(
                    isSuperAdmin
                        ? "Achievement updated successfully."
                        : "Achievement update submitted for approval."
                );
            } else {
                await axios.post(
                    API_URL,
                    formData,
                    config
                );

                setMessage(
                    isSuperAdmin
                        ? "Achievement added successfully."
                        : "Achievement creation submitted for approval."
                );
            }

            resetForm();

            await Promise.all([
                fetchAchievements(),
                fetchRequests(),
            ]);
        } catch (err) {
            console.error("Achievement submission error:", err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                "Unable to save achievement."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ================= EDIT =================

    const handleEdit = (item) => {
        if (item.rowType === "request") return;

        setForm({
            name: item.name || "",
            academic_year: item.academic_year || "",
            event_category: item.event_category || "",
            competition_activity: item.competition_activity || "",
            description: item.description || "",
        });

        setEditingId(item.id);
        setExistingImage(item.image_path || "");
        setFile(null);

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ================= DELETE =================

    const handleDelete = async (id) => {
        const confirmationMessage = isSuperAdmin
            ? "Are you sure you want to delete this achievement?"
            : "Are you sure you want to submit this achievement for deletion approval?";

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        try {
            setMessage("");
            setError("");

            await axios.delete(
                `${API_URL}/${id}`,
                getAuthConfig()
            );

            setMessage(
                isSuperAdmin
                    ? "Achievement deleted successfully."
                    : "Achievement deletion submitted for approval."
            );

            if (String(editingId) === String(id)) {
                resetForm();
            }

            await Promise.all([
                fetchAchievements(),
                fetchRequests(),
            ]);
        } catch (err) {
            console.error("Delete achievement error:", err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Unable to delete achievement."
            );
        }
    };

    // ================= EXPORT CSV =================

    const exportToCSV = () => {
        if (!displayedAchievements.length) {
            setError("No achievements available to export.");
            return;
        }

        const headers = [
            "Sr. No.",
            "Achievement Type",
            "Name",
            "Academic Year",
            "Event/Category",
            "Competition/Activity",
            "Description",
            "Approval Status",
        ];

        const escapeCSV = (value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;

        const rows = displayedAchievements.map((item, index) => [
            index + 1,
            item.achievement_type,
            item.name,
            item.academic_year,
            item.event_category,
            item.competition_activity,
            item.description,
            item.approvalRequest
                ? getStatusLabel(item.approvalRequest.status)
                : "Published",
        ]);

        const csvContent = [
            headers.map(escapeCSV).join(","),
            ...rows.map((row) =>
                row.map(escapeCSV).join(",")
            ),
        ].join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csvContent],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `${achievementType.toLowerCase()}_achievements.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        setError("");
    };

    const selectedTypeLabel =
        achievementTypes.find(
            (type) => type.value === achievementType
        )?.label || "Achievements";

    // ================= IMAGE URL =================
    const getImageUrl = (imagePath) => {
        if (!imagePath) return "";

        if (/^https?:\/\//i.test(imagePath)) {
            return imagePath;
        }

        return `${IMAGE_BASE_URL}${imagePath.replace(/^\/+/, "")}`;
    };

    // ================= DESCRIPTION READ MORE / LESS =================
    const getPlainDescription = (html) => {
        const temp = document.createElement("div");
        temp.innerHTML = html || "";

        return (temp.textContent || temp.innerText || "")
            .replace(/\s+/g, " ")
            .trim();
    };

    const toggleDescription = (id) => {
        setExpandedDescriptions((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };
    // ================= UI =================
    return (
        <div className="admin-page">

            {message && (
                <div className="admin-alert success">
                    {message}
                </div>
            )}

            {error && (
                <div className="admin-alert error">
                    {error}
                </div>
            )}

            <div className="admin-grid">

                {/* ================= FORM ================= */}

                <div className="admin-card">

                    <h2 className="card-title">
                        {editingId !== null
                            ? "Edit Achievement"
                            : "Add Achievement"}
                    </h2>

                    {/* ACHIEVEMENT TYPE SWITCH */}

                    <div className="switch-btns">

                        {achievementTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                className={`switch-btn ${achievementType === type.value
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    handleTypeChange(type.value)
                                }
                            >
                                {type.label}
                            </button>
                        ))}

                    </div>

                    <form onSubmit={handleSubmit}>

                        <label>
                            Name *

                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Enter faculty/student name"
                                maxLength={255}
                                required
                            />
                        </label>

                        <label>
                            Academic Year *

                            <input
                                type="text"
                                name="academic_year"
                                value={form.academic_year}
                                onChange={handleChange}
                                placeholder="Example: 2025-26"
                                maxLength={50}
                                required
                            />
                        </label>

                        <label>
                            Event / Category *

                            <input
                                type="text"
                                name="event_category"
                                value={form.event_category}
                                onChange={handleChange}
                                placeholder="Enter event or category"
                                maxLength={255}
                                required
                            />
                        </label>

                        <label>
                            Competition / Activity

                            <input
                                type="text"
                                name="competition_activity"
                                value={form.competition_activity}
                                onChange={handleChange}
                                placeholder="Enter competition or activity"
                                maxLength={255}
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
                            value={form.description}
                            onChange={(value) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: value,
                                }))
                            }
                            placeholder="Enter achievement description..."
                        />

                        <label>
                            Achievement Image *

                            <input
                                id="achievement-image-file"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleFileChange}
                            />

                            <small>
                                Maximum size: 100kb.
                            </small>
                        </label>

                        {/* IMAGE PREVIEW */}
                        {(file || existingImage) && (
                            <div className="achievement-image-preview">

                                <p className="achievement-image-preview-title">
                                    <strong>
                                        {file ? "Selected Image Preview" : "Current Image"}
                                    </strong>
                                </p>

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

                                <img
                                    src={
                                        file
                                            ? URL.createObjectURL(file)
                                            : getImageUrl(existingImage)
                                    }
                                    alt="Achievement preview"
                                    className="achievement-preview-img"
                                />

                            </div>
                        )}

                        {/* ROLE-BASED SUBMIT BUTTON */}

                        <button
                            className="form-btn"
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Saving..."
                                : editingId !== null
                                    ? isSuperAdmin
                                        ? "Update Achievement"
                                        : "Submit Update for Approval"
                                    : isSuperAdmin
                                        ? "Add Achievement"
                                        : "Submit for Approval"}
                        </button>

                        {editingId !== null && (
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

                {/* ================= RECORDS TABLE ================= */}

                <div className="admin-card">

                    <div className="export-delete">

                        <h2 className="card-title">
                            {selectedTypeLabel}
                        </h2>

                    </div>

                    <div className="excel-upload-row">

                        <button
                            type="button"
                            className="export-btn"
                            onClick={exportToCSV}
                            disabled={
                                loading ||
                                displayedAchievements.length === 0
                            }
                        >
                            Export Data
                            <PiExportBold
                                style={{ fontSize: "20px" }}
                            />
                        </button>

                    </div>

                    <div style={{ marginBottom: "15px" }}>

                        <p className="excel-note">
                            Selected Section:{" "}
                            <strong>{selectedTypeLabel}</strong>
                            <br />
                            Total Records:{" "}
                            <strong>{achievements.length}</strong>
                        </p>

                    </div>

                    {loading ? (
                        <p>Loading achievements...</p>
                    ) : displayedAchievements.length === 0 ? (

                        <p>No achievement records found.</p>

                    ) : (

                        <div className="admin-table-wrapper">

                            <table className="admin-table">

                                <thead>
                                    <tr>
                                        <th>Sr. No.</th>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Academic Year</th>
                                        <th>Event / Category</th>
                                        <th>Competition / Activity</th>
                                        <th>Description</th>
                                        <th>Approval Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {displayedAchievements.map((item, index) => {

                                        const status =
                                            item.approvalRequest?.status || "published";

                                        return (

                                            <tr
                                                key={
                                                    item.rowType === "request"
                                                        ? `request-${item.requestId}`
                                                        : `achievement-${item.id}`
                                                }
                                            >

                                                <td>{index + 1}</td>

                                                <td>
                                                    {item.image_path ? (
                                                        <img
                                                            src={getImageUrl(item.image_path)}
                                                            alt={item.name || "Achievement"}
                                                            style={{
                                                                width: "75px",
                                                                height: "60px",
                                                                objectFit: "cover",
                                                                borderRadius: "6px",
                                                            }}
                                                        />
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>

                                                <td>{item.name || "-"}</td>

                                                <td>
                                                    {item.academic_year || "-"}
                                                </td>

                                                <td>
                                                    {item.event_category || "-"}
                                                </td>

                                                <td>
                                                    {item.competition_activity || "-"}
                                                </td>

                                                {/* DESCRIPTION */}
                                                <td>
                                                    {item.description ? (
                                                        <div className="achievement-description">
                                                            {(() => {
                                                                const plainText = getPlainDescription(item.description);
                                                                const words = plainText.split(/\s+/).filter(Boolean);

                                                                const isExpanded = !!expandedDescriptions[item.id];
                                                                const hasMore = words.length > 25;

                                                                return (
                                                                    <>
                                                                        {isExpanded ? (
                                                                            <div
                                                                                className="achievement-description-full"
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: DOMPurify.sanitize(
                                                                                        item.description || ""
                                                                                    ),
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <p className="achievement-description-preview">
                                                                                {words.slice(0, 25).join(" ")}
                                                                                {hasMore ? "..." : ""}
                                                                            </p>
                                                                        )}

                                                                        <button
                                                                            type="button"
                                                                            id="read-more-btn"
                                                                            onClick={() => toggleDescription(item.id)}
                                                                        >
                                                                            {isExpanded ? "Read Less" : "Read More"}
                                                                        </button>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`approval-status-btn ${getStatusClass(status)}`}
                                                    >
                                                        {getStatusLabel(status)}
                                                    </span>
                                                </td>

                                                <td>

                                                    <div className="table-actions">

                                                        {item.rowType === "request" ? (

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
                                                                        handleDelete(item.id)
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>

                                                        )}

                                                    </div>

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

export default AchievementsAdmin;
