import React from "react";
import "./Programs.css";
import { FaGraduationCap } from "react-icons/fa";
import { Link } from "react-router-dom";
import { FaArrowRightLong } from "react-icons/fa6";

const Programs = () => {

  const programData = [
    {
      image: "/assets/images/programs/B.Tech.webp",
      title: "B.Tech. (Food Technology)",
      desc: "A four-year undergraduate programme designed to develop technically competent professionals for the food processing and allied industries",
      link: "/programs/btech-food-technology/about-programs",
    },
    {
      image: "/assets/images/programs/Direct_2nd_Year.webp",
      title: "B.Tech. (Food Technology) – Direct Second Year",
      desc: "Enables eligible diploma holders and other candidates meeting the applicable admission criteria to enter the second year of the undergraduate programme.",
      link: "/programs/direct-2nd-year-btech/about-programs",
    },
    {
      image: "/assets/images/programs/m.tech.webp",
      title: "M.Tech. (Food Technology)",
      desc: "A two-year postgraduate programme focused on advanced knowledge, research, and technological innovation in food science.",
      link: "/programs/mtech-food-technology/about-programs",
    },
    {
      image: "/assets/images/programs/food_safety.webp",
      title: "M.Tech. (Food Safety & Quality Management)",
      desc: "A specialized postgraduate programme designed to develop expertise in food safety systems, quality assurance, regulatory compliance, and risk management.",
      link: "/programs/mtech-foodsafety/about-programs",
    },
    {
      image: "/assets/images/programs/Working_Professionals.webp",
      title: "M.Tech. (Food Technology) – Working Professionals",
      desc: "A postgraduate programme designed to support career advancement while enabling eligible professionals to continue their employment",
      link: "/programs/mtech-food-technology-working-professional/about-programs",
    },
    {
      image: "/assets/images/programs/P.hd.webp",
      title: "Ph.D. (Food Technology)",
      desc: "A doctoral research programme designed to develop researchers, academicians, and innovators in food science and technology. ",
      link: "/programs/phd-food-technology/about-programs",
    },
  ];


  return (
    <section className="programs-section">
      <h2 className="title">
        <FaGraduationCap className="title-icon" />
        Academic <span>Programs & Specializations</span>
      </h2>

      <div className="programs-slider">
        <div className="programs-track">
          {programData.concat(programData).map((program, index) => (
            <Link
              to={program.link}
              className="program-cards"
              key={index}
            >
              <img
                src={program.image}
                alt={program.title}
                width="800"
                height="500"
                loading="lazy"
                decoding="async"
              />

              <div className="pg-card">
                <h3 className="pg-title">{program.title}</h3>
                <p className="pg-desc">{program.desc}</p>
                <FaArrowRightLong className="pg-arrow-icon" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Programs;