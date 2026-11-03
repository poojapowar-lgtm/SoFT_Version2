import React, { useEffect, useState } from "react";
import CountUp from "./CountUp";
import axios from "axios";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FaNewspaper, FaUsers, FaUserTie } from "react-icons/fa";
import {
  PiCalendarCheckFill,
  PiStudentFill,
  PiDotsThreeOutlineFill,
} from "react-icons/pi";
import { TbMailFilled, TbMessageCircle } from "react-icons/tb";
import { MdSchool, MdScience, MdHandshake } from "react-icons/md";
import { GiGraduateCap } from "react-icons/gi";
import { BsBuildingFillCheck } from "react-icons/bs";


const initialCounts = {
  academics: {
    members: 0,
    faculty: 0,
    mou: 0,
    academicCalendar: 0,
    studentGrievance: 0,
    faq: 0,
  },
  examination: {
    news: 0,
    examinationSchedule: 0,
  },
  placement: {
    placedStudents: 0,
    recruiters: 0,
  },
  alumni: {
    alumniStartup: 0,
    studentSpeak: 0,
  },
  research: {
    research: 0,
    patentPublication: 0,
    fundedResearch: 0,
    consultancyProjects: 0,
  },
  other: {
    events: 0,
    testimonials: 0,
    enquiries: 0,
  },
};


