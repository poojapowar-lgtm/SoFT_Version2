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
        {/* <h2 className="title">
            National Rankings & Recognition
          </h2> */}
        <img
          src="/assets/images/home/award_4.png"
          alt="National Awards and Recognitions"
          className="national-rank-img"
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



        {/* <div className="rank-text">
          <h2 className="title">
            National Rankings & Recognition
          </h2>

          <p>
            The institute is committed to developing skilled, industry-ready
            graduates and fostering entrepreneurship to meet evolving industry
            needs and global standards. Its higher education programs include
            undergraduate (B.Tech.), postgraduate (M.Tech.), and doctoral (Ph.D.)
            studies in Food Technology, providing students with opportunities
            to build careers in the food science and technology sector.
          </p>

          <p>
            Graduates can explore career opportunities in government organizations
            such as the Food and Drug Administration, Food Corporation of India,
            and Food Safety and Standards Authority of India (FSSAI). They can
            also pursue technical and business-oriented roles in the public and
            private sectors, including food manufacturing, quality control,
            and research and development.
          </p>
        </div> */}


      </div>
    </section>
  );
};

export default NationalRank;