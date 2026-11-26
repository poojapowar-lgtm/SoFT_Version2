import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import InnerBanner from "../Components/inner_banner/InnerBanner";
import Sidebar from "../Components/sidebar/Sidebar";
import "./pages.css";
import SEOMeta from "../Components/SEO/SEOMeta";

const AboutUs = () => {
  const location = useLocation();

  const menu = [
    { name: "About MIT-ADT", path: "about-mit" },
    { name: "Founder's Message", to: "/aboutus/founder-message" },
    { name: "Exec. President's Message", to: "/aboutus/president-message" },
    { name: "About SoFT", path: "about-soft" },
    { name: "Principal's Message", path: "principal-message" },
    { name: "Board of Management", path: "board-of-management" },
    { name: "Governing Body", path: "governing-body" },
  ];

  // Title mapping
  const titleMap = {
    "about-mit": "About MIT-ADT",
    "founder-message": "Founder's Message",
    "president-message": "Exec. President's Message",
    "about-soft": "About SoFT",
    "principal-message": "Principal's Message",
    "board-of-management": "Board of Management",
    "governing-body": "Governing Body",
  };


  // Get dynamic title based on route
  const getTitle = () => {
    const matchedKey = Object.keys(titleMap).find((key) =>
      location.pathname.includes(key),
    );

    return matchedKey ? titleMap[matchedKey] : "About MIT-ADT";
  };

  const title = getTitle();

  const bgImage = "/assets/banner_gif/inner_bnr.jpg";

  const breadcrumbs = [
    { name: "About", path: "/aboutus/about-mit" },
    { name: title, path: location.pathname },
  ];

  return (
    <>
      <SEOMeta title={title} path={location.pathname} breadcrumbs={breadcrumbs} />
      <InnerBanner bgImage={bgImage} title={title} />

      <div className="page-layout">
        <div className="page-content">
          <Outlet />
        </div>

        <Sidebar menuItems={menu} />
      </div>
    </>
  );
};

export default AboutUs;
