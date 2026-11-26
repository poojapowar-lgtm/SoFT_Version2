import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaSearchPlus,
  FaCalendarAlt,
  FaUniversity,
} from "react-icons/fa";
import { IoIosCalendar } from "react-icons/io";
import "./LifeAtCampus.css";

// Campus Images
const campusImages = [
  {
    src: "/assets/images/home/soft1.webp",
    alt: "Campus Life at MIT School of Food Technology",
    title: "Life at MIT School of Food Technology",
    width: 500,
    height: 450,
  },
  {
    src: "/assets/images/home/soft2.webp",
    alt: "MIT School of Food Technology Campus",
    title: "MIT School of Food Technology Campus",
    width: 500,
    height: 450,
  },
  {
    src: "/assets/images/home/soft3.webp",
    alt: "Student Life at MIT School of Food Technology",
    title: "Student Life at MIT School of Food Technology",
    width: 500,
    height: 450,
  },
  {
    src: "/assets/images/home/soft4.webp",
    alt: "Facilities at MIT School of Food Technology",
    title: "Facilities at MIT School of Food Technology",
    width: 500,
    height: 450,
  },
];

const LifeAtCampus = () => {
  // Campus image slider state
  const [currentImage, setCurrentImage] = useState(0);
  const [eventImages, setEventImages] = useState([]);

  const navigate = useNavigate();

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

  // Fetch Upcoming Events from Admin Panel
  const fetchUpcomingEvents = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/upcoming-events`
      );

      const events = Array.isArray(res.data)
        ? res.data
        : res.data?.events || [];

      const formattedImages = events.flatMap((event) => {
        let images = [];

        try {
          images =
            typeof event.file_path === "string"
              ? JSON.parse(event.file_path)
              : event.file_path;
        } catch {
          images = event.file_path ? [event.file_path] : [];
        }

        if (!Array.isArray(images)) {
          images = images ? [images] : [];
        }

        return images
          .filter(
            (image) =>
              typeof image === "string" && image.trim()
          )
          .map((image) => ({
            src: image.startsWith("http")
              ? image
              : `${API_BASE_URL.replace(/\/+$/, "")}/${image.replace(/^\/+/, "")}`,
            alt: event.title || "Upcoming Event",
            title: event.title || "Upcoming Event",
            date: event.date || "",
          }));
      });

      setEventImages(formattedImages);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      setEventImages([]);
    }
  };

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  // Automatically change campus images
  useEffect(() => {
    if (campusImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImage(
        (prev) => (prev + 1) % campusImages.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="life-campus">
      <div className="campus-content">

        {/* Left Side - Campus Information */}
        <div className="campus-left">
          <h2 className="title">
            <FaUniversity className="title-icon" />
            About <span>SoFT</span>
          </h2>
          <p>
            Established in 2006, the School of Food Technology aims to nurture
            talent and contribute to India's growth in the vital food processing
            sector, following the guidelines of the Maharashtra Council of
            Agricultural Education and Research (MCAER), Pune.

            The institute is committed to developing skilled, industry-ready
            graduates and fostering entrepreneurship to meet evolving industry
            needs and global standards. It offers a comprehensive higher
            education pathway comprising undergraduate (B.Tech.), postgraduate
            (M.Tech.), and doctoral (Ph.D.) programs in Food Technology.
          </p>

          <div className="campus-section">
            <div className="campus-keypoint">

              {/* Campus Key Points */}
              <ul className="page-list" id="campus-list">
                <li>Modern, need-based infrastructure</li>
                <li>Well-equipped laboratories</li>
                <li>Comfortable and well-furnished classrooms</li>
                <li>Pilot-scale food processing plants</li>
              </ul>

              {/* Campus Image Slider */}
              <img
                className="campus-left-image"
                src={campusImages[currentImage].src}
                alt={campusImages[currentImage].alt}
                title={campusImages[currentImage].title}
                width={campusImages[currentImage].width}
                height={campusImages[currentImage].height}
                loading={currentImage === 0 ? "eager" : "lazy"}
                decoding="async"
              />

            </div>
          </div>

          {/* Life at Campus Button */}
          <button
            className="btn"
            id="campus-btn"
            onClick={() => navigate("/campus-life/facilities")}
          >
            Life at Campus
          </button>
        </div>

        {/* Right Side - Upcoming Events */}
        <div className="upcoming-events">
          <h2 className="title" style={{ marginBottom: "0px" }}>
            <IoIosCalendar className="title-icon" />
            Upcoming <span>Events</span>
          </h2>
          <p>“Stay Updated with the Latest Events & Activities”</p>
          <div className="upcoming-events-section">

            {/* Continuous Event Scrolling */}
            <div className="upcoming-events-image">
              <div className="event-marquee">
                <div className="event-marquee-track">

                  {/* First Marquee Group */}
                  <div className="event-marquee-group">
                    {eventImages.map((event, index) => (
                      <button
                        type="button"
                        className="event-image-card"
                        key={`first-${index}-${event.src}`}
                        onClick={() => window.open(event.src, "_blank", "noopener,noreferrer")}
                        aria-label={`Open full image: ${event.title}`}
                      >
                        <img
                          src={event.src}
                          alt={event.alt}
                          title={event.title}
                          width="300"
                          height="200"
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                        />

                        <span className="event-zoom-icon">
                          <FaSearchPlus />
                        </span>

                        <div className="upcoming-events-info">
                          <span>{event.title}</span>
                          <span>
                            <FaCalendarAlt />
                            {event.date}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Second Marquee Group - Duplicate for Continuous Scrolling */}
                  <div
                    className="event-marquee-group"
                    aria-hidden="true"
                  >
                    {eventImages.map((event, index) => (
                      <button
                        type="button"
                        className="event-image-card"
                        key={`second-${index}-${event.src}`}
                        tabIndex={-1}
                        onClick={() => window.open(event.src, "_blank", "noopener,noreferrer")}
                      >
                        {/* Event Image */}
                        <img
                          src={event.src}
                          alt=""
                          width="300"
                          height="200"
                          loading="lazy"
                          decoding="async"
                        />

                        {/* Event Title and Date */}
                        <div className="upcoming-events-info">
                          <span>{event.title}</span>

                          <span>
                            <FaCalendarAlt />
                            {event.date}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LifeAtCampus;
