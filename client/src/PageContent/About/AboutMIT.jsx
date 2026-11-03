import React from "react";
import "./about_mit.css";
import {
  FaGraduationCap,
  FaSeedling,
  FaMicroscope,
} from "react-icons/fa6";

const AboutMIT = () => {
  const visionData = [
    {
      title: "Vision",
      paragraphs: [
        `MIT Art, Design and Technology University aspires to be a University of Eminence by amalgamating Art, Design, Science, and Technology. The University aims to have a transformative impact on society through holistic education, a multidisciplinary research ethos, innovation, and an entrepreneurial culture.`,
      ],
    },
    {
      title: "Mission",
      paragraphs: [
        `The mission of MIT Art, Design and Technology University is to provide impetus to faculty, learners, and staff by developing their innate intellectual capabilities, creative abilities, and entrepreneurial mindset for the socio-economic development of the nation.`,
        `We empower learners to become adaptive and agile global professionals through unique specialized programs that build academia-industrial partnerships. We nurture learners to be intellectually curious, technologically equipped, mentally sound, physically fit, spiritually elevated, socio-culturally sensitive, and environmentally conscious through continuous holistic education for the ever-evolving world.`,
        `We provide a technology-enabled, learner-driven curriculum, value-added courses, simulated learning environments, state-of-the-art infrastructure, and opportunities for community engagement.`,
      ],
    },
  ];



  const missionItems = [
    {
      icon: FaGraduationCap,
      text: visionData[1].paragraphs[0],
    },
    {
      icon: FaMicroscope,
      text: visionData[1].paragraphs[1],
    },
    {
      icon: FaSeedling,
      text: visionData[1].paragraphs[2],
    },
  ];


  return (
    <>

      <div className="aboutmit-container">
        <div className="title-line">
          <h2 className="innerpage-title">About Us</h2>
        </div>

        <div className="aboutmit-image">
          <img
            src="/assets/images/home/about1.webp"
            alt="About MIT-ADT University - MIT School of Food Technology"
            width="500"
            height="250"
            loading="lazy"
            decoding="async"
          />
        </div>

        <p>
          MIT Art, Design and Technology University (MIT-ADT University), a leap
          towards world-class education, was established by the renowned MIT Group
          of Institutions. It is a UGC-recognized multidisciplinary university located
          on a 125-acre campus at Raj Baugh, Loni Kalbhor, which was previously owned
          by the late legendary actor of Hindi cinema, Raj Kapoor. The University
          campus embodies peace, serenity, and tranquility, aesthetically situated
          on the banks of the Mula-Mutha River, with its architectural ideation
          inspired by the matrix of Saptarishi. The magnificent, world-class,
          state-of-the-art infrastructure, modern amenities, and fully residential
          campus facilities make MIT-ADT University one of the premier campuses.
        </p>

        <p>
          MIT-ADT University is a multidisciplinary university that offers programs
          at the undergraduate, postgraduate, and doctoral levels in Fine Art,
          Design, and conventional engineering branches, including Information
          Technology, Computer Science and Engineering, Mechanical, Civil, and
          Aerospace Engineering, Management, Marine Engineering, Bioscience
          Engineering, Food Technology, Film and Television, as well as Broadcasting
          and Journalism. Most of the programs are designed to satisfy the current
          needs of their respective industries.
        </p>

        <p>
          With a vision of holistic development, the University has designed
          compulsory core credits to foster the complete campus transformation of
          students into winning personalities, corporate leaders, social transformers,
          and nation builders. University-level mega gala events, Persona Fest and
          Vishwanath Sports Meet, are known nationwide.
        </p>


        <div>


          <section className="vision-mission-section">
            <div className="vm-container">

              {/*VISION*/}

              {/* <div className="vision-card">

                <div className="vision-main-content">

                  <div className="vm-heading">
                    <h2>{visionData[0].title}</h2>
                    <span></span>
                  </div>

                  <div className="vision-paragraph">
                    {visionData[0].paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>

                </div>

              </div> */}


              {/*MISSION*/}

              <div className="mission-card">

                {/* Content */}
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

                    {missionItems.map((item, index) => {

                      const Icon = item.icon;

                      return (
                        <div className="mission-row" key={index}>

                          <div className="mission-row-icon-wrapper">
                            <Icon />
                          </div>

                          <div className="mission-row-content">
                            <p className="v-para">{item.text}</p>
                          </div>

                        </div>
                      );

                    })}

                  </div>

                </div>

              </div>

            </div>
          </section>
        </div>
      </div>
    </>

  );
};

export default AboutMIT;
