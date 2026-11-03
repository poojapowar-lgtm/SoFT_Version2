import React from "react";
import "./programs.css";

const Syllabus = ({ title, file, description }) => {

const syllabusData = [
  {
    title: "Open Elective Courses Offered",
    link: "/assets/docs/Open Elective Courses Offered by SoFT.pdf",
  },
  {
    title: "Multidisciplinary Minor (MDM) Courses",
    link: "/assets/docs/MDM Courses for other schools_4 credits.docx",
  },
  {
    title: "SHD NEP-Aligned Syllabus (AY 2023–24 Onwards)",
    link: "/assets/docs/_SHD NEP aligned Syllabus AY 2023-24 Onwards.docx.pdf",
  },
];


  return (
    <div>
      <h2 className="innerpage-title">{title}</h2>

      <div className="board-body-container">
        <div className="board-card" style={{ padding: "10px" }}>
          <div className="syllabus-row">
            <h3 className="board-name">Syllabus AY 2026-27 : </h3>
            {/* <p>{description}</p> */}
            <a href={file} target="_blank" rel="noopener noreferrer" className="btn2" aria-label={`View Syllabus PDF: ${title}`}>
              View Syllabus
            </a>
          </div>
        </div>

        {syllabusData.map((item, index) => (
          <div className="board-card" key={index} style={{ padding: "10px" }}>
            <div className="syllabus-row">
              <h3 className="board-name">{item.title}</h3>

              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn2"
                aria-label={`Download ${item.title}`}
              >
                {item.link.endsWith(".pdf") ? "View PDF" : "Download"}
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Syllabus;