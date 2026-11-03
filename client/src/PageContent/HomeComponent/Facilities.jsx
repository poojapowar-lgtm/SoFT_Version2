import React, { useEffect, useState } from "react";
import "./facilities.css";
import { FaArrowRight } from "react-icons/fa";
import { FaArrowRightLong } from "react-icons/fa6";
import Testimonials from "./Testimonials";

const Facilities = () => {


  const images = [
    {
      src: "/assets/images/facilites/fac4.webp",
      title: "World Food Day Celebration",
      text: "World Food Day is one of the key celebrations at MIT SoFT. The event contributes to nation-building through seminars, competitions, and other educational activities.",
    },
    {
      src: "/assets/images/facilites/Industrial_Visit.webp",
      title: "Industrial Visits",
      text: "As part of their degree programme, students at MIT SoFT visit food industries to gain practical exposure to industrial environments and understand real-world industry practices.",
    },
    {
      src: "/assets/images/facilites/Seminars.webp",
      title: "Seminars & Group Discussions",
      text: "Knowledge is most effective when students can communicate it clearly. Seminars and group discussions help students develop their communication, presentation, and critical-thinking skills.",
    },
    {
      src: "/assets/images/facilites/Learning.webp",
      title: "Practical-Based Project Learning",
      text: "MIT School of Food Technology provides third-year B.Tech. Food Technology students with opportunities to apply their laboratory learning to real-world challenges through practical projects.",
    },
    {
      src: "/assets/images/facilites/placement.webp",
      title: "Placements",
      text: "The placement cell supports students in exploring career opportunities and preparing for professional roles in the food technology industry.",
    },
  ];



  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="facilities-section">
      {/* <h2 className="title">Our Facilities</h2> */}

      <div className="facility-image-container">
        <img
          src={images[currentIndex].src}
          alt={images[currentIndex].title}
          width="1200"
          height="500"
        />

        <div className="facility-overlay">
          <div className="facility-title-box">
            <h3 className="facility-title">{images[currentIndex].title}</h3>

          </div>

          <p className="facility-text">{images[currentIndex].text}</p>
          {/* <FaArrowRightLong className="pg-arrow-icon" /> */}
        </div>
      </div>

      <Testimonials />
    </section>
  );
};

export default Facilities;
