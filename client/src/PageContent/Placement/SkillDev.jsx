import React from "react";
import "./skill.css";

const SkillDev = () => {

const section1 = [
  "The School of Food Technology conducted a pre-placement group discussion and professional skills development session for final-year M.Tech. students specializing in Food Technology and Food Safety & Quality Management (FSQM).",
  "Session Title: Pre-Placement Group Discussion & Professional Skills Development",
  "Conducted By: SCIL Expert Team",
  "Session Expert/Trainer: Prof. Anuradha Swain, Practice Leader – Professional Skills",
  "The session was specifically designed to prepare M.Tech. students for group discussion (GD) rounds and enhance their professional skills. The training included mind games, discussions on current and anticipated GD topics, and insights into industry HR professionals' expectations during GD rounds. It also aimed to develop leadership qualities, initiative, confidence, teamwork, and professional etiquette among students.",
];

const section2 = [
  "A special career advancement session was organized for M.Tech. students specializing in Food Technology and Food Safety & Quality Management (FSQM). The session included group discussion exercises and mock personal interviews to prepare students for the upcoming Döhler India placement drive for the position of Specialist – Product Documentation.",
  "The session was effectively conducted by the SCIL expert team and received positive feedback from students. Participants found the experience valuable in preparing for the upcoming placement process. The interactive format and expert feedback helped strengthen students' confidence and interview readiness.",
];

const section3 = [
  "A special session on soft skills, career readiness, and behavioral skills was conducted by the expert team from the MIT School of Corporate Innovation & Leadership (SCIL). The session was led by Ms. Sherin Mathew, an experienced corporate trainer and skill development expert, with the objective of enhancing students' professional competencies and industry readiness.",
  "The session focused on developing essential employability skills needed to succeed in today's competitive corporate environment.",
];

const keyAreas = [
  "Effective communication skills",
  "Professional etiquette and workplace behavior",
  "Personality development and confidence building",
  "Teamwork and leadership skills",
  "Interview techniques and career planning",
  "Emotional intelligence and a positive attitude",
];


  const images1 = [
    { src: "/assets/images/skills-1.webp", alt: "Pre-Placement Group Discussion Session - MIT SoFT", title: "Pre-Placement Group Discussion" },
    { src: "/assets/images/skills-2.webp", alt: "Professional Skill Development Session - MIT SoFT", title: "Professional Skill Development" },
  ];

  const images2 = [
    { src: "/assets/images/skills-3.webp", alt: "Mock Personal Interview Practice - MIT SoFT", title: "Mock Personal Interview Practice" },
    { src: "/assets/images/skills-4.webp", alt: "Group Discussion Practice for Placement - MIT SoFT", title: "Group Discussion Practice" },
  ];

  const images3 = [
    { src: "/assets/images/skills-5.webp", alt: "Soft Skills and Career Readiness Session - MIT SoFT", title: "Soft Skills and Career Readiness" },
    { src: "/assets/images/skills-6.webp", alt: "Behavioral Skills Training Session - MIT SoFT", title: "Behavioral Skills Training" },
  ];

  const renderList = (data) => (
    <ul className="page-list">
      {data.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );

  const renderImages = (imageList) => (
    <div className="skill-image-wrapper">
      {imageList.map((img, i) => (
        <img
          key={i}
          src={img.src}
          alt={img.alt}
          width="400"
          height="250"
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );

  return (
    <div className="skill-container">
      <h2 className="innerpage-title">Skill Development Program</h2>
      <div className="skill-grid">
        {renderList(section1)}
        {renderImages(images1)}

        {renderList(section2)}
        {renderImages(images2)}



        {renderList(section3)}


        <h3 className="innerpage-subtitle">
          Key areas covered during the session included:
        </h3>
        {renderList(keyAreas)}
        {renderImages(images3)}
      </div>
    </div>
  );
};

export default SkillDev;