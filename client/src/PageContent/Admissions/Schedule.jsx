import React from "react";
import { MdOutlineDone } from "react-icons/md";

const Schedule = () => {

    const admissionFlow = [
        {
            title: "Admission Process",
            desc: [
                "Inform students about the admission date, time, and required documents.",
                "Students must report with their original documents, two sets of photocopies, and scanned copies.",
                "Mark attendance and issue a token.",
                "Conduct an orientation session led by the Admission Committee.",
                "Verify all documents against the original documents.",
                "Verify ERP details and provide assistance with document uploads, if required.",
                "Collect the applicable fees and generate a payment receipt.",
                "Collect the final set of documents and issue an acknowledgement receipt."
            ]
        },
        {
            title: "Roles and Responsibilities",
            desc: [
                "Admission Head: Communicate admission-related information.",
                "Reception Committee: Manage attendance and token distribution.",
                "Chairperson: Conduct the orientation session.",
                "Verification Committee: Verify admission documents.",
                "ERP Coordinator: Provide ERP-related support.",
                "Accounts Department: Collect fees and process payments.",
                "Student Section: Manage document submissions and maintain records.",
                "Registrar/Head of Institute: Approve eligibility and oversee enrolment."
            ]
        },
        {
            title: "Eligibility Verification",
            desc: [
                "Verify academic, identity, and category-related documents.",
                "Issue a deficiency notice if any required documents are missing.",
                "For postgraduate admissions, check the UGC list of fake universities, as applicable."
            ]
        },
        {
            title: "Records to Be Maintained",
            desc: [
                "Admission application forms",
                "Document verification checklists",
                "Deficiency notices",
                "Acknowledgement receipts",
                "Admission records"
            ]
        }
    ];



    return (
        <div>
            <h2 className="innerpage-title">Admission Schedule</h2>

            <div className="future-container">
                <div className="pg-outcomes-container">
                    {admissionFlow.map((section, index) => (
                        <div className="pg-outcomes-item" key={index}>
                            <div className="pg-outcomes-number">{index + 1}</div>

                            <div className="pg-outcomes-card">
                                <h3
                                    className="innerpage-subtitle"
                                    style={{ margin: "0px" }}
                                >
                                    {section.title}
                                </h3>

                                <ul className="page-list">
                                    {section.desc.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                     <div className="pg-outcomes-number"><MdOutlineDone /></div>
                </div>
            </div>



        </div>
    );
};

export default Schedule;
