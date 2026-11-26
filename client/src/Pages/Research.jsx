import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import InnerBanner from "../Components/inner_banner/InnerBanner";
import Sidebar from "../Components/sidebar/Sidebar";
import SEOMeta from "../Components/SEO/SEOMeta";
import "./pages.css";

const Research = () => {
  const location = useLocation();

const menu = [
    { name: "School Research Committee", path: "board-of-research" },
    { name: "Research Paper Publication", path: "research-paper-publication" },
    { name: "PhD Admissions", path: "phd-admissions" },
    { name: "Patent & Publications", path: "Patent-publications" },
    { name: "Funded Projects", path: "funded-projects" },
    { name: "Consultancy & Training", path: "consultancy-training" },
];

// Title mapping
const titleMap = {
    "board-of-research": "School Research Committee",
    "research-paper-publication": "Research Paper Publication",
    "phd-admissions": "PhD Admissions",
    "Patent-publications": "Patent & Publications",
    "funded-projects": "Funded Projects",
    "consultancy-training": "Consultancy & Training",
};


  // Get dynamic title based on route
  const getTitle = () => {
    const matchedKey = Object.keys(titleMap).find((key) =>
      location.pathname.includes(key),
    );

    return matchedKey ? titleMap[matchedKey] : "Board of Research";
  };

  const title = getTitle();

  const bgImage = "/assets/banner_gif/inner_bnr.jpg";

  const breadcrumbs = [
    { name: "Research", path: "/research/board-of-research" },
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

export default Research;
