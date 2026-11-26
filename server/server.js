const express = require("express");
const cors = require("cors");
const compression = require("compression");
require("dotenv").config();

const verifyAdmin = require("./middleware/verifyAdmin");

const app = express();

// ── Gzip compression for all responses ──────────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));

app.use(express.json());
app.use(cors());

// ── Static files with cache headers ─────────────────────────────────────────
// Uploaded images/docs: cache 7 days (content-addressed by timestamp prefix)
app.use("/uploads", express.static("uploads", {
  maxAge: "7d",
  etag: true,
  lastModified: true,
}));

// Public assets (sitemap, robots): short cache
app.use(express.static("public", {
  maxAge: "1h",
  etag: true,
}));

// Dynamic sitemap — serves pre-generated sitemap.xml from public/
// Regenerate on demand (max once per hour) to reflect latest DB content
let lastSitemapGen = 0;
app.get("/sitemap.xml", (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const sitemapPath = path.join(__dirname, "public", "sitemap.xml");
  const ONE_HOUR = 60 * 60 * 1000;

  const regenerate = () => {
    try {
      require("child_process").fork(path.join(__dirname, "generateSitemap.js"));
      lastSitemapGen = Date.now();
    } catch (e) {
      console.error("Sitemap regen error:", e.message);
    }
  };

  if (!fs.existsSync(sitemapPath) || Date.now() - lastSitemapGen > ONE_HOUR) {
    regenerate();
  }

  if (fs.existsSync(sitemapPath)) {
    res.setHeader("Content-Type", "application/xml");
    return res.sendFile(sitemapPath);
  }

  res.status(503).send("Sitemap not yet available. Try again shortly.");
});

// ── Cache headers for public read-only API responses ─────────────────────────
// Applied only to GET requests on public routes (not admin/auth/write ops)
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/admin") && !req.path.startsWith("/api/auth")) {
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }
  next();
});

// Centralized activity capture
app.use("/api", require("./middleware/activityCapture"));

// Public authentication route (login)
app.use("/api/auth", require("./routes/auth"));

// Admin routes: require a valid admin JWT
app.use(
  "/api/admin",
  verifyAdmin,
  require("./routes/admin")
);

// Other routes.
// Protect admin-only handlers inside these route files.
app.use("/api/news", require("./routes/news"));
app.use("/api/events", require("./routes/events"));
app.use("/api/enquiry", require("./routes/enquiry"));
app.use("/api/members", require("./routes/members"));
app.use("/api/student-speak", require("./routes/studentSpeak"));
app.use("/api/recruiters", require("./routes/recruiters"));
app.use("/api/faculty", require("./routes/faculty"));
app.use("/api/research", require("./routes/research"));
app.use("/api/mou", require("./routes/mou"));
app.use("/api/placed-students", require("./routes/placedStudents"));
app.use("/api/alumni-startup", require("./routes/alumniStartup"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/testimonials", require("./routes/testimonials"));
app.use("/api/visitors", require("./routes/visitors"));

app.use("/api/patent-publications", require("./routes/patentPublications"));
app.use("/api/funded-research", require("./routes/fundedResearch"));
app.use("/api/consultancy-projects", require("./routes/consultancyProjects"));
app.use("/api/examination-schedule", require("./routes/examinationSchedule"));

app.use("/api/academic-calendar", require("./routes/academicCalendar"));
app.use("/api/faqs", require("./routes/faq"));
app.use("/api/student-grievance", require("./routes/studentGrievance"));

app.use("/api/upcoming-events", require("./routes/upcomingEvents"));
app.use("/api/achievements", require("./routes/Achievements"));

app.use(
  "/api/activity-logs",
  verifyAdmin,
  require("./routes/activityLogs")
);


// Health check
app.get("/", (req, res) => {
  res.json({
    status: "Server Running",
    project: "MIT Soft",
    port: process.env.PORT || 5000,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
