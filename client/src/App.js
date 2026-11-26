import "./App.css";
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import ScrollToTop from "./Components/ScrollToTop";
import Footer from "./Components/Footer/Footer";
import Header from "./Components/header/Header";
const MainRoutes = lazy(() => import("./Routes/MainRoutes"));
const StudentGrievance = lazy(
  () => import("./admin/adminPages/StudentGrievance")
)


const Login = lazy(() => import("./admin/adminComponents/Login"));
const AdminRoute = lazy(() => import("./admin/AdminRoute"));
const ActivityLog = lazy(() => import("./admin/adminComponents/ActivityLog"));
// Admin — lazy loaded (not part of public site)
const UserManagement = lazy(
  () => import("./admin/adminComponents/UserManagement")
);

const PendingApprovals = lazy(
  () => import("./admin/adminComponents/PendingApprovals")
);

const AdminLayout = lazy(() => import("./admin/adminComponents/AdminLayout"));
const Dashboard = lazy(() => import("./admin/adminComponents/Dashboard"));

const News = lazy(() => import("./admin/adminPages/News"));
const Events = lazy(() => import("./admin/adminPages/Events"));
const UpcomingEventsAdmin = lazy(() => import("./admin/adminPages/UpcomingEventsAdmin"));
const EnquiryTable = lazy(() => import("./admin/adminPages/EnquiryTable"));
const Members = lazy(() => import("./admin/adminPages/Members"));
const StudentSpeakAdmin = lazy(() => import("./admin/adminPages/StudentSpeakAdmin"));
const TestimonialsAdmin = lazy(() => import("./admin/adminPages/TestimonialsAdmin"));
const RecruitersAdmin = lazy(() => import("./admin/adminPages/RecruitersAdmin"));
const FacultyAdmin = lazy(() => import("./admin/adminPages/FacultyAdmin"));
const ResearchAdmin = lazy(() => import("./admin/adminPages/ResearchAdmin"));
const MOUAdmin = lazy(() => import("./admin/adminPages/MOUAdmin"));
const PlacedStudentsAdmin = lazy(() => import("./admin/adminPages/PlacedStudentsAdmin"));
const AlumniStartupAdmin = lazy(() => import("./admin/adminPages/AlumniStartupAdmin"));
const ContactTable = lazy(() => import("./admin/adminPages/ContactTable"));

const PatentPublicationAdmin = lazy(() => import("./admin/adminPages/PatentPublicationAdmin"));
const FundedResearchAdmin = lazy(() => import("./admin/adminPages/FundedResearchAdmin"));
const ConsultancyProjectsAdmin = lazy(() => import("./admin/adminPages/ConsultancyProjectsAdmin"));
const ExaminationScheduleAdmin = lazy(() => import("./admin/adminPages/ExaminationScheduleAdmin"));

const AcademicCalendarAdmin = lazy(() => import("./admin/adminPages/AcademicCalendarAdmin"));
const FAQAdmin = lazy(() => import("./admin/adminPages/FAQAdmin"));

const AchievementsAdmin = lazy(() => import("./admin/adminPages/AchievementsAdmin"));




const Fallback = () => (
  <div style={{ textAlign: "center", padding: "60px 20px", color: "#006400" }}>
    Loading...
  </div>
);

function App() {
  return (
    <HelmetProvider>

      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >

        <ScrollToTop />
        <Suspense fallback={<Fallback />}>
          <Routes>
            {/* PUBLIC WEBSITE */}
            <Route
              path="/*"
              element={
                <div className="App">
                  <Header />

                  <Suspense fallback={<Fallback />}>
                    <MainRoutes />
                  </Suspense>

                  <Footer />
                </div>
              }
            />

            {/* ADMIN LOGIN */}
            <Route path="/admin/secure-soft" element={<Login />} />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="news" element={<News />} />
              <Route path="events" element={<Events />} />
              <Route path="upcoming-events" element={<UpcomingEventsAdmin />} />
              <Route path="enquiry" element={<EnquiryTable />} />
              <Route path="members" element={<Members />} />
              <Route path="student-speak" element={<StudentSpeakAdmin />} />
              <Route path="testimonials" element={<TestimonialsAdmin />} />
              <Route path="recruiters" element={<RecruitersAdmin />} />
              <Route path="faculty" element={<FacultyAdmin />} />
              <Route path="research" element={<ResearchAdmin />} />
              <Route path="mou" element={<MOUAdmin />} />
              <Route path="placed-students" element={<PlacedStudentsAdmin />} />
              <Route path="alumni-startup" element={<AlumniStartupAdmin />} />
              <Route path="contact" element={<ContactTable />} />

              <Route path="patent-publication" element={<PatentPublicationAdmin />} />
              <Route path="funded-research" element={<FundedResearchAdmin />} />
              <Route path="consultancy-projects" element={<ConsultancyProjectsAdmin />} />
              <Route path="examination-schedule" element={<ExaminationScheduleAdmin />} />

              <Route path="academic-calendar" element={<AcademicCalendarAdmin />} />
              <Route path="faq" element={<FAQAdmin />} />
              <Route path="student-grievance" element={<StudentGrievance />} />

              <Route path="achievements" element={<AchievementsAdmin />} />

              {/* Superadmin-only adminPages */}
              <Route
                path="user-management"
                element={
                  <AdminRoute allowedRoles={["superadmin"]}>
                    <UserManagement />
                  </AdminRoute>
                }
              />

              <Route
                path="pending-approvals"
                element={
                  <AdminRoute allowedRoles={["superadmin"]}>
                    <PendingApprovals />
                  </AdminRoute>
                }
              />

              {/* Superadmin-only Activity Logs */}
              <Route
                path="activity-logs"
                element={
                  <AdminRoute allowedRoles={["superadmin"]}>
                    <ActivityLog />
                  </AdminRoute>
                }
              />
            </Route>

          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider >
  );
}

export default App;
