import React, { useState } from "react";
import { RiArrowDownSLine } from "react-icons/ri";

const Eligibility = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };


    const eligibilityData = [
        // B.Tech. (Food Technology)
        {
            title: "B.Tech. (Food Technology)",
            duration: "4 Years",
            intake: "120",
            eligibility: [
                `The candidate should have passed the 10+2 examination from a recognized board with any of the following subjects: Physics, Mathematics, Chemistry, Computer Science, Electronics, Information Technology, Biology, Informatics Practices, Biotechnology, Technical Vocational Subject, Agriculture, Engineering Graphics, Business Studies, or Entrepreneurship. The candidate must have obtained a minimum of 45% marks in the subjects taken together for General/Open category candidates.`,

                `A relaxation of 5% in the minimum qualifying marks shall be applicable to candidates belonging to Reserved Categories, Economically Weaker Sections (EWS), and Persons with Disabilities (PwD) from the State of Maharashtra.`,

                "OR",

                `The candidate should have passed the D.Voc. stream in the same or an allied sector.`
            ],
            specificRequirement: "Chemistry as a compulsory subject",
            entranceExam: "Valid GATE score or PERA CET score."
        },

        // Direct Second Year B.Tech. (Food Technology)
        {
            title: "Direct Second Year B.Tech. (Food Technology)",
            eligibility: [
                `The candidate should have passed a minimum three-year Diploma or a two-year Diploma (Lateral Entry) examination in any branch of Engineering and Technology from a recognized board, securing at least 45% marks for General/Open category candidates.`,

                "OR",

                `The candidate should have passed a B.Sc. degree from a university recognized by the University Grants Commission (UGC), securing at least 45% marks for General/Open category candidates, and should have passed the 10+2 examination with Mathematics as a subject.`,

                `A relaxation of 5% in the minimum qualifying marks shall be applicable to candidates belonging to Reserved Categories, Economically Weaker Sections (EWS), and Persons with Disabilities (PwD) from the State of Maharashtra.`,

                "OR",

                `The candidate should have passed a B.Voc. or three-year D.Voc. program in the same or an allied sector.`
            ],
            specificRequirement:
                "Diploma in Food Science/Food Technology, or B.Sc./B.Voc. in Food Science, Food Technology, Food Processing Technology, or an allied discipline."
        },

        // M.Tech. (Food Technology)
        {
            title: "M.Tech. (Food Technology)",
            duration: "2 Years",
            intake: "18",
            eligibility: [
                `The candidate should have passed a B.Tech./B.E. in Food Science or Food Technology, or an equivalent four-year degree program in Food Science and Food Technology from a university recognized by the University Grants Commission (UGC), securing a minimum of 50% marks in aggregate or an equivalent grade for General/Open category candidates.`,

                `A relaxation of 5% in the minimum qualifying marks shall be applicable to candidates belonging to Reserved Categories, Economically Weaker Sections (EWS), and Persons with Disabilities (PwD) from the State of Maharashtra.`,

                `Candidates must have a valid GATE score or PERA CET score.`,

                `Eligible candidates shall be required to appear for and qualify in an interview to be included in the admission merit list.`
            ],
            specificRequirement: "B.Tech./B.E. in Food Science or Food Technology",
            entranceExam: "Valid GATE score or PERA CET score."
        },

        // M.Tech. (Food Safety and Quality Management)
        {
            title: "M.Tech. (Food Safety and Quality Management)",
            duration: "2 Years",
            intake: "6",
            eligibility: [
                `The candidate should have passed a four-year bachelor's degree from a university recognized by the University Grants Commission (UGC), securing a minimum of 50% marks for General/Open category candidates in any of the following disciplines: Food Science, Food Technology, Food Process Technology, Food Science and Nutrition, Food Science and Quality Control, Food Process Engineering, Food Processing Technology, Post-Harvest Technology, Biotechnology, Bioengineering, Industrial and Applied Microbiology, or Chemistry. Candidates must also have demonstrated knowledge of Food Science or Food Technology.`,

                `A relaxation of 5% in the minimum qualifying marks shall be applicable to candidates belonging to Reserved Categories, Economically Weaker Sections (EWS), and Persons with Disabilities (PwD) from the State of Maharashtra.`,

                `Eligible candidates shall be required to appear for and qualify in an interview to be included in the admission merit list.`
            ],
            specificRequirement:
                "Demonstrated knowledge of Food Science or Food Technology",
            entranceExam: "Valid GATE score or PERA CET score."
        },

        // M.Tech. (Food Technology) - Working Professionals
        {
            title: "M.Tech. (Food Technology) (Working Professionals)",
            duration: "2 Years",
            intake: "12",
            eligibility: [
                `The candidate should have passed a four-year bachelor's degree or a full-time M.Sc. degree from a university recognized by the University Grants Commission (UGC), securing a minimum of 50% marks in aggregate or an equivalent Grade 'B' on the UGC 10-point scale (or an equivalent grade under another grading system) in any of the following disciplines: Food Science, Food Technology, Food Process Technology, Biotechnology, Bioengineering, Food Science and Nutrition, Food Science and Quality Control, Food Process Engineering, Food Processing Technology, Post-Harvest Technology, Industrial and Applied Microbiology, or Chemistry. Candidates must also have demonstrated knowledge of Food Science or Food Technology.`,

                `The candidate should have a minimum of one year of full-time, regular work experience in a relevant field, acquired from a registered government or autonomous organization, company, educational institution, industry, or firm.`,

                `A relaxation of 5% in the minimum qualifying marks shall be applicable to candidates belonging to Reserved Categories, Economically Weaker Sections (EWS), and Persons with Disabilities (PwD) from the State of Maharashtra.`,

                `Shortlisted candidates shall be required to appear for and qualify in a personal interview to be included in the final admission merit list.`
            ],
            entranceExam: "Valid GATE score or PERA CET score."
        },

        // Ph.D. (Food Technology)
        {
            title: "Ph.D. (Food Technology)",
            duration: "3 Years (Full Time)",
            intake: "As per Vacancy",
            eligibility: [
                `Candidates should hold a master's degree in Food Science or Food Technology, following a four-year B.Tech. or equivalent degree program, with a minimum of 70% marks in aggregate or an equivalent Grade 'B' on the UGC 10-point scale (or an equivalent grade under another grading system).`,

                "OR",

                `Candidates appearing for the final year or final semester of their postgraduate degree may also be eligible to participate in the admission process, subject to fulfilling the minimum eligibility criteria in their final results.`,

                "OR",

                `Candidates seeking admission after completing a four-year/eight-semester bachelor's degree with research should have a minimum CGPA of 7.5 on a 10-point scale. Candidates who have qualified NET/JRF/GATE will be preferred.`,

                "OR",

                `Candidates who have completed M.Phil. coursework with at least 55% marks in aggregate or an equivalent Grade 'B' on the UGC 10-point scale shall be eligible, subject to the applicable regulations. Candidates holding an equivalent degree from a foreign institution must have obtained it from an institution accredited by an assessment and accreditation agency approved, recognized, or authorized by the relevant authority in its home country to assess, accredit, or assure the quality and standards of educational institutions.`,

                `In-service candidates under a Faculty Improvement Programme from state or central government organizations, industry, or academic institutions may be considered based on their experience and area of interest. Selection shall be based on an interview/viva voce for candidates qualifying through JRF/NET. For candidates who qualify through the entrance test, selection shall be evaluated in the ratio of 70:30, with 70% weightage for the written test and 30% for the interview. Separate merit lists shall be published for the two categories.`
            ],
            entranceExam: "Valid GATE score or PERA CET score."
        }
    ];


    return (

        <div>
            <h2 className="innerpage-title">Eligibility Criteria</h2>
            <div className="accordion-container">
                {eligibilityData.map((item, index) => (
                    <div key={index} className="accordion-item">

                        <div
                            className={`faq-header ${activeIndex === index ? "active" : ""}`}
                            onClick={() => toggleAccordion(index)}
                        >
                            <h4 className="accordion-title">{item.title}</h4>
                            <span className="faq-icon">
                                <RiArrowDownSLine />
                            </span>
                        </div>

                        {activeIndex === index && (
                            <div className="accordion-content">
                                <div className="accordion-content-wrapper">

                                    {/* Duration & Intake */}
                                    {(item.duration || item.intake) && (
                                        <p>
                                            {item.duration && <><strong>Duration :</strong> {item.duration}</>}
                                            {item.intake && <> | Intake Capacity: {item.intake}</>}
                                        </p>
                                    )}

                                    {/* Eligibility */}
                                    {item.eligibility && (
                                        <>
                                            <p><strong>Eligibility criteria:</strong></p>
                                            {item.eligibility.map((point, i) => (
                                                <p key={i}>{point}</p>
                                            ))}
                                        </>
                                    )}

                                    {/* Specific Requirement */}
                                    {item.specificRequirement && (
                                        <p>
                                            <strong>Specific requirement : </strong>
                                            {item.specificRequirement}
                                        </p>
                                    )}

                                    {/* Entrance Exam */}
                                    {item.entranceExam && (
                                        <p>
                                            <strong>Entrance Exam (If any) : </strong>
                                            {item.entranceExam}
                                        </p>
                                    )}

                                </div>
                            </div>
                        )}

                    </div>
                ))}
            </div>
        </div>
    );
};

export default Eligibility;





