import React from "react";
import "./leadership.css";

const PrincipalMSG = () => {
  return (
    <div className="leadership-container">
      <h2 className="innerpage-title">Principal's Message</h2>

      {/* Section 1 */}
      <div className="leader-card">
        <div className="leader-section">
          <div className="leader-image">
            <img
              src="/assets/images/home/principal_mam.webp"
              alt="Dr. Anjali Bhoite - I/C Principal, MIT School of Food Technology"
              width="240"
              height="240"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="leader-content">
            {/* <p>From the Principal's Desk</p> */}
            <h3 className="innerpage-subtitle">
              Prof. Dr. Anjali Bhoite
            </h3>
            <h4 className="leader-designation">
              Associate Dean, Faculty of the School of Food Technology
            </h4>
            <p>
              The School of Food Technology is one of the well-recognized
              academic institutions imparting education in the domain of Food
              Technology. It was founded in 2006 as an affiliated college under
              Mahatma Phule Krishi Vidyapeeth (MPKV) by the MIT MAEER's Group
              of Institutions. The school came under the umbrella of MIT-ADT
              University in 2017. Its journey, marked by a transition in
              university affiliation, has established the institution as a
              reputed contributor to nation-building, with experienced teaching
              staff and a strong alumni network.
            </p>
          </div>
        </div>

        <p>
          The state-of-the-art facilities at MIT-ADT University, its commitment
          to multidisciplinary education, and its vision of developing
          holistic, accomplished individuals have further strengthened the
          achievements of the School of Food Technology, making it an iconic
          and flourishing centre of excellence in Food Technology. The
          three-phase education system in the discipline of Food Technology
          fosters an ecosystem of applied, need-based innovation and research.
        </p>

        <p>
          Industrial training, industry-oriented future skill development
          programmes, corporate-sector-focused personality development, and
          exposure to incubation-centre activities have contributed to the
          school's achievements in securing significant industrial placements
          and promoting entrepreneurship in Food Technology. The school's
          strong links with research institutes in India and reputed academic
          institutions in India and abroad provide valuable exposure to
          students and faculty members. As the host of the Association of Food
          Scientists and Technologists (India) (AFST(I)), Pune Chapter, the
          school continuously encourages students and faculty members to
          pursue professional development and prepare for their expected
          career paths. Highly qualified faculty members from multidisciplinary
          backgrounds and fields allied to Food Technology focus on its
          practical applications, enabling the school to contribute
          meaningfully to the food and allied sectors. As a recipient of the
          Sahyadri Award, the school, supported by a committed and passionate
          university management dedicated to quality education, continues to
          strengthen its reputation and maintain the trust of stakeholders
          in the field of Food Technology.
        </p>
      </div>
    </div>
  );
};

export default PrincipalMSG;
