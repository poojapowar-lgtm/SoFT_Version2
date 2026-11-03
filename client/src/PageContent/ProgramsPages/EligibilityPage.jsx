import React from "react";
import { useParams } from "react-router-dom";
import Eligibility from "../ProgramsMenus/Eligibility";

const EligibilityPage = () => {
  const { programId } = useParams();

  const programs = {
    "btech-food-technology": {
      title: "B.Tech. (Food Technology)",
      duration: ["4 Years | Intake Capacity: 120"],
      description: [
        "The candidate must have passed the 10+2 examination from a recognized board with any of the following subjects: Physics, Mathematics, Chemistry, Computer Science, Electronics, Information Technology, Biology, Informatics Practices, Biotechnology, a Technical Vocational Subject, Agriculture, Engineering Graphics, Business Studies, or Entrepreneurship. The candidate must have obtained a minimum of 45% marks in the subjects taken together for the General/Open category.",
        "A relaxation of 5% in the minimum qualifying marks shall be applicable to candidates belonging to the Reserved Categories, Economically Weaker Sections (EWS), and Persons with Disabilities (PwD) from the State of Maharashtra.",
        "OR",
        "The candidate must have passed the D.Voc. stream in the same or an allied sector.",
      ],
      requirement: [
        "Chemistry as a compulsory subject",
      ],
      exam: [
        "A valid GATE score or PERA-CET score.",
      ],
    },

    "direct-2nd-year-btech": {
      title: "Direct Second-Year B.Tech. (Food Technology)",
      description: [
        "The candidate must have passed a minimum three-year diploma or a two-year diploma (lateral entry) examination in any branch of Engineering and Technology from a recognized board, securing at least 45% marks for the General/Open category.",
        "OR",
        "The candidate must have passed a B.Sc. degree from a university recognized by the University Grants Commission (UGC), securing at least 45% marks for the General/Open category, and must have passed the 10+2 examination with Mathematics as a subject.",
        "A relaxation of 5% in the minimum qualifying marks shall be applicable to candidates belonging to the Reserved Categories, Economically Weaker Sections (EWS), and Persons with Disabilities (PwD) from the State of Maharashtra.",
        "OR",
        "The candidate must have passed a B.Voc. degree or a three-year D.Voc. programme in the same or an allied sector.",
      ],
      requirement: [
        "A diploma in Food Science/Food Technology or a B.Sc./B.Voc. degree in Food Science, Food Technology, Food Processing Technology, or an allied discipline.",
      ],
    },

    "mtech-food-technology": {
      title: "M.Tech. (Food Technology)",
      duration: ["2 Years | Intake Capacity: 18"],
      description: [
        "The candidate must have passed a B.Tech./B.E. degree in Food Science/Food Technology or an equivalent four-year degree programme in Food Science and Food Technology from a university recognized by the University Grants Commission (UGC), securing a minimum of 50% marks in aggregate or an equivalent grade for the General/Open category.",
        "A relaxation of 5% in the minimum qualifying marks shall be applicable to candidates belonging to the Reserved Categories, Economically Weaker Sections (EWS), and Persons with Disabilities (PwD) from the State of Maharashtra.",
        "Candidates must have a valid GATE score or PERA-CET score.",
        "Eligible candidates must appear for and qualify in the interview to be included in the admission merit list.",
      ],
      requirement: [
        "B.Tech./B.E. degree in Food Science or Food Technology.",
      ],
      exam: [
        "A valid GATE score or PERA-CET score.",
      ],
    },

    "mtech-foodsafety": {
      title: "M.Tech. (Food Safety and Quality Management)",
      duration: ["2 Years | Intake Capacity: 6"],
      description: [
        "The candidate must have passed a four-year bachelor's degree programme from a university recognized by the University Grants Commission (UGC), securing a minimum of 50% marks for the General/Open category, in any of the following disciplines: Food Science, Food Technology, Food Process Technology, Food Science and Nutrition, Food Science and Quality Control, Food Process Engineering, Food Processing Technology, Post-Harvest Technology, Biotechnology, Bioengineering, Industrial and Applied Microbiology, or Chemistry, with demonstrated knowledge of Food Science or Food Technology.",
        "A relaxation of 5% in the minimum qualifying marks shall be applicable to candidates belonging to the Reserved Categories, Economically Weaker Sections (EWS), and Persons with Disabilities (PwD) from the State of Maharashtra.",
        "Eligible candidates must appear for and qualify in the interview to be included in the admission merit list.",
      ],
      requirement: [
        "Demonstrated knowledge of Food Science or Food Technology.",
      ],
      exam: [
        "A valid GATE score or PERA-CET score.",
      ],
    },

    "mtech-food-technology-working-professional": {
      title: "M.Tech. (Food Technology) – Working Professionals",
      duration: ["2 Years | Intake Capacity: 12"],
      description: [
        "The candidate must have passed a four-year bachelor's degree programme or a full-time M.Sc. degree from a university recognized by the University Grants Commission (UGC), securing a minimum of 50% marks in aggregate or an equivalent Grade B on the UGC 10-point scale (or an equivalent grade under another grading system), in any of the following disciplines: Food Science, Food Technology, Food Process Technology, Biotechnology, Bioengineering, Food Science and Nutrition, Food Science and Quality Control, Food Process Engineering, Food Processing Technology, Post-Harvest Technology, Industrial and Applied Microbiology, or Chemistry, with demonstrated knowledge of Food Science or Food Technology.",
        "The candidate must have a minimum of one year of full-time, regular work experience in a relevant field, acquired from a registered government or autonomous organization, company, educational institution, industry, or firm.",
        "A relaxation of 5% in the minimum qualifying marks shall be applicable to candidates belonging to the Reserved Categories, Economically Weaker Sections (EWS), and Persons with Disabilities (PwD) from the State of Maharashtra.",
        "Shortlisted candidates must appear for and qualify in a personal interview to be included in the final admission merit list.",
      ],
      exam: [
        "A valid GATE score or PERA-CET score.",
      ],
    },

    "phd-food-technology": {
      title: "Ph.D. (Food Technology)",
      duration: ["3 Years (Full-Time) | Intake Capacity: As per Vacancy"],
      description: [
        "Candidates must hold a Master's degree in Food Science or Food Technology, preceded by a four-year B.Tech. degree or an equivalent degree programme, with a minimum of 70% aggregate marks or an equivalent Grade B on the UGC 10-point scale (or an equivalent grade under another grading system).",
        "OR",
        "Candidates appearing for the final year or final semester of their postgraduate degree may also be eligible to participate in the admission process, subject to fulfilling the minimum eligibility criteria upon declaration of their final results.",
        "OR",
        "Candidates seeking admission on the basis of a four-year/eight-semester bachelor's degree with research must have a minimum CGPA of 7.5 out of 10. Candidates who have qualified NET/JRF/GATE will be given preference, subject to the applicable admission rules.",
        "OR",
        "Candidates who have completed the M.Phil. coursework with at least 55% aggregate marks or an equivalent Grade B on the UGC 10-point scale may be eligible for admission. Candidates holding an equivalent degree from a foreign institution must meet the applicable recognition and accreditation requirements. In-service candidates from state or central government organizations, industry, or academic institutions may also be considered under the applicable faculty improvement or equivalent scheme, based on their experience and research interests. Selection procedures, including interviews, viva voce, entrance examinations, and merit-list preparation, shall be conducted in accordance with the university's applicable Ph.D. admission regulations.",
      ],
      exam: [
        "Admission and selection are subject to the university's applicable Ph.D. regulations and recognized qualifying examinations.",
      ],
    },
  };

  const data = programs[programId];
  return (
    <Eligibility
      title={data?.title}
      description={data?.description}
      duration={data?.duration}
      requirement={data?.requirement}
      exam={data?.exam}
    />
  )
};

export default EligibilityPage;
