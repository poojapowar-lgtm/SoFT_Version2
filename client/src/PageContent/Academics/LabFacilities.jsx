import React, { useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { createPortal } from "react-dom";
import "./lab_facilities.css";

const labData = [
  {
    title: "Food Process and Product Technology (FPPT)",
    image: "/assets/images/labs/FPPT1.webp",
    details: [
      "The department aims to promote innovation in the food sector and catalyse the growth of the food processing industry in India and globally. The existing infrastructure of the Food Process and Product Technology Laboratory is well-equipped to meet the needs of undergraduate students in various areas. In addition, the department offers research programmes at the M.Tech. and Ph.D. levels in advanced areas of Food Science and Technology.",
      "Pursuing excellence in education and research in specialized areas of food technology relevant to the sustainable development of process industries requires advanced technologies in these core areas. With well-equipped laboratories and active industry collaborations, the department emphasizes research, innovation, entrepreneurship, and the development of processed foods, such as functional and fortified foods, to meet evolving consumer and industry needs.",
    ],
  },
  {
    title: "Food Product Engineering Laboratory",
    image: "/assets/images/labs/FPPA2.webp",
    details: [
      "The Food Product Engineering Laboratory provides hands-on experience in understanding the principles of food processing operations and equipment. Through practical experiments, students gain knowledge of unit operations such as size reduction, mixing, heating, cooling, and mass transfer.",
      "The laboratory emphasizes the relationship between engineering concepts and food quality, safety, and efficiency. It helps students develop practical skills, analytical thinking, and familiarity with industrial food processing systems.",
    ],
  },
  {
    title: "PTSF (Traditional and Specialty Foods Laboratory)",
    image: "/assets/images/labs/PTSF.webp",
    details: [
      "The Traditional and Specialty Foods Laboratory at the School of Food Technology is a dedicated facility for hands-on training in the preparation, processing, and evaluation of traditional, specialty, and heritage food products. It supports practical work for courses such as Traditional Foods, Specialty Foods, Indian Heritage Foods, and New Product Development.",
      "The laboratory is equipped with modern food preparation and processing tools that enable students to standardize recipes, develop innovative products, and study region-specific food preparation techniques. Students gain practical experience in product formulation, sensory evaluation, and value addition while preserving traditional knowledge. This laboratory serves as a platform for integrating cultural food heritage with scientific product development approaches.",
      "The laboratory also supports innovation in functional foods.",
    ],
  },
  {
    title: "Agro-Based Plant Operations",
    image: "/assets/images/labs/Agrobase_Plant.webp",
    details: [
      "The Agro-Based Plant Operations facility provides hands-on practical training in food processing and value addition of agricultural commodities. Students gain practical experience through operations such as cleaning, grading, milling, extraction, fermentation, thermal processing, and innovative product formulation.",
      "The facility focuses on transforming raw materials into diversified, nutritionally enhanced, and market-ready food products. Emphasis is placed on quality control, process optimization, and pilot-scale production to simulate industrial practices. It bridges theoretical concepts with real-world applications while fostering technical competence and entrepreneurial skills.",
    ],
  },
  {
    title: "Food Chemistry Laboratory",
    image: "/assets/images/labs/Chemistry_Lab.webp",
    details: [
      "The Food Chemistry Laboratory is a specialized facility where scientific experiments are conducted to understand the chemical composition and properties of food, as well as the effects of processing, storage, and other factors on food quality. These laboratories typically focus on analysing nutrients and other compounds, such as allergens and antinutritional factors, that affect food safety, nutritional value, and taste.",
      "As consumer demand for healthier, more natural, and environmentally sustainable food options grows, food chemistry will continue to evolve to meet these needs.",
    ],
  },
  {
    title: "Research Laboratory",
    image: "/assets/images/labs/Research_Lab2.webp",
    details: [
      "The M.Tech. and Ph.D. Research Laboratory is an advanced facility where postgraduate and doctoral students conduct research on food processing, preservation, quality control, food safety, and product development. The laboratory is equipped with modern instruments such as HPLC systems, spectrophotometers, moisture analysers, texture analysers, and microbiological testing equipment.",
      "M.Tech. students primarily undertake applied research, such as developing new food products, improving shelf life, and analysing nutritional quality. Ph.D. scholars focus on innovative research, advanced food analysis, functional foods, food safety standards, and emerging technologies such as food fortification and packaging solutions.",
      "The benefits of this research laboratory include the development of practical and analytical skills, hands-on experience with advanced food testing instruments, contributions to safe and healthy food production, publication of scientific research, collaboration with food industries, and improved career opportunities in food processing industries, quality assurance laboratories, research institutes, and academia.",
    ],
  },
  {
    title: "Food Business Management and Entrepreneurship Development (FBMED)",
    image: "/assets/images/labs/FBMED1.webp",
    details: [
      "The Food Business Management and Entrepreneurship Development (FBMED) department integrates business, management, and entrepreneurship subjects into the food technology curriculum to equip students with skills in management, marketing, finance, and startup planning specific to the food sector.",
      "The department aims to foster an entrepreneurial mindset by leveraging pilot processing facilities, project work, industry collaborations, and entrepreneurship modules. This enables graduates to pursue careers as food technologists, managers, and innovators or launch their own food businesses and value-added food ventures.",
    ],
  },
  {
    title: "Food Microbiology Laboratory",
    image: "/assets/images/labs/FML1.jpeg",
    details: [
      "Food microbiology labs are integral to the food industry and public health, providing crucial information that affects the safety, quality and sustainability of food production. ",
      " From detecting pathogens and spoilage organisms to advancing fermentation processes and preserving food, these labs ensure that the food we consume is safe, nutritious, and of high quality.",
      "By fostering research, innovation, and education in food microbiology, these labs contribute to improving global food systems and minimizing health risks associated with foodborne diseases."
    ],
  },
  {
    title: "Computer Laboratory",
    image: "/assets/images/labs/Computer_Lab1.webp",
    details: [
      "The Computer Laboratory at the School of Food Technology is well-equipped with modern computer systems and high-speed internet connectivity to support academic and research activities.",
      "The laboratory is designed to facilitate practical sessions related to data analysis, food process modelling, statistical software applications, and research. It provides access to essential software tools required for food technology studies, project work, and report preparation. The laboratory offers a conducive learning environment that enhances students' technical skills and digital proficiency in Food Science and Technology.",
    ],
  },
];


const LabFacilities = () => {
  const [selectedLab, setSelectedLab] = useState(null);
  const [activeLab, setActiveLab] = useState(0);


  return (
    <div className="lab-facilities">
      <h2 className="innerpage-title">Laboratory Facilities</h2>

      <div className="lab-grid">
        {labData.map((lab, index) => {
          const isActive = activeLab === index;

          return (
            <div
              className={`lab-card ${isActive ? "active" : "inactive"}`}
              key={index}
              onClick={() => setActiveLab(index)}
            >
              {/* Always visible title and arrow */}
              <div className="lab-card-heading">
                <h3 className="innerpage-subtitle lab-card-title">
                  {lab.title}
                </h3>

                <MdKeyboardDoubleArrowRight
                  className="lab-arrow-icon"
                  role="button"
                  tabIndex={0}
                  aria-label={`Read more about ${lab.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLab(lab);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedLab(lab);
                    }
                  }}
                />
              </div>

              {/* Only the active card displays the image */}
              <div className="lab-card-content">
                <div className="lab-img">
                  <img
                    src={lab.image}
                    alt={lab.title}
                    width="400"
                    height="250"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

          );
        })}
      </div>

      {/* Lab Details Modal */}
      {/* Lab Details Modal */}
      {selectedLab &&
        createPortal(
          <div
            className="lab-modal-overlay"
            onClick={() => setSelectedLab(null)}
          >
            <div
              className="lab-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <IoMdCloseCircle
                className="page-close-btn"
                onClick={() => setSelectedLab(null)}
              />

              <h3 className="innerpage-subtitle">
                {selectedLab.title}
              </h3>

              <div className="img-wrapper">
                <img
                  src={selectedLab.image}
                  alt={selectedLab.title}
                  className="lab-modal-img"
                  width="400"
                  height="200"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="lab-modal-content">
                {selectedLab.details.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default LabFacilities;