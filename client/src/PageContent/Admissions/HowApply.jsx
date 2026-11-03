import React from "react";
import "./admission.css";

const HowApply = () => {

const cardData = [
    {
        logo: "https://cdn-icons-png.flaticon.com/512/1828/1828919.webp",
        title: "Meet the academic eligibility requirements for the selected program.",
    },
    {
        logo: "https://cdn-icons-png.flaticon.com/512/1828/1828911.webp",
        title: "Appear for an accepted entrance examination (MHT-CET, JEE, NEET, CUET, GATE, or PERA CET), as applicable to the program.",
    },
    {
        logo: "https://cdn-icons-png.flaticon.com/512/1828/1828906.webp",
        title: "Apply through the university admission portal (www.mituniversity.ac.in).",
    },
    {
        logo: "https://cdn-icons-png.flaticon.com/512/1828/1828925.webp",
        title: "Attend an interview if shortlisted.",
    },
    {
        logo: "https://cdn-icons-png.flaticon.com/512/1828/1828940.webp",
        title: "The merit list is prepared based on Class 12, undergraduate, or postgraduate marks, entrance examination scores, and interview performance, as applicable to the program and university norms.",
    },
    {
        logo: "https://cdn-icons-png.flaticon.com/512/1828/1828961.webp",
        title: "Complete document verification and pay the applicable fees.",
    },
];


  return (
    <div className="howapply-container">
      <h2 className="innerpage-title">How To Apply</h2>

      <div className="card-grid">
        {cardData.map((card, index) => (
          <div className="apply-card" key={index}>
            <img src={card.logo} alt={card.title} className="card-logo" />
            <h3 className="card-title">{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowApply;