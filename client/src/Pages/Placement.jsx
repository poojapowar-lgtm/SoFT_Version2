import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import InnerBanner from "../Components/inner_banner/InnerBanner";
import Sidebar from "../Components/sidebar/Sidebar";
import SEOMeta from "../Components/SEO/SEOMeta";
import "./pages.css";

const Placement = () => {
    const location = useLocation();

const menu = [
    { name: "Placement Cell", path: "placement-cell" },
    { name: "Recruiters", path: "recruiters" },
    { name: "Placed Students", path: "placed-students" },
    { name: "Placement Statistics", path: "placement-statistics" },
    { name: "Skill Development Programs", path: "skill-development" },
    { name: "Internship Policy", path: "internship-policy" },
];

// Title mapping
const titleMap = {
    "placement-cell": "Placement Cell",
    "recruiters": "Recruiters",
    "placed-students": "Placed Students",
    "placement-statistics": "Placement Statistics",
    "skill-development": "Skill Development Programs",
    "internship-policy": "Internship Policy",
};

    // Get dynamic title based on route
    const getTitle = () => {
        const matchedKey = Object.keys(titleMap).find((key) =>
            location.pathname.includes(key),
        );

        return matchedKey ? titleMap[matchedKey] : "Placement Cell";
    };

    const title = getTitle();

    const bgImage = "/assets/banner_gif/inner_bnr.jpg";

    const breadcrumbs = [
        { name: "Placement", path: "/placement/placement-cell" },
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

export default Placement;
