import React, { useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import useHorizontalScroll from "../useHorizontalScroll";
import "./Department.css";

const Department = () => {
  const {
    scrollRef,
    scrollLeft,
    scrollRight,
  } = useHorizontalScroll(300);

  const departments = [
    {
      img: "/assets/images/departments/Vector.svg",
      title: "Food Processing & Product Technology",
    },
    {
      img: "/assets/images/departments/Vector1.webp",
      title: "Food Safety, Quality & Nutrition",
    },
    {
      img: "/assets/images/departments/Vector2.svg",
      title: "Food Processing & Product Engineering",
    },
    {
      img: "/assets/images/departments/Vector3.svg",
      title: "Agro-Based Plant Operations",
    },
    {
      img: "/assets/images/departments/Vector4.svg",
      title: "Food Business Management & Entrepreneurship Development",
    },
    {
      img: "/assets/images/departments/Vector6.webp",
      title: "Ethical Science & Food Technology",
    },
    {
      img: "/assets/images/departments/Vector5.svg",
      title: "Traditional & Specialty Foods",
    },
  ];


  return (
    <>
      <section className="department-section">
        <h2 className="title">Our Departments</h2>

        <div className="scroll-wrapper">
          <button className="scroll-btn left" onClick={scrollLeft}>
            <FaChevronLeft />
          </button>

          <div className="department-container" ref={scrollRef}>
            {departments.map((dept, index) => (
              <div className="department-card" key={index}>
                <img
                  className="dep-images"
                  src={dept.img}
                  alt={dept.title}
                  width="500"
                  height="500"
                  loading="lazy"
                  decoding="async"
                />
                <h3 className="dep-name">{dept.title}</h3>
              </div>
            ))}
          </div>

          <button className="scroll-btn right" onClick={scrollRight}>
            <FaChevronRight />
          </button>
        </div>
      </section>
    </>


  );
};

export default Department;