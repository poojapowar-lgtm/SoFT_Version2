
import React, { useEffect, useState } from "react";
import axios from "axios";
import { RiSchoolFill } from "react-icons/ri";
import { BiSolidMessageRoundedDots } from "react-icons/bi";
import "./facilities.css";
import API_BASE from "../../utils/apiBase";

// Facilities Images
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
    src: "/assets/images/facilites/fac3.webp",
    title: "Placements",
    text: "The placement cell supports students in exploring career opportunities and preparing for professional roles in the food technology industry.",
  },
];

const Facilities = () => {
  const [testimonials, setTestimonials] = useState([]);

  // Fetch Testimonials
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/testimonials`)
      .then((res) => {
        setTestimonials(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error("Testimonials error:", err));
  }, []);

  // YouTube Embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;

    const videoId = url.includes("v=")
      ? url.split("v=")[1]?.split("&")[0]
      : url.split("/").pop()?.split("?")[0];

    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : null;
  };



// Automatic seamless scrolling — only runs when section is visible
useEffect(() => {
  const section = document.querySelector(".facilities-testimonials-section");
  if (!section) return;

  let cleanups = [];
  let observer;

  const startScrolling = () => {
    const containers = [
      document.querySelector(".facilities-window"),
      document.querySelector(".testimonials-window"),
    ].filter(Boolean);

    containers.forEach((container) => {
      const track = container.querySelector(".vertical-scroll-track");
      if (!track) return;

      let animationFrame;
      let paused = false;
      const scrollSpeed = 0.5;

      const scrollStep = () => {
        if (!paused) {
          container.scrollTop += scrollSpeed;
          if (container.scrollTop >= track.scrollHeight / 2) {
            container.scrollTop = 0;
          }
        }
        animationFrame = requestAnimationFrame(scrollStep);
      };

      const pause = () => { paused = true; };
      const resume = () => { paused = false; };

      container.addEventListener("mouseenter", pause);
      container.addEventListener("mouseleave", resume);
      container.addEventListener("touchstart", pause, { passive: true });
      container.addEventListener("touchend", resume);

      animationFrame = requestAnimationFrame(scrollStep);

      cleanups.push(() => {
        cancelAnimationFrame(animationFrame);
        container.removeEventListener("mouseenter", pause);
        container.removeEventListener("mouseleave", resume);
        container.removeEventListener("touchstart", pause);
        container.removeEventListener("touchend", resume);
      });
    });
  };

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        startScrolling();
        observer.disconnect();
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(section);

  return () => {
    observer.disconnect();
    cleanups.forEach((c) => c());
  };
}, [testimonials.length]);



  // Duplicate data for continuous scrolling
  const repeatedFacilities = [...images, ...images];

  const repeatedTestimonials = [
    ...testimonials,
    ...testimonials,
  ];

  return (
    <section className="facilities-testimonials-section">
      <div className="facilities-testimonials-container">

        {/* LEFT SIDE - FACILITIES */}
        <div className="facilities-column">
          <h2 className="title">
            <RiSchoolFill className="title-icon" />
            Campus <span>Facilities</span>
          </h2>

          <div className="vertical-scroll-window facilities-window">
            <div className="vertical-scroll-track facilities-track">
              {repeatedFacilities.map((item, index) => (
                <div
                  className="facility-card"
                  key={`${item.src}-${index}`}
                >
                  <img
                    src={item.src}
                    alt={item.title}
                    width="700"
                    height="400"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />

                  <div className="facility-overlay">
                    <h3 className="facility-title">
                      {item.title}
                    </h3>

                    <p className="facility-text">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - TESTIMONIALS */}
        <div className="testimonials-column">
          <h2 className="title">
            <BiSolidMessageRoundedDots className="title-icon" />
            Faculty & Student <span>Testimonials</span>
          </h2>

          <div className="vertical-scroll-window testimonials-window">
            {testimonials.length > 0 ? (
              <div className="vertical-scroll-track testimonials-track">
                {repeatedTestimonials.map((item, index) => {
                  const embedUrl = getEmbedUrl(item.video_url);

                  return (
                    <div
                      className="testimonials-card"
                      key={`${item.id || index}-${index}`}
                    >
                      <div className="video-box">
                        {embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title={
                              item.alt_tag ||
                              item.title ||
                              "Video Testimonial"
                            }
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : item.video_path ? (
                          <video
                            controls
                            preload="none"
                            title={
                              item.alt_tag ||
                              item.title ||
                              "Video Testimonial"
                            }
                          >
                            <source
                              src={`${API_BASE}${item.video_path}`}
                              type="video/mp4"
                            />
                          </video>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-testimonials">
                Testimonials will be available soon.
              </p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Facilities;
