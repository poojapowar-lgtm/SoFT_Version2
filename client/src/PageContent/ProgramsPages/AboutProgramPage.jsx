import React from "react";
import { useParams } from "react-router-dom";
import AboutProgram from "../ProgramsMenus/AboutProgram";

const AboutProgramPage = () => {
  const { programId } = useParams();

  const programs = {
    "btech-food-technology": {
      title: "B.Tech. (Food Technology)",
      image: "/assets/images/programs/B.Tech.webp",
      description: [
        "The B.Tech. in Food Technology is a four-year undergraduate programme designed to develop technically competent professionals for the food processing and allied industries. The programme focuses on the scientific principles of food processing, preservation, packaging, quality control, food safety regulations, and product development. Students gain a strong foundation in food chemistry, microbiology, engineering operations, nutrition, and food laws, supported by laboratory work and pilot-plant exposure. The curriculum follows an industry-aligned, outcome-based framework in accordance with the National Education Policy (NEP) 2020.",
        "The programme emphasizes experiential learning, industrial training, and real-world problem-solving. Students participate in Industrial In-Plant Training (IPT), industry visits, and project-based learning activities to prepare for professional roles. Graduates are equipped for careers in food manufacturing, quality assurance, research and development (R&D), regulatory affairs, and entrepreneurship, as well as for higher education and research in food science and technology.",
      ],
      description2:
        "The B.Tech. in Food Technology plays an important role in addressing the growing demand for safe, nutritious, and sustainable food. It provides an integrated understanding of food processing, quality and safety management, product innovation, nutrition, and supply chain operations. The programme prepares graduates to address industry challenges such as food safety assurance, post-harvest loss reduction, regulatory compliance, and the development of value-added and functional food products. With opportunities emerging in food processing, cold-chain logistics, nutraceuticals, and digital supply chain management, graduates can pursue careers in industry, research, entrepreneurship, and higher education. The programme also contributes to food security, public health, and technological advancement in the agri-food sector.",
    },

    "direct-2nd-year-btech": {
      title: "Direct Second-Year B.Tech. (Food Technology)",
      image: "/assets/images/programs/Direct_2nd_Year.webp",
      description: [
        "The Direct Second-Year B.Tech. in Food Technology programme enables eligible diploma holders and other candidates meeting the applicable admission criteria to enter the second year of the undergraduate programme. It focuses on developing technical competence in food processing, preservation, packaging, quality control, food safety, and product development. Students build on their foundational knowledge through theoretical instruction, laboratory practicals, and exposure to food processing operations.",
        "The curriculum emphasizes experiential learning, industrial training, and practical problem-solving. Students may participate in industrial training, industry visits, and project-based activities to develop the skills required for professional roles. Graduates can pursue careers in food manufacturing, quality assurance, R&D, regulatory affairs, and entrepreneurship, as well as further education and research in food science and technology.",
      ],
      description2:
        "The programme prepares students to contribute to the development of safe, nutritious, and sustainable food products. It integrates food processing, quality and safety management, product innovation, nutrition, and supply chain operations. Students develop an understanding of challenges such as food safety assurance, post-harvest loss reduction, regulatory compliance, and value-added product development. Career opportunities may be available in food processing, cold-chain logistics, nutraceuticals, quality management, research, and entrepreneurship. The programme also supports the advancement of food security, public health, and innovation in the agri-food sector.",
    },

    "mtech-food-technology": {
      title: "M.Tech. (Food Technology)",
      image: "/assets/images/programs/m.tech.webp",
      description: [
        "The M.Tech. in Food Technology is a two-year postgraduate programme focused on advanced knowledge, research, and technological innovation in food science. The curriculum covers advanced food processing techniques, emerging preservation technologies, functional foods, food engineering systems, and research methodology. Students undertake laboratory experiments, research projects, and dissertation work addressing practical challenges in the food sector. The programme emphasizes innovation, product development, process optimization, and sustainability in food systems.",
        "The programme is designed to develop advanced technical and research competencies for professional careers in the food industry and academia. Subject to the applicable admission requirements, eligible candidates may be considered through the prescribed entrance examination and selection process. Graduates can pursue opportunities in R&D, quality management, academic institutions, research organizations, regulatory agencies, and technical leadership roles in the food processing industry.",
      ],
      description2:
        "The M.Tech. in Food Technology supports advanced learning and research that benefit students, farmers, industry professionals, and other stakeholders in the food sector. The programme aims to strengthen expertise in food science and technology while encouraging innovation, entrepreneurship, and sustainable food processing practices. It also promotes an understanding of food-related policies, industrial development, and emerging technological opportunities. Graduates may pursue careers as food technologists, research scientists, R&D managers, quality assurance professionals, production managers, consultants, laboratory professionals, and academic faculty members, subject to the qualifications required for each role.",
    },

    "mtech-foodsafety": {
      title: "M.Tech. (Food Safety and Quality Management)",
      image: "/assets/images/programs/food_safety.webp",
      description: [
        "The M.Tech. in Food Safety and Quality Management is a specialized postgraduate programme designed to develop expertise in food safety systems, quality assurance, regulatory compliance, and risk management. The curriculum integrates food microbiology, toxicology, food laws, Hazard Analysis and Critical Control Points (HACCP), ISO standards, and food safety regulations. Students develop practical knowledge through laboratory analysis, audits, case studies, and industry-oriented projects, preparing them for professional responsibilities in quality control and regulatory affairs.",
        "The multidisciplinary programme may be suitable for graduates from food science, biotechnology, microbiology, chemistry, and related disciplines who meet the prescribed eligibility criteria. Through academic guidance and research-oriented learning, students develop the competencies required to address food safety and quality challenges. Graduates can explore career opportunities in food manufacturing, certification and auditing organizations, regulatory bodies, export-oriented businesses, and food safety institutions.",
      ],
      description2:
        "The programme focuses on strengthening food safety practices, quality management systems, and compliance with applicable standards and regulations. It prepares students to contribute to food quality assurance, risk assessment, product safety, and continuous improvement across the food supply chain. Graduates may pursue roles in quality assurance, food safety management, regulatory affairs, auditing, laboratory analysis, and related research activities, subject to the relevant professional and regulatory requirements.",
    },

    "mtech-food-technology-working-professional": {
      title: "M.Tech. (Food Technology) – Working Professionals",
      image: "/assets/images/programs/Working_Professionals.webp",
      description: [
        "The M.Tech. in Food Technology for Working Professionals is a postgraduate programme designed to support career advancement while enabling eligible professionals to continue their employment. The curriculum focuses on advanced food processing, quality management systems, innovation, and applied research in response to industry challenges. Candidates must meet the prescribed academic eligibility criteria and any applicable professional experience requirements. The learning approach connects theoretical concepts with practical applications, enabling participants to apply relevant knowledge in their workplaces.",
        "Admission is governed by the university's applicable eligibility and selection criteria. The programme aims to strengthen technical expertise, research capabilities, and leadership potential, preparing graduates for advanced technical, managerial, research, and consultancy roles in the food processing and allied industries.",
      ],
      description2:
        "The M.Tech. in Food Technology for Working Professionals supports the professional development of industry personnel, entrepreneurs, quality managers, technologists, and other eligible stakeholders in the food sector. The programme strengthens competencies in food science and technology while helping learners combine academic advancement with professional responsibilities. Its applied learning and research focus can support career progression, leadership development, and innovation in food processing. Depending on their qualifications and experience, graduates may pursue roles such as R&D Manager, Quality Assurance Executive, Food Technologist, Production Manager, Consultant, Research Scientist, or academic professional. They can also contribute to food safety, regulatory compliance, sustainability, and the continued development of the food processing industry.",
    },

    "phd-food-technology": {
      title: "Ph.D. (Food Technology)",
      image: "/assets/images/programs/P.hd.webp",
      description: [
        "The Ph.D. in Food Technology is a doctoral research programme designed to develop researchers, academicians, and innovators in food science and technology. The programme focuses on original research in areas such as food processing, food safety, nutrition, sustainability, and emerging technologies. Scholars work under the guidance of qualified research supervisors and may collaborate with industry partners to advance scientific knowledge, develop innovative technologies, and contribute to research publications and other scholarly outputs.",
        "Admission is subject to the university's prescribed eligibility criteria and selection procedure, including applicable entrance examinations, interviews, or recognized national-level qualifications. The programme prepares scholars for careers in academic institutions, research organizations, government agencies, and industry, as well as for leadership roles in food science and technology research and innovation.",
      ],
    },
  };


  const data = programs[programId];

  return (
    <AboutProgram
      title={data?.title}
      image={data?.image}
      description={data?.description}
      description2={data?.description2}
    />
  );
};

export default AboutProgramPage;
