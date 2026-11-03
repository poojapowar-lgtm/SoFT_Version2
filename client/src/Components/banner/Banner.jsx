import React, { useEffect, useState } from "react";
import "./Banner.css";
import EnquiryForm from "../EnquiryForm";

const bannerData = [
  {
    image: "/assets/banner_gif/Green_Innovation5.png",
    title: (
      <>
        Advancing Food Technology <br />
        Through Knowledge & Innovation
      </>
    ),
    alt: "Food technology knowledge and innovation",
  },
  {
    image: "/assets/banner_gif/Green_Innovation1.png",
    title: (
      <>
        Innovating for a Safer <br />
        and Sustainable Food Future
      </>
    ),
    alt: "Sustainable food technology innovation",
  },
  {
    image: "/assets/banner_gif/Green_Innovation2.png",
    title: (
      <>
        Turning Curiosity into Food Innovation
      </>
    ),
    alt: "Food innovation at MIT School of Food Technology",
  },
  {
    image: "/assets/banner_gif/Green_Innovation3.png",
    title: (
      <>
        Exploring the Science  Behind Every Bite
      </>
    ),
    alt: "Food science research",
  },
  {
    image: "/assets/banner_gif/Green_Innovation4.png",
    title: (
      <>
        Innovating Food. Inspiring the Future.
      </>
    ),
    alt: "Food technology innovation",
  },
  {
    image: "/assets/banner_gif/bnr7.webp",
    title: (
      <>
        Growing Knowledge. <br />
        Transforming Food. Shaping Tomorrow.
      </>
    ),
    alt: "Food technology education",
  },
];


const Banner = () => {
  const [showForm, setShowForm] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Change banner every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerData.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Preload the next 2 banners
  useEffect(() => {
    const nextIndex = (currentBanner + 1) % bannerData.length;
    const secondNextIndex = (currentBanner + 2) % bannerData.length;

    const nextImage = new Image();
    nextImage.src = bannerData[nextIndex].image;

    const secondNextImage = new Image();
    secondNextImage.src = bannerData[secondNextIndex].image;
  }, [currentBanner]);

  return (
    <>
      <div className="banner-container">
        <div className="banner-image">
          <img
            key={currentBanner}
            src={bannerData[currentBanner].image}
            alt={bannerData[currentBanner].alt}
            width="1200"
            height="450"
            className="banner-background active"
            fetchPriority={currentBanner === 0 ? "high" : "auto"}
            decoding="async"
          />

          <div className="banner-card">
            <h2 className="banner-title">
              {bannerData[currentBanner].title}
            </h2>
          </div>
        </div>
      </div>

      {!showForm && (
        <button
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