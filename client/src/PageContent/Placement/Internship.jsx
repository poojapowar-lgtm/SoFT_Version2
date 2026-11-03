import React from "react";
import { ImArrowDown } from "react-icons/im";

const stepsData = [
    {
        title: "Step 1: Internship Planning as per the Academic Schedule",
        points: [
            "As per the approved academic curriculum, final-year (Semester VII) B.Tech. Food Technology students are permitted to undertake a four-month industrial internship.",
        ],
    },
    {
        title: "Step 2: Industry Identification & Internship Permission",
        points: [
            "The Training & Placement Cell formally contacts relevant food processing industries through official email to seek permission for industrial internships for students.",
        ],
    },
    {
        title: "Step 3: Confirmation from the Industry",
        points: [
            "Internship slots, duration, domain, mentor details, and terms are finalized after confirmation is received from the industry.",
        ],
    },
    {
        title: "Step 4: Mapping Student Preferences by Domain",
        points: [
            "Students are assigned internships based on their domain preferences, such as Quality Assurance/Quality Control (QA/QC), Research & Development (R&D), Production, Food Safety, and Regulatory Affairs.",
        ],
    },
    {
        title: "Step 5: Student & Parent Undertaking",
        points: [
            "Before the internship begins, undertaking forms are collected from students and their parents to confirm compliance with institute and industry guidelines.",
        ],
    },
    {
        title: "Step 6: Commencement of the Industrial Internship",
        points: [
            "Students are assigned to the designated food industries to gain hands-on experience and enhance their practical knowledge and professional skills.",
        ],
    },
    {
        title: "Step 7: Monthly Progress Reporting",
        points: [
            "Students are required to submit monthly progress reports detailing their assigned work, activities, and learning outcomes throughout the internship.",
        ],
    },
    {
        title: "Step 8: Industry Mentorship & Monitoring",
        points: [
            "Each student works under the guidance of an industry mentor or supervisor who monitors the student's performance and skill development.",
        ],
    },
    {
        title: "Step 9: Submission of the Assessment Sheet",
        points: [
            "At the end of the internship, students must submit an assessment sheet.",
            "50% of the evaluation is conducted by the industry mentor or authorized industry representative.",
            "The remaining 50% is evaluated internally in accordance with academic requirements.",
        ],
    },
    {
        title: "Step 10: Submission of the Industrial Internship Report",
        points: [
            "Students must submit a detailed report covering the four-month internship, including their work profile, projects undertaken, skills acquired, and learning outcomes.",
        ],
    },
    {
        title: "Step 11: Internship Completion & Certification",
        points: [
            "Internship completion certificates are collected from the respective industries.",
        ],
    },
    {
        title: "Step 12: Internship-to-Placement Opportunities",
        points: [
            "Depending on their performance and evaluation, some students may receive job offers from the same industry upon completion of the internship.",
        ],
    },
];


const Internship = () => {
    return (
        <div className="internship-section">
            <h2 className="innerpage-title">Internship Policy (Food Industry Internship Process)</h2>
            <div className="timeline">
                {stepsData.map((step, index) => (
                    <div key={index} className="timeline-item">

                        <div className="internship-card">
                            <h3 className="internship-title">{step.title}</h3>
                            <ul>
                                {step.points.map((point, i) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                        </div>


                        {/* Arrow - not after last item */}
                        {/* {index !== stepsData.length - 1 && (

                        )} */}
                        <div className="arrow">
                            <ImArrowDown />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Internship;