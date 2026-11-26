
import React, { useEffect, useState } from "react";
import "./Banner.css";
import EnquiryForm from "../EnquiryForm";

const bannerData = [
  {
    image: "/assets/banner_gif/Green_Innovation5.webp",
    title: <>Advancing Food Technology <br /> Through Knowledge & Innovation</>,
    alt: "Food technology knowledge and innovation",
  },
  {
    image: "/assets/banner_gif/Green_Innovation1.webp",
    title: <>Innovating for <br /> a Safer and Sustainable Food Future</>,
    alt: "Sustainable food technology innovation",
  },
  {
    image: "/assets/banner_gif/Green_Innovation2.webp",
    title: <>Turning Curiosity into Food Innovation</>,
    alt: "Food innovation at MIT School of Food Technology",
  },
  {
    image: "/assets/banner_gif/Green_Innovation3.webp",
    title: <>Exploring the Science Behind Every Bite</>,
    alt: "Food science research",
  },
  {
    image: "/assets/banner_gif/Green_Innovation4.webp",
    title: <>Innovating Food. Inspiring the Future.</>,
    alt: "Food technology innovation",
  },
  {
    image: "/assets/banner_gif/bnr7.webp",
    title: <>Growing Knowledge. <br /> Transforming Food. Shaping Tomorrow.</>,
    alt: "Food technology education",
  },
];

const Banner = () => {
  const [showForm, setShowForm] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Automatic banner slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerData.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Preload only the next banner
  useEffect(() => {
    const nextIndex = (currentBanner + 1) % bannerData.length;

    const img = new Image();
    img.src = bannerData[nextIndex].image;
  }, [currentBanner]);

  return (
    <>
      <div className="banner-container">
        <div className="banner-image">

          {bannerData.map((banner, index) => (
            <img
              key={banner.image}
              src={banner.image}
              alt={banner.alt}
              width="1200"
              height="450"
              className={`banner-background ${
                currentBanner === index ? "active" : ""
              }`}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "low"}
              decoding="async"
              style={{
                display: currentBanner === index ? "block" : "none",
              }}
            />
          ))}

          <div className="banner-card">
            <h2 className="banner-title">
              {bannerData[currentBanner].title}
            </h2>
          </div>

        </div>
      </div>

      {!showForm && (
        <button
          type="button"
          className="enquiry-btn"
          onClick={() => setShowForm(true)}
        >
          Enquiry Now
        </button>
      )}

      {showForm && (
        <div className="enquiry-modal">
          <div className="enquiry-content">
            <EnquiryForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default Banner;
