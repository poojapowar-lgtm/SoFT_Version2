import React from "react";
import "./NationalRank.css";

const NationalRank = () => {
  const rankingLogos = [
    {
      src: "/assets/images/home/NAAC_Logo.webp",
      alt: "NAAC Accreditation Logo - MIT-ADT University",
      title: "NAAC Accreditation",
    },
    {
      src: "/assets/images/home/Ranking1.webp",
      alt: "NIRF National Ranking Badge - MIT-ADT University",
      title: "NIRF Ranking",
    },
    {
      src: "/assets/images/home/Ranking2.webp",
      alt: "MIT-ADT University National Ranking Recognition",
      title: "National Ranking Recognition",
    },
    {
      src: "/assets/images/home/Ranking3.webp",
      alt: "MIT-ADT University Award and Recognition",
      title: "Award and Recognition",
    },
    {
      src: "/assets/images/home/Ranking4.webp",
      alt: "MIT-ADT University Excellence Award",
      title: "Excellence Award",
    },
  ];

  return (
    <section className="rank-container">
      <div className="rank-content">
        <img
          src="/assets/images/home/award_4.webp"
          alt="National Awards and Recognitions"
          className="national-rank-img"
          width="376"
          height="299"
          loading="lazy"
          decoding="async"
        />


        <div className="rank-logos-wrapper">
          <div className="rank-logos">
            {[...rankingLogos, ...rankingLogos].map((logo, index) => (
              <img
                key={`${logo.src}-${index}`}
                src={logo.src}
                alt={index < rankingLogos.length ? logo.alt : ""}
                title={logo.title}
                aria-hidden={index >= rankingLogos.length}
                className="RLogo"
                width="200"
                height="90"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NationalRank;