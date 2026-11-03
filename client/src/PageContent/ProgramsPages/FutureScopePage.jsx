import React from "react";
import { useParams } from "react-router-dom";
import FutureScope from "../ProgramsMenus/FutureScope";

const FutureScopePage = () => {
  const { programId } = useParams();

  const programs = {
    "btech-food-technology": {
      title: "B.Tech. (Food Technology)",
      description:
        "With the rapid growth of the food processing sector, increasingly stringent food safety regulations, and rising demand for value-added products, Food Technology plays an important role in advancing the food industry. The programme builds a strong foundation in food processing, preservation, packaging, quality control, engineering principles, and supply chain management.",
      description2:
        "Graduates can explore career opportunities in food manufacturing companies, multinational corporations, government agencies, and emerging food technology startups. Growth in agricultural processing, food exports, and product innovation creates opportunities across the food value chain.",
      list: [
        "Food processing industries",
        "Dairy, bakery, beverage, meat, and seafood industries",
        "Fast-moving consumer goods (FMCG) companies",
        "Quality control laboratories",
        "Government food safety and inspection departments",
        "Food packaging industries",
        "Cold-chain and logistics companies",
        "Food innovation and entrepreneurship startups",
      ],
      list2: [
        "Food Technologist",
        "Production Executive",
        "Quality Control Officer",
        "Process Engineer",
        "R&D Assistant",
        "Food Safety Officer",
        "Packaging Technologist",
        "Technical Officer",
      ],
    },

    "direct-2nd-year-btech": {
      title: "Direct Second-Year B.Tech. (Food Technology)",
      description:
        "The Direct Second-Year B.Tech. in Food Technology builds on students' prior academic or technical knowledge and develops their expertise in food processing, preservation, packaging, quality control, engineering principles, and supply chain management. The programme prepares eligible students to apply scientific and technical principles to challenges in the food processing and allied industries.",
      description2:
        "Graduates can explore career opportunities in food manufacturing companies, multinational corporations, government agencies, and food technology startups. Opportunities may be available in production, quality assurance, food safety, product development, and supply chain operations, depending on individual qualifications and experience.",
      list: [
        "Food processing industries",
        "Dairy, bakery, beverage, meat, and seafood industries",
        "Fast-moving consumer goods (FMCG) companies",
        "Quality control laboratories",
        "Government food safety and inspection departments",
        "Food packaging industries",
        "Cold-chain and logistics companies",
        "Food innovation and entrepreneurship startups",
      ],
      list2: [
        "Food Technologist",
        "Production Executive",
        "Quality Control Officer",
        "Process Engineer",
        "R&D Assistant",
        "Food Safety Officer",
        "Packaging Technologist",
        "Technical Officer",
      ],
    },

    "mtech-food-technology": {
      title: "M.Tech. (Food Technology)",
      description:
        "The M.Tech. in Food Technology provides advanced technical knowledge in food research, automation, product development, sustainable processing, and technological innovation. The programme prepares students to address complex industry challenges and contribute to research, process improvement, and the development of innovative food products and technologies.",
      description2:
        "Postgraduates can pursue specialized technical, research, and managerial opportunities in the food industry and academia. Potential career pathways include research and development, product innovation, process optimization, technical consulting, and higher education, subject to the relevant qualifications and experience.",
      list: [
        "Research and development (R&D) centres",
        "Advanced food processing industries",
        "Multinational food corporations",
        "Food processing equipment manufacturers",
        "Government research laboratories",
        "Academic and research institutions",
        "Regulatory and policy organizations",
      ],
      list2: [
        "R&D Scientist",
        "Senior Food Technologist",
        "Product Development Manager",
        "Process Optimization Specialist",
        "Technical Consultant",
        "Plant Manager",
        "Assistant Professor (subject to applicable eligibility requirements)",
      ],
    },

    "mtech-foodsafety": {
      title: "M.Tech. (Food Safety and Quality Management)",
      description:
        "With stringent food safety regulations and growing consumer awareness, expertise in food safety and quality management is increasingly important. This specialized programme prepares students to understand and implement quality assurance systems, regulatory compliance procedures, auditing practices, and food safety risk management strategies.",
      description2:
        "Graduates can pursue opportunities in organizations that require food safety compliance, quality assurance, and regulatory expertise across domestic and international markets. Potential employment sectors include food manufacturing, export-oriented businesses, certification agencies, testing laboratories, and food regulatory organizations.",
      list: [
        "Quality assurance departments in food industries",
        "Export-oriented food companies",
        "Regulatory organizations, including FSSAI and APEDA, subject to applicable recruitment criteria",
        "Certification and auditing agencies",
        "Food testing laboratories",
        "Hospitality businesses and retail food chains",
      ],
      list2: [
        "Quality Assurance Manager",
        "Food Safety Officer",
        "HACCP/ISO Consultant",
        "Regulatory Affairs Executive",
        "Quality Auditor",
        "Compliance Manager",
        "Laboratory Manager",
      ],
    },

    "mtech-food-technology-working-professional": {
      title: "M.Tech. (Food Technology) – Working Professionals",
      description:
        "The M.Tech. in Food Technology for Working Professionals is designed to help eligible professionals strengthen their technical expertise, research capabilities, and leadership skills while continuing their employment. The programme connects academic learning with industry applications and encourages innovation, process improvement, and professional development.",
      description2:
        "The programme supports career progression for professionals already working in the food and allied sectors. Depending on their existing experience, qualifications, and professional responsibilities, graduates may pursue advancement into senior technical, managerial, research, and strategic roles.",
      list: [
        "Large-scale food manufacturing industries",
        "Government food-related departments and organizations",
        "Research and development units",
        "Quality management divisions",
        "Production and operations management",
      ],
      list2: [
        "Senior Production Manager",
        "Technical Head",
        "Plant Operations Manager",
        "Quality Head",
        "R&D Lead",
        "Food Safety and Compliance Director",
        "Industry Consultant",
      ],
    },

    "phd-food-technology": {
      title: "Ph.D. (Food Technology)",
      description:
        "The Ph.D. in Food Technology is a doctoral research programme designed to develop advanced research expertise and contribute to innovation in food science and technology. Scholars can explore interdisciplinary research areas such as smart food systems, sustainable food processing, cellular agriculture, plant-based proteins, and nanoencapsulation for improved nutrient delivery, depending on available research facilities and supervisory expertise. The programme prepares researchers and academicians to contribute to scientific advancement, technology development, and sustainable solutions for the food industry.",
    },
  };


  const data = programs[programId];

  return (
    <FutureScope
      title={data?.title}
      description={data?.description}
      description2={data?.description2}
      list={data?.list}
      list2={data?.list2}
    />
  );
};

export default FutureScopePage;
