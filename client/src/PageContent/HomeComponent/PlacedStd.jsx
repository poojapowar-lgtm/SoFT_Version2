
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { TbBriefcase2Filled  } from "react-icons/tb";
import "./PlacedStd.css";
import "../Speak.css";
import Recruiters from "./Recruiters";
import API_BASE from "../../utils/apiBase";

const PlacedStd = () => {
  const [students, setStudents] = useState([]);
  const [index, setIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(3);
  const [isHovered, setIsHovered] = useState(false);

  const trackRef = useRef(null);

  // Fetch placed students
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/placed-students`)
      .then((res) => setStudents(res.data))
      .catch((error) =>
        console.error("Error fetching placed students:", error)
      );
  }, []);

  // Responsive cards count
  useEffect(() => {
    const getCardsToShow = () => {
      if (window.innerWidth <= 480) return 1;
      if (window.innerWidth <= 768) return 2;
      return 3;
    };

    const handleResize = () => {
      setCardsToShow(getCardsToShow());
      setIndex(0);
    };

    handleResize();

    let resizeTimer;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    };

    window.addEventListener("resize", debouncedResize);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Calculate total slides
  const totalSlides = Math.ceil(students.length / cardsToShow);

  // Previous slide
  const handlePrev = () => {
    setIndex((prev) =>
      prev <= 0 ? Math.max(totalSlides - 1, 0) : prev - 1
    );
  };

  // Next slide
  const handleNext = () => {
    setIndex((prev) =>
      prev >= totalSlides - 1 ? 0 : prev + 1
    );
  };

  // Auto slide; pause while hovered
  useEffect(() => {
    if (isHovered || totalSlides <= 1) return;

    const interval = setInterval(() => {
      setIndex((prev) =>
        prev >= totalSlides - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered, totalSlides]);

  // Move the slider track
  useEffect(() => {
    if (!trackRef.current) return;

    trackRef.current.style.transform = `translateX(-${index * 100}%)`;
  }, [index]);

  // Keep index valid when the number of slides changes
  useEffect(() => {
    if (index >= totalSlides && totalSlides > 0) {
      setIndex(totalSlides - 1);
    }
  }, [index, totalSlides]);

  return (
    <div className="placed-section">
      <h2 className="title" style={{textAlign:"center", margin:"0 auto clamp(10px,2vw,25px) auto"}}>
        <TbBriefcase2Filled  className="title-icon" />
        Leading <span>Recruiters, Career Success</span>
      </h2>

      <div
        className="scroll-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left Arrow */}
        <button
          type="button"
          className="scroll-btn left"
          onClick={handlePrev}
          aria-label="Previous students"
          disabled={totalSlides <= 1}
        >
          <FaChevronLeft />
        </button>

        {/* Slider */}
        <div className="slider-wrapper">
          <div className="slider-track" ref={trackRef}>
            {Array.from({ length: totalSlides }).map(
              (_, slideIndex) => (
                <div className="slide" key={slideIndex}>
                  {students
                    .slice(
                      slideIndex * cardsToShow,
                      slideIndex * cardsToShow + cardsToShow
                    )
                    .map((item, i) => (
                      <div
                        key={item.id ?? `${slideIndex}-${i}`}
                        className="home-placed-std-card"
                      >
                        <div className="card-overlay">
                          <div className="card-left">
                            <img
                              src={`${API_BASE}/uploads/${item.photo}`}
                              alt={`${item.name} - ${item.discipline}`}
                              width="300"
                              height="300"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>

                          <div className="card-right">
                            <h3 className="student-name">
                              {item.name}
                            </h3>

                            <p className="student-info">
                              {item.discipline}
                            </p>

                            <p className="student-info">
                              {item.organization}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )
            )}
          </div>

          {/* Slider Dots */}
          <div className="slider-dots">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <span
                key={i}
                className={`dot ${i === index ? "active" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIndex(i);
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          type="button"
          className="scroll-btn right"
          onClick={handleNext}
          aria-label="Next students"
          disabled={totalSlides <= 1}
        >
          <FaChevronRight />
        </button>
      </div>

      <Recruiters />
    </div>
  );
};

export default PlacedStd;
