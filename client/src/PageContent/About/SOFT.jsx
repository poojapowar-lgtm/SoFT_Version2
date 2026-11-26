import React from "react";
import "./about_mit.css";

const SOFT = () => {
  const visionData = [
    {
      title: "Vision",
      paragraphs: [
        `To be a centre of excellence in training, research, outreach, and
        consultancy services in Food Science and Technology, with an emphasis
        on the value addition of agricultural produce, food conservation
        through processing technology, nutritional goodness, food security,
        and safety assurance through stakeholder sensitization.`,
      ],
    },
    {
      title: "Mission",
      paragraphs: [
        `The fundamental mission of MIT-SoFT is to emerge as a globally
        competitive centre of excellence, offering undergraduate,
        postgraduate, and doctoral programmes (B.Tech., M.Tech., and Ph.D.)
        in the discipline of Food Science and Technology to fulfil the
        aspirations of the future generation.`,
      ],
    },
  ];

  return (
    <div className="aboutmit-container">
      <h2 className="innerpage-title">School of Food Technology</h2>

      <div className="aboutsoft-content">
        {/* Left - Image */}
        <div className="aboutsoft-image">
          <img
            src="/assets/images/home/soft1.webp"
            alt="MIT School of Food Technology - About SoFT"
            width="700"
            height="400"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Right - Content */}
        <div className="aboutsoft-text">
          <p>
            The institute is committed to developing students with
            entrepreneurial skills and the ability to meet industry needs
            while remaining globally competitive. Its three-phase higher
            education system, comprising undergraduate (B.Tech.),
            postgraduate (M.Tech.), and doctoral (Ph.D.) programmes in Food
            Technology, is one of its kind in the private education sector
            within the discipline of Food Science and Technology.
          </p>

          <p>
            Numerous career opportunities are available in the government
            sector, including the Food and Drug Administration, the Food
            Corporation of India, and the Food Safety and Standards Authority
            of India. There are also techno-commercial opportunities in the
            public and private sectors, including manufacturing, quality
            control, and research and development.
          </p>
        </div>
      </div>

      <section className="vision-mission-section">
        <div className="vm-container">
          {/* VISION */}
          <div className="mission-card">
            <div className="vision-main-content">
              <div className="vm-heading">
                <h2>{visionData[0].title}</h2>
                <span></span>
              </div>

              <div className="vision-paragraph">
                {visionData[0].paragraphs.map((paragraph, index) => (
                  <p className="v-para" key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Mission Content */}
            <div className="mission-main-content">
              <div className="vm-heading">
                <h2>{visionData[1].title}</h2>
                <span></span>
              </div>

              <div className="mission-content">
                {visionData[1].paragraphs.map((paragraph, index) => (
                  <p className="v-para" key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SOFT;
