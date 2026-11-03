import React from "react";
import { useParams } from "react-router-dom";
import "../../Pages/board_body.css";
import Syllabus from "../ProgramsMenus/Syllabus";

const SyllabusPage = () => {
  const { programId } = useParams();

  const programs = {
    "btech-food-technology": {
      title: "B.Tech. (Food Technology)",
      description: "Academic Year 2026–27: View Syllabus",
      file: "/assets/docs/BTFT_Outline_Syllabus_2026-27.docx",
    },

    "direct-2nd-year-btech": {
      title: "Direct Second-Year B.Tech. (Food Technology)",
      description: "Academic Year 2026–27: View Syllabus",
      file: "/assets/docs/BTFT_Outline_Syllabus_2026-27.docx",
    },

    "mtech-food-technology": {
      title: "M.Tech. (Food Technology)",
      description: "Academic Year 2026–27: View Syllabus",
      file: "/assets/docs/MTFT Course structure Layout 2026-27.docx",
    },

    "mtech-foodsafety": {
      title: "M.Tech. (Food Safety and Quality Management)",
      description: "Academic Year 2026–27: View Syllabus",
      file: "/assets/docs/M.Tech_FQ_Syllabus.docx",
    },

    "mtech-food-technology-working-professional": {
      title: "M.Tech. (Food Technology) – Working Professionals",
      description: "Academic Year 2026–27: View Syllabus",
      file: "/assets/docs/MTFT_Working Profetional Course Layout.docx",
    },

    "phd-food-technology": {
      title: "Ph.D. (Food Technology)",
      description: "Academic Year 2026–27: View Syllabus",
      file: "/assets/docs/Ph.D syllabus updated_2025.docx",
    },
  };


  const data = programs[programId];


  return (
    <Syllabus
      title={data.title}
      description={data.description}
      file={data.file}
    />
  );
};

export default SyllabusPage;