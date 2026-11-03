import React, { useState } from "react";
import "../../Pages/board_body.css";
import { RiArrowDownSLine } from "react-icons/ri";

const PlacementCell = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const placementData = [
        {
            title: "1. Identification of Student Interests & Domain Mapping",
            content: (
                <ul className="page-list">
                    <li>
                        Collect domain-wise placement preferences from final-year B.Tech.
                        and M.Tech. Food Technology students, covering industries such as
                        fruit and vegetable processing, bakery and confectionery, dairy
                        processing, spices, meat and poultry processing, wine processing,
                        carbonated beverages, edible oils, rice milling, and other related
                        sectors.
                    </li>
                    <li>
                        Analyze student interests to align industry requirements with
                        students' career goals.
                    </li>
                </ul>
            ),
        },
        {
            title: "2. Recruiter Identification & Job Description Collection",
            content: (
                <>
                    <ul className="page-list">
                        <li>
                            Identify and approach suitable recruiters based on students'
                            domain preferences.
                        </li>
                        <li>Collect complete recruiter details, including:</li>
                    </ul>
                    <ol className="page-list">
                        <li>Organization profile</li>
                        <li>Job title or designation</li>
                        <li>Detailed job description (JD)</li>
                        <li>Eligibility criteria</li>
                        <li>Cost to company (CTC) or stipend</li>
                        <li>Job location and joining details</li>
                    </ol>
                </>
            ),
        },
        {
            title: "3. Placement Drive Approval & Scheduling",
            content: (
                <ul className="page-list">
                    <li>Obtain approval from the competent authorities.</li>
                    <li>Finalize the date, time, venue, and mode (online or offline).</li>
                    <li>Confirm participation with the recruiting organization.</li>
                </ul>
            ),
        },
        {
            title: "4. Uploading Drive Details to the Calyx Pod AI Platform",
            content: (
                <>
                    <ul className="page-list">
                        <li>
                            Upload complete placement drive details to the Calyx Pod AI
                            platform, where students who have registered for placement
                            opportunities can access the information.
                        </li>
                        <li>Ensure that the platform includes:</li>
                    </ul>
                    <ol className="page-list">
                        <li>Company profile</li>
                        <li>Job role and job description</li>
                        <li>Eligibility criteria</li>
                        <li>Placement drive schedule</li>
                        <li>Registration deadline</li>
                    </ol>
                    <ul className="page-list">
                        <li>
                            Enable student registration and track applications digitally.
                        </li>
                    </ul>
                </>
            ),
        },
        {
            title: "5. Student Notification & Registration",
            content: (
                <ul className="page-list">
                    <li>
                        Notify eligible students through official communication channels
                        and the Calyx Pod AI platform.
                    </li>
                    <li>Verify student eligibility and confirm participation.</li>
                </ul>
            ),
        },
        {
            title: "6. Pre-Placement Preparation Activities",
            content: (
                <>
                    <ul className="page-list">
                        <li>Conduct a pre-placement talk (PPT) by the recruiter.</li>
                        <li>Organize preparatory sessions covering:</li>
                        <li>Resume writing tailored to the food industry</li>
                        <li>Group discussion and interview skills</li>
                        <li>Behavioral and soft skills training</li>
                        <li>
                            Technical orientation covering GMP, HACCP, FSSAI, QA/QC, and
                            the fundamentals of research and development (R&D)
                        </li>
                    </ul>
                </>
            ),
        },
        {
            title: "7. Candidate Shortlisting",
            content: (
                <ul className="page-list">
                    <li>Share registered student profiles with the recruiter.</li>
                    <li>
                        Publish the shortlist of candidates through official notices and
                        the placement platform.
                    </li>
                </ul>
            ),
        },
        {
            title: "8. Placement Drive Execution",
            content: (
                <>
                    <ul className="page-list">
                        <li>Coordinate and conduct the selection rounds, which may include:</li>
                    </ul>
                    <ol className="page-list">
                        <li>Aptitude or technical test</li>
                        <li>Group discussion</li>
                        <li>Technical interview</li>
                        <li>HR interview</li>
                    </ol>
                    <ul className="page-list">
                        <li>
                            Provide logistical and administrative support to recruiters
                            throughout the placement drive.
                        </li>
                    </ul>
                </>
            ),
        },
        {
            title: "9. Selection & Offer Communication",
            content: (
                <ul className="page-list">
                    <li>Receive selection results from the recruiter.</li>
                    <li>
                        Communicate final selection results, offer details, and joining
                        information to the selected students.
                    </li>
                </ul>
            ),
        },
        {
            title: "10. Documentation & Reporting",
            content: (
                <>
                    <ul className="page-list">
                        <li>Maintain structured records of:</li>
                        <ol className="page-list">
                            <li>Registered and selected students</li>
                            <li>Offer letters and CTC details</li>
                            <li>Recruiter and student feedback</li>
                        </ol>
                        <li>Submit a consolidated placement report to the institute.</li>
                    </ul>
                </>
            ),
        },
        {
            title: "11. Post-Placement Support & Feedback",
            content: (
                <ul className="page-list">
                    <li>Support students during joining and onboarding.</li>
                    <li>
                        Collect feedback from recruiters and placed students to support
                        continuous improvement.
                    </li>
                </ul>
            ),
        },
    ];

    const coordinatorData = [
        {
            name: "Dr. Balaji N. Jadhav",
            designation: "Placement In-Charge",
            mail: "balaji.jadhav@mituniversity.edu.in",
            contact: "9420090899",
        },
    ];

    return (
        <div className="placement-container">
            <h2 className="innerpage-title">Placement Cell</h2>

            <ul className="page-list">
                <li>
                    A dedicated Training & Placement Cell facilitates internships and
                    final placements through on-campus and virtual recruitment drives.
                </li>
                <li>
                    Students receive training through industry interactions, resume
                    building, aptitude tests, soft skills development, and interview
                    preparation through SCIL.
                </li>
                <li>
                    Placement opportunities are available in production, quality
                    assurance and quality control (QA/QC), research and development
                    (R&D), food safety, regulatory affairs, certification, supply chain
                    management, and National Apprenticeship Promotion Scheme (NAPS)
                    programs.
                </li>
                <li>
                    The School also supports international placement opportunities,
                    industrial training, and internship-to-placement pathways.
                </li>
            </ul>

            <h2 className="innerpage-title">
                Placement Drive Process & Standard Operating Procedure (SOP)
            </h2>

            <div className="accordion-container">
                {placementData.map((item, index) => (
                    <div key={index} className="accordion-item">
                        <div
                            className={`faq-header ${activeIndex === index ? "active" : ""
                                }`}
                            onClick={() => toggleAccordion(index)}
                            role="button"
                            tabIndex={0}
                            aria-expanded={activeIndex === index}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    toggleAccordion(index);
                                }
                            }}
                        >
                            <h4 className="accordion-title">{item.title}</h4>
                            <span className="faq-icon">
                                <RiArrowDownSLine />
                            </span>
                        </div>

                        {activeIndex === index && (
                            <div className="accordion-content-wrapper">
                                <div className="accordion-content">{item.content}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <h2 className="innerpage-title">Placement Coordinator</h2>

            <div className="board-body-container">
                {coordinatorData.map((item, index) => (
                    <div className="board-card" key={index}>
                        <h3 className="board-name">{item.name}</h3>

                        <p style={{ margin: "5px 0" }}>
                            <strong>{item.designation}</strong>
                        </p>

                        <p className="board-desg">
                            <a href={`mailto:${item.mail}`} className="board-link">
                                {item.mail}
                            </a>
                        </p>

                        <p className="board-desg">
                            <a href={`tel:${item.contact}`} className="board-link">
                                {item.contact}
                            </a>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlacementCell;
