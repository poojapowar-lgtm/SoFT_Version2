import React, { useState } from "react";
import { ImArrowDown } from "react-icons/im";
import "./pg_outcomes.css";

const PgOutcomes = () => {
    const [activeTab, setActiveTab] = useState("outcomes");

// Outcomes Data (Array)
const outcomesData = [
  {
    list: [
      {
        title: "Discipline-Specific Knowledge",
        desc: "Enhancement of capabilities through learning the fundamentals and cutting-edge aspects of food technology, with a focus on food science and specialized allied courses.",
      },
      {
        title: "Problem-Solving",
        desc: "Ability to identify, analyse, and resolve problems based on the needs of the food industry and design solutions to complex problems that meet specified requirements while appropriately considering food sustainability.",
      },
      {
        title: "Critical Thinking",
        desc: "Development of the ability to think outside the box and generate solutions to complex problems in unfamiliar contexts to address various challenges.",
      },
      {
        title: "Communication Skills",
        desc: "Development of effective communication skills to convey technical knowledge to stakeholders, including farmers, industry professionals, and society, through face-to-face communication, research and review articles, and social media.",
      },
      {
        title: "Analytical Reasoning and Thinking",
        desc: "Ability to analyse and synthesize data from a variety of sources, draw valid conclusions supported by evidence and examples, and address conflicting viewpoints.",
      },
      {
        title: "Research-Related Skills",
        desc: "Development of students' abilities to plan, conduct, and report the results of experiments, investigations, and projects while incorporating a thought process focused on societal benefits.",
      },
      {
        title: "Multicultural Competence and Inclusive Spirit",
        desc: "Ability to work effectively in multidisciplinary and multicultural teams and contribute to coordinated efforts toward a common goal. This includes gender sensitivity, a gender-neutral approach, empathy for disadvantaged individuals and persons with disabilities, including those with learning disabilities, and respect for diverse cultures to promote an inclusive society.",
      },
      {
        title: "Digital and Technological Skills",
        desc: "Development of technical skills to operate modern and sophisticated equipment, software, and IT tools for developing need-based products and processes.",
      },
      {
        title: "Value Inculcation",
        desc: "Development of well-rounded technologists through the inculcation of life skills and ethical practices. This encourages a human-values-based mindset that applies technological knowledge for human welfare while preserving moral values in every aspect of technology-driven wealth creation.",
      },
      {
        title: "Environment and Sustainability",
        desc: "Awareness of environmental issues related to the food industry, including pollution, climate change, hunger, and malnutrition, and the ability to address them through appropriate food processing, waste management, conservation, and the management of biological resources to support sustainable development.",
      },
      {
        title: "Community Engagement and Service",
        desc: "Enhancement of students' capabilities as food technologists and responsible Indian citizens through participation in community engagement, services, and activities that promote societal well-being.",
      },
      {
        title: "Lifelong Learning",
        desc: "Ability to demonstrate the skills necessary for continuous self-education and independent, lifelong learning in response to technological changes, while developing the capacity to become an entrepreneur.",
      },
    ],
  },
  {
    // subtitle: "Program-Specific Outcomes",
    list: [
      {
        desc: "Comprehensive knowledge of various areas of Food Science and Technology, along with a coherent understanding of food processing, preservation, packaging, storage, and marketing of finished food products to meet industry standards.",
      },
      {
        desc: "Practical knowledge and skills required to resolve industry-related problems, along with the ability to pursue self-employment and develop an entrepreneurial mindset for a successful professional career in Food Technology.",
      },
      {
        desc: "Development of the skills and attitudes required to contribute effectively to the processing, packaging, and preservation of food products through a multidisciplinary approach while ensuring food safety and quality.",
      },
      {
        desc: "Ability to apply critical thinking and scientific principles to address societal needs through the development of next-generation and value-added food products.",
      },
    ],
  },
];


// Table Data (Array)
const tableData = [
  {
    headers: [
      "Program Outcome No.",
      "Program Outcome Description",
      "Needs",
    ],
    rows: [
      {
        outcome: "PO1 - Discipline-Specific Knowledge",
        desc: "Development of students' knowledge in Food Science and Technology, with special emphasis on strengthening their understanding of mathematics, science, engineering, management, and specialized food science courses. This knowledge enables them to address complex food technology challenges and formulate innovative, need-based processed food products.",
        needs: "Global",
      },
      {
        outcome: "PO2 - Problem Analysis and Solution",
        desc: "Development of students' ability to identify demand- and supply-based market trends through literature reviews, formulate innovative ideas, verify conclusions through appropriate scaling, and apply mathematical, scientific, and engineering principles.",
        needs: "National",
      },
      {
        outcome: "PO3 - Design and Development of Solutions",
        desc: "Enhancement of students' design capabilities to develop creative solutions to problems faced by the food industry. This includes introducing innovative food technology concepts and developing consumer-oriented food products in accordance with applicable food safety regulations, while considering cultural, societal, and environmental factors.",
        needs: "Regional",
      },
      {
        outcome: "PO4 - Conducting Investigations of Complex Problems",
        desc: "Development of students' ability to conduct independent applied research, design appropriate experimental setups, effectively use analytical tools, and interpret data to synthesize information and draw valid conclusions.",
        needs: "Local",
      },
      {
        outcome: "PO5 - Modern Tool Usage",
        desc: "Encouragement of students to develop the skills required to operate modern and sophisticated equipment, software, and IT tools for food formulation prediction and modelling. Students also learn to understand the limitations of these tools and their role in complying with food safety regulations.",
        needs: "National",
      },
      {
        outcome: "PO6 - Food Technologists and Society",
        desc: "Development of students as responsible food technologists and Indian citizens who understand the importance of food quality and sustainability in promoting a healthy society. Students also develop knowledge of recent technologies and the ability to consider others' viewpoints, mediate conflicts, and reach conclusions through teamwork.",
        needs: "National",
      },
      {
        outcome: "PO7 - Ethics",
        desc: "Development of students' ethical practices and values, encouraging the application of technological knowledge for human welfare while preserving moral principles in decisions related to process and product development.",
        needs: "Local",
      },
      {
        outcome: "PO8 - Environment and Sustainability",
        desc: "Development of entrepreneurial skills, expertise, and an innovative mindset among students to address global environmental changes through food technology innovations, particularly in the food processing sector, while promoting long-term sustainability.",
        needs: "Global",
      },
      {
        outcome: "PO9 - Communication",
        desc: "Holistic development of students, with particular emphasis on enhancing communication skills to convey scientific and technical knowledge to stakeholders, including farmers, industry professionals, and society. This is achieved through social media, articles, blogs, face-to-face communication, and research and review publications.",
        needs: "Regional",
      },
      {
        outcome: "PO10 - Individual and Teamwork",
        desc: "Development of students' leadership and coordination skills to manage internal and external research projects and encourage multidisciplinary collaboration.",
        needs: "Regional",
      },
      {
        outcome: "PO11 - Lifelong Learning",
        desc: "Development of students' capacity for continuous learning as next-generation food technologists through self-motivation and innovative technologies, enabling them to respond effectively to emerging challenges, including pandemic situations, through robust food technology solutions.",
        needs: "National",
      },
      {
        outcome: "PO12 - Startup Skills and Management",
        desc: "Holistic development of students' entrepreneurial capabilities to initiate skill-based startups and manage them effectively through an efficient management framework.",
        needs: "Local",
      },
    ],
  },
];


    return (
        <div className="pg-container">
            <h2 className="innerpage-title">Programme Outcomes</h2>
            {/* Buttons */}
            <div className="tab-buttons">
                <button
                    className={`btn ${activeTab === "outcomes" ? "active" : ""}`}
                    onClick={() => setActiveTab("outcomes")}
                >
                    Program Outcomes
                </button>

                <button
                    className={`btn ${activeTab === "psos" ? "active" : ""}`}
                    onClick={() => setActiveTab("psos")}
                >
                    Program Specific Outcomes
                </button>
            </div>

            {/* Content */}
            <div className="tab-content pg-outcomes">

                {/* Outcomes TAB */}
                {activeTab === "outcomes" &&
                    outcomesData.map((data, index) => (
                        <div key={index}>

                            <h3 className="innerpage-subtitle">
                                Outcomes-based approach in B. Tech. (Food Technology)
                            </h3>

                            <div className="pg-outcomes-container">

                                {data.list?.map((item, i) => (
                                    <div key={i} className="pg-outcomes-item">

                                        {/* Number */}
                                        <div className="pg-outcomes-number">
                                            {i + 1}
                                        </div>

                                        <div className="pg-outcomes-card">
                                            {item.title ? (
                                                <>
                                                    <p style={{margin:"0px"}}><strong>{item.title}</strong></p>
                                                    <p>{item.desc}</p>
                                                </>
                                            ) : (
                                                <p>{item.desc}</p>
                                            )}

                                        </div>
                                    </div>
                                ))}

                            </div>

                        </div>
                    ))}


                {/* PSO TAB */}
                {activeTab === "psos" &&
                    tableData.map((table, index) => (
                        <div key={index}>

                            <h2>{table.title}</h2>

                            <div className="table-responsive">
                                <table className="common-table">

                                    <thead>
                                        <tr>
                                            <th>Sr. No.</th>

                                            {table.headers?.map((head, i) => (
                                                <th key={i}>{head}</th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {table.rows?.map((row, i) => (
                                            <tr key={i}>
                                                <td>{i + 1}</td>

                                                <td>
                                                    {row.outcome.split("-")[0]}
                                                    <br />
                                                    {row.outcome.split("-")[1]}
                                                </td>

                                                <td>{row.desc}</td>
                                                <td>{row.needs}</td>
                                            </tr>
                                        ))}
                                    </tbody>

                                </table>
                            </div>

                        </div>
                    ))}
            </div>
        </div>
    );
};

export default PgOutcomes;