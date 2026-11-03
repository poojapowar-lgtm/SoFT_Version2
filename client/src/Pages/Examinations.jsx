import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import InnerBanner from "../Components/inner_banner/InnerBanner";
import Sidebar from "../Components/sidebar/Sidebar";
import SEOMeta from "../Components/SEO/SEOMeta";
import "./pages.css";

const Examinations = () => {
  const location = useLocation();

const menu = [
    { name: "Examinations Schedule", path: "examinations-schedule" },
    { name: "Examination Notices", path: "exam-notice" },
    { name: "Academics Notices", path: "academics-notice" },
];

// Title mapping
const titleMap = {
    "examinations-schedule": "Examinations Schedule",
    "exam-notice": "Examination Notices",
    "academics-notice": "Academics Notices",
};


  // Get dynamic title based on route
  const getTitle = () => {
    const matchedKey = Object.keys(titleMap).find((key) =>
      location.pathname.includes(key),
    );

    return matchedKey ? titleMap[matchedKey] : "Activities";
  };

  const title = getTitle();

  const bgImage = "/assets/banner_gif/inner_bnr.jpg";

  return (
    <>
      <SEOMeta title={title} path={location.pathname} />
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

export default Examinations;
