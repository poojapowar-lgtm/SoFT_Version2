const express = require("express");
const cors = require("cors");
require("dotenv").config();

const verifyAdmin = require("./middleware/verifyAdmin");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/uploads", express.static("uploads"));
app.use(express.static("public"));

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