const AdminPanel = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState(initialCounts);
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("adminToken");

        if (!token) {
          window.location.replace("/admin/secure-soft");
          return;
        }

        const res = await axios.get(
          "http://localhost:5000/api/admin/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );



        const data = res.data || {};


        setCounts({
          academics: {
            members: data.members ?? 0,
            faculty: data.faculty ?? 0,
            mou: data.mou ?? 0,
            academicCalendar: data.academicCalendar ?? 0,
            studentGrievance: data.studentGrievance ?? 0,
            faq: data.faq ?? 0,
          },
          examination: {
            news: data.news ?? 0,
            examinationSchedule: data.examinationSchedule ?? 0,
          },
          placement: {
            placedStudents: data.placedStudents ?? 0,
            recruiters: data.recruiters ?? 0,
          },
          alumni: {
            alumniStartup: data.alumniStartup ?? 0,
            studentSpeak: data.studentSpeak ?? 0,
          },
          research: {
            research: data.research ?? 0,
            patentPublication: data.patentPublication ?? 0,
            fundedResearch: data.fundedResearch ?? 0,
            consultancyProjects: data.consultancyProjects ?? 0,
          },
          other: {
            events: data.events ?? 0,
            testimonials: data.testimonials ?? 0,
            enquiries: data.enquiries ?? 0,
          },
        });



      } catch (err) {
        if (err.response?.status === 401) {
          sessionStorage.removeItem("adminToken");
          sessionStorage.removeItem("adminUser");
          sessionStorage.removeItem("email");

          window.location.replace("/admin/secure-soft");
          return;
        }

        console.error("Failed to fetch dashboard data:", err);
      }
    };

    fetchData();
  }, []);

  // Updated icons mapping
  const dashboardData = [
    {
      title: "Academics",
      items: [
        {
          title: "Total Members",
          count: counts.academics.members,
          icon: <FaUsers />,
          path: "/admin/members",
        },
        {
          title: "Faculty Information",
          count: counts.academics.faculty,
          icon: <FaUserTie />,
          path: "/admin/faculty",
        },
        {
          title: "MOU Data",
          count: counts.academics.mou,
          icon: <MdHandshake />,
          path: "/admin/mou",
        },
        {
          title: "Academic Calendar",
          count: counts.academics.academicCalendar,
          icon: <PiCalendarCheckFill />,
          path: "/admin/academic-calendar",
        },
        {
          title: "Student Grievance",
          count: counts.academics.studentGrievance,
          icon: <PiStudentFill />,
          path: "/admin/student-grievance",
        },
        {
          title: "FAQ's",
          count: counts.academics.faq,
          icon: <TbMessageCircle />,
          path: "/admin/faq",
        },
      ],
    },

    {
      title: "Examination",
      items: [
        {
          title: "Total News",
          count: counts.examination.news,
          icon: <FaNewspaper />,
          path: "/admin/news",
        },
        {
          title: "Examination Schedule",
          count: counts.examination.examinationSchedule,
          icon: <PiCalendarCheckFill />,
          path: "/admin/examination-schedule",
        },
      ],
    },

    {
      title: "Placement",
      items: [
        {
          title: "Placed Students",
          count: counts.placement.placedStudents,
          icon: <GiGraduateCap />,
          path: "/admin/placed-students",
        },
        {
          title: "Recruiters",
          count: counts.placement.recruiters,
          icon: <BsBuildingFillCheck />,
          path: "/admin/recruiters",
        },
      ],
    },

    {
      title: "Alumni",
      items: [
        {
          title: "Alumni Startup",
          count: counts.alumni.alumniStartup,
          icon: <MdSchool />,
          path: "/admin/alumni-startup",
        },
        {
          title: "Student Speak",
          count: counts.alumni.studentSpeak,
          icon: <TbMessageCircle />,
          path: "/admin/student-speak",
        },
      ],
    },

    {
      title: "Research",
      items: [
        {
          title: "Research Data",
          count: counts.research.research,
          icon: <MdScience />,
          path: "/admin/research",
        },
        {
          title: "Patent Publication",
          count: counts.research.patentPublication,
          icon: <MdScience />,
          path: "/admin/patent-publication",
        },
        {
          title: "Funded Research",
          count: counts.research.fundedResearch,
          icon: <MdScience />,
          path: "/admin/funded-research",
        },
        {
          title: "Consultancy Projects",
          count: counts.research.consultancyProjects,
          icon: <MdHandshake />,
          path: "/admin/consultancy-projects",
        },
      ],
    },

    {
      title: "Other",
      items: [
        {
          title: "Total Events",
          count: counts.other.events,
          icon: <PiCalendarCheckFill />,
          path: "/admin/events",
        },
        {
          title: "Total Testimonials",
          count: counts.other.testimonials,
          icon: <TbMessageCircle />,
          path: "/admin/testimonials",
        },
        {
          title: "Total Enquiries",
          count: counts.other.enquiries,
          icon: <TbMailFilled />,
          path: "/admin/enquiry",
        },
      ],
    },
  ];



  return (
    <div className="admin-page">
      <div className="dashboard-sections">
        {dashboardData.map((section, sectionIndex) => {
          const isExpanded = !!expandedSections[section.title];
          const visibleItems = isExpanded
            ? section.items
            : section.items.slice(0, 2);

          return (
            <section
              className={`dashboard-section-card ${isExpanded ? "expanded" : ""
                }`}
              key={section.title}
              style={{ "--section-index": sectionIndex }}
            >
              <div className="section-card-header">
                <div className="section-heading">
                  <span className="section-index">
                    {String(sectionIndex + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <h2>{section.title}</h2>
                    <p>
                      Manage your {section.title.toLowerCase()} modules
                    </p>
                  </div>
                </div>

                <span className="section-module-count">
                  {String(section.items.length).padStart(2, "0")}
                  <span> Modules</span>
                </span>
              </div>

              <div className="section-module-list">
                {visibleItems.map((item) => (
                  <button
                    type="button"
                    className="section-module"
                    key={item.path}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="module-icon">{item.icon}</span>

                    <span className="module-details">
                      <span className="module-title">{item.title}</span>
                      <span className="module-description">
                        View and manage records
                      </span>
                    </span>

                    <span className="module-count">
                      <CountUp value={Number(item.count) || 0} />
                    </span>

                    <span className="module-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                ))}
              </div>


              <div className="section-card-footer">
                <span className="section-footer-dot" />

                <span className="footer-module-text">
                  {section.items.length} management modules
                </span>

                {section.items.length > 2 && (
                  <button
                    type="button"
                    className="footer-accordion-toggle"
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={isExpanded}
                    aria-label={
                      isExpanded
                        ? `Collapse ${section.title} modules`
                        : `Show all ${section.title} modules`
                    }
                  >
                    <span className="footer-toggle-label">
                      {isExpanded ? "Show less" : "View all"}
                    </span>

                    <span className="footer-accordion-arrow" aria-hidden="true">
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  </button>
                )}
              </div>

            </section>
          );
        })}
      </div>
    </div>
  );

};

export default AdminPanel;
