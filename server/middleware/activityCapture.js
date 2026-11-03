
const db = require("../config/db");

const MODULE_NAMES = {
    news: "News",
    events: "Events",
    enquiry: "Student Enquiries",
    members: "Members",
    "student-speak": "Student Speak",
    recruiters: "Recruiters",
    faculty: "Faculty",
    research: "Research",
    mou: "MOU",
    "placed-students": "Placed Students",
    "alumni-startup": "Alumni Startup",
    contact: "Contact",
    testimonials: "Testimonials",
    visitors: "Visitors",
    "patent-publications": "Patent Publications",
    "funded-research": "Funded Research",
    "consultancy-projects": "Consultancy Projects",
    "examination-schedule": "Examination Schedule",
    "academic-calendar": "Academic Calendar",
    faqs: "FAQs",
    "student-grievance": "Student Grievance",
    admin: "Admin Management",
};

function getAction(req, statusCode) {
    const url = req.originalUrl.toLowerCase();

    if (url.includes("/approve")) return "APPROVE";
    if (url.includes("/reject")) return "REJECT";
    if (url.includes("upload-excel")) return "EXCEL_UPLOAD";
    if (url.includes("export")) return "EXPORT";
    if (statusCode === 202) return "SUBMIT_FOR_APPROVAL";

    switch (req.method.toUpperCase()) {
        case "POST": return "CREATE";
        case "PUT":
        case "PATCH": return "UPDATE";
        case "DELETE": return "DELETE";
        default: return "UNKNOWN";
    }
}
module.exports = (req, res, next) => {
    const method = req.method.toUpperCase();

    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        return next();
    }

    if (
        req.originalUrl.startsWith("/api/auth") ||
        req.originalUrl.startsWith("/api/activity-logs")
    ) {
        return next();
    }

    res.on("finish", () => {
        if (res.statusCode < 200 || res.statusCode >= 400) {
            return;
        }

        const admin = req.admin;

        // Do not record requests that have no authenticated admin.
        if (!admin) return;

        const apiPath = req.originalUrl.split("?")[0];
        const segments = apiPath.split("/").filter(Boolean);

        const moduleKey = segments[1] || "system";
        const moduleName = MODULE_NAMES[moduleKey] || moduleKey;

        const action = getAction(req, res.statusCode);

        const recordId =
            req.params?.id ||
            req.params?.recordId ||
            null;

        const description =
            `${admin.email} performed ${action} in ${moduleName}`;

        db.query(
            `INSERT INTO admin_activity_logs (
        admin_id,
        admin_name,
        admin_email,
        admin_role,
        module,
        action,
        description,
        request_method,
        request_url,
        record_id,
        ip_address,
        user_agent,
        response_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                admin.id,
                admin.name || admin.username || admin.email || "Unknown Admin",
                admin.email || null,
                admin.role || "admin",
                moduleName,
                action,
                description,
                method,
                apiPath.slice(0, 500),
                recordId !== null ? String(recordId) : null,
                req.ip || null,
                req.get("user-agent") || null,
                res.statusCode,
            ],
            (err) => {
                if (err) {
                    console.error("Activity capture error:", err.message);
                }
            }
        );
    });

    next();
};
