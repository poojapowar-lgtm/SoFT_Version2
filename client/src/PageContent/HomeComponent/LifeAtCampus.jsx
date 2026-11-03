import React from "react";
import { useNavigate } from "react-router-dom";
import "./LifeAtCampus.css";

const LifeAtCampus = () => {
  const navigate = useNavigate();

  const campusImages = [
    {
      src: "/assets/images/home/soft1.webp",
      alt: "Campus Life at MIT School of Food Technology",
      title: "Life at MIT School of Food Technology",
      width: 700,
      height: 450,
    },
    {
      src: "/assets/images/home/soft2.webp",
      alt: "MIT School of Food Technology Campus",
      title: "MIT School of Food Technology Campus",
      width: 700,
      height: 450,
    },
    {
      src: "/assets/images/home/soft3.webp",
      alt: "Student Life at MIT School of Food Technology",
      title: "Student Life at MIT School of Food Technology",
      width: 700,
      height: 450,
    },
    {
      src: "/assets/images/home/soft4.webp",
      alt: "Facilities at MIT School of Food Technology",
      title: "Facilities at MIT School of Food Technology",
      width: 700,
      height: 450,
    },
  ];

  return (
    <section className="life-campus">
      {/* Title */}


      <div className="campus-content">
        {/* Left Side */}
        <div className="campus-left">
          <h2 className="title">School of Food Technology</h2>

          <p>
            Established in 2006, the School of Food Technology aims to nurture talent
            and contribute to India's growth in the vital food processing sector,
            following the guidelines of the Maharashtra Council of Agricultural
            Education and Research (MCAER), Pune.
          </p>

          <p>
            The institute is committed to developing skilled, industry-ready graduates
            and fostering entrepreneurship to meet evolving industry needs and global
            standards. It offers a comprehensive higher education pathway comprising
            undergraduate (B.Tech.), postgraduate (M.Tech.), and doctoral (Ph.D.)
            programs in Food Technology.
          </p>

          <div className="campus-section">
            <div className="campus-keypoint">
              <ul className="page-list">
                <li>Modern, need-based infrastructure</li>
                <li>Well-equipped laboratories</li>
                <li>Comfortable and well-furnished classrooms</li>
                <li>Pilot-scale food processing plants</li>
              </ul>

            </div>

          </div>

          <button
            className="btn"
            id="campus-btn"
            onClick={() => navigate("/campus-life/facilities")}
          >
            Life at Campus
          </button>
        </div>


        {/* Right Side Image */}

        <div className="campus-image-grid">
          {campusImages.map((image, index) => (
            <div
              className={`campus-img campus-img-${index + 1}`}
              key={image.src}
            >
              <img
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LifeAtCampus;
