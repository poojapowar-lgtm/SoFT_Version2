
import { logActivity } from "../utils/activityLogger.js";

const getModuleName = (url = "") => {
  const path = url.split("?")[0];

  const parts = path.split("/").filter(Boolean);

  // Remove api and admin prefixes
  const moduleName = parts[2] || "System";

  return moduleName
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
};

const getAction = (method) => {
  switch (method) {
    case "GET":
      return "VIEW";
    case "POST":
      return "CREATE";
    case "PUT":
    case "PATCH":
      return "UPDATE";
    case "DELETE":
      return "DELETE";
    default:
      return "OTHER";
  }
};

const activityAudit = (req, res, next) => {
  const excludedPaths = [
    "/api/admin/activity-logs"
  ];

  if (excludedPaths.some(path =>
    req.originalUrl.startsWith(path)
  )) {
    return next();
  }

  const startTime = Date.now();

  res.on("finish", async () => {
    try {
      const status = res.statusCode;

      const moduleName = getModuleName(req.originalUrl);

      const action = getAction(req.method);

      await logActivity(req, {
        module: moduleName,
        action,
        description:
          `${action} request in ${moduleName}`,
        responseStatus: status
      });

    } catch (error) {
      console.error("Audit middleware error:", error);
    }
  });

  next();
};

export default activityAudit;
