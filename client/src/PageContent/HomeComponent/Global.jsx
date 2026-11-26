import React from "react";
import "./global.css";
// import Facilities from "./Facilities";

const Global = () => {

  const globalData = [
    {
      icon: "/assets/images/icons/hunger.webp",
      title: "Zero Hunger",
    },
    {
      icon: "/assets/images/icons/global-warming.webp",
      title: "Climate Action",
    },
    {
      icon: "/assets/images/icons/responsible-consumption.webp",
      title: "Sustainable Consumption",
    },
    {
      icon: "/assets/images/icons/heart.webp",
      title: "Good Health & Well-Being",
    },
    {
      icon: "/assets/images/icons/ecosystem.webp",
      title: "Life on Land",
    },
  ];

  return (
    <div className="global-main">
      <section className="global-section">
        <h2 className="title" style={{ textAlign: "center", margin: "0 auto" }}>
          Advancing <span>Global Sustainability</span>
        </h2>
        <h3 className="global-subtitle">Through Food Technology Education &
          Research</h3>

        <div className="global-container">
          {globalData.map((item, index) => (
            <div className="global-card" key={index}>
              <div className="global-icon">
                <img
                  src={item.icon}
                  alt={item.title}
                  width="65"
                  height="65"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <h4 className="global-title">{item.title}</h4>
            </div>
          ))}
        </div>
      </section>
      {/* <Facilities /> */}
    </div>

  );
};

export default Global;