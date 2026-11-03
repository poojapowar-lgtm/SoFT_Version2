import React, { useState } from "react";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";

const Facilities = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };


const data = [
  {
    title: "Food Process and Product Technology Laboratory (FPPT)",
    image: "/images/vision.webp",
    content: (
      <>
        <p>
          The Food Process and Product Technology Laboratory aims to promote
          innovation in the food sector and contribute to the growth of the
          food processing industry in India and globally. Its infrastructure
          supports undergraduate practical training in various aspects of
          food science and technology. The department also offers research
          programmes at the M.Tech. and Ph.D. levels in advanced areas of food
          science and technology.
        </p>
        <p>
          The laboratory supports education and research in specialized areas
          of food technology, contributing to the sustainable development of
          the food processing industry. With well-equipped facilities and
          active industry collaborations, the department emphasizes research,
          innovation, and entrepreneurship. It also encourages the development
          of value-added food products, including functional and fortified
          foods, to meet evolving consumer preferences and industry needs.
        </p>
      </>
    ),
  },
  {
    title: "Food Safety, Quality and Nutrition (FSQN) – Food Chemistry Laboratory",
    image: "/images/mission.webp",
    content: (
      <>
        <p>
          The Food Chemistry Laboratory is a specialized facility where
          scientific experiments are conducted to study the chemical
          composition and properties of food, as well as the effects of
          processing, storage, and other factors on food quality. The
          laboratory focuses on analysing nutrients and other food compounds,
          including allergens and antinutritional factors, that influence
          food safety, nutritional value, and sensory properties. As consumer
          demand for healthier, more natural, and environmentally responsible
          food products continues to grow, food chemistry plays an important
          role in supporting product quality, safety, and innovation.
        </p>
      </>
    ),
  },
  {
    title: "Food Safety, Quality and Nutrition (FSQN) – Food Microbiology Laboratory",
    image: "/images/mission.webp",
    content: (
      <>
        <p>
          The Food Microbiology Laboratory plays an important role in food
          safety, quality assurance, and public health. It supports the study
          and detection of foodborne pathogens and spoilage microorganisms,
          while also contributing to research on fermentation, food
          preservation, and microbial control. Through practical training,
          research, and innovation, the laboratory helps students understand
          how microbiological factors influence food quality and safety.
          These activities contribute to the development of safer food
          production practices and help reduce the risks associated with
          foodborne diseases.
        </p>
      </>
    ),
  },
  {
    title: "Traditional and Specialty Foods Laboratory",
    image: "/images/mission.webp",
    content: (
      <>
        <p>
          The Traditional and Specialty Foods Laboratory at the School of
          Food Technology provides hands-on training in the preparation,
          processing, and evaluation of traditional, specialty, and heritage
          food products. It supports practical learning in areas such as
          traditional foods, specialty foods, Indian heritage foods, and new
          product development. The laboratory is equipped to support food
          preparation and processing activities, enabling students to
          standardize recipes, develop innovative products, and explore
          region-specific food preparation techniques.
        </p>
        <p>
          Students gain practical experience in product formulation, sensory
          evaluation, and value addition while learning about the preservation
          of traditional food knowledge. The laboratory provides a platform
          for integrating cultural food heritage with scientific approaches
          to food processing and product development.
        </p>
      </>
    ),
  },
  {
    title: "M.Tech. Research Laboratory",
    image: "/images/mission.webp",
    content: (
      <>
        <p>
          The M.Tech. Research Laboratory supports postgraduate research and
          innovation in food science and technology. It provides a learning
          environment for students to explore specialized research areas
          related to food processing, product development, and food quality.
          The laboratory supports research activities aimed at addressing
          emerging challenges and opportunities in the food processing
          industry.
        </p>
        <p>
          With appropriate laboratory facilities and opportunities for
          research collaboration, students can develop their analytical,
          experimental, and problem-solving skills. The laboratory encourages
          scientific inquiry, innovation, and the development of value-added
          food products, including functional and fortified foods, in response
          to evolving consumer and industry needs.
        </p>
      </>
    ),
  },
  {
    title: "Agro-Based Plant Operations Laboratory",
    image: "/images/mission.webp",
    content: (
      <>
        <p>
          The Agro-Based Plant Operations Laboratory provides practical
          training in food processing and value addition of agricultural
          commodities. Students gain hands-on experience in operations such
          as cleaning, grading, milling, extraction, fermentation, thermal
          processing, and product formulation. The laboratory focuses on
          transforming agricultural raw materials into diversified,
          nutritionally enhanced, and market-ready food products. Emphasis
          is placed on quality control, process optimization, and pilot-scale
          production to help students understand industrial practices.
        </p>
        <p>
          The facility connects theoretical concepts with practical
          applications while helping students develop technical competence,
          problem-solving abilities, and entrepreneurial skills relevant to
          the food processing industry.
        </p>
      </>
    ),
  },
  {
    title: "Computer Laboratory",
    image: "/images/mission.webp",
    content: (
      <>
        <p>
          The Computer Laboratory at the School of Food Technology supports
          academic, practical, and research activities. It provides a
          computing environment for tasks such as data analysis, food process
          modelling, statistical analysis, project work, and report
          preparation. The laboratory helps students use relevant digital
          tools and software applications to support their studies and
          research in food science and technology.
        </p>
        <p>
          The facility promotes digital proficiency, analytical thinking, and
          technical skills, helping students apply computing tools to
          academic projects and food technology applications.
        </p>
      </>
    ),
  },
];

  return (
    <div>
      <h3 className="innerpage-subtitle">Facilities:</h3>

      {data.map((item, index) => (
        <div key={index} className="accordion-item">
          <div
            className={`accordion-header ${activeIndex === index ? "active" : ""
              }`}
            onClick={() => toggleAccordion(index)}
          >
       
              <span className="vision-icon">
                <MdKeyboardDoubleArrowRight />
              </span>
              <h4 className="accordion-title">{item.title}</h4>
         
          </div>

          {activeIndex === index && (
            <div className="accordion-content">
              <div className="accordion-content-wrapper">
                <div className="accordion-content">
                  {item.content}
                </div>

                <img
                  src={item.image}
                  alt={item.title}
                  className="accordion-image"
                />
              </div>
            </div>

          )}
        </div>
      ))}
    </div>
  );
};

export default Facilities;