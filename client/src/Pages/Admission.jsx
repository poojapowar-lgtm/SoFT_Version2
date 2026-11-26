import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import InnerBanner from "../Components/inner_banner/InnerBanner";
import Sidebar from "../Components/sidebar/Sidebar";
import SEOMeta from "../Components/SEO/SEOMeta";
import "./pages.css";

const Admission = () => {
    const location = useLocation();

const menu = [
    { name: "Admission Announcement", path: "annoucement" },
    { name: "Admission Schedule", path: "schedule" },
    { name: "Eligibility", path: "eligibility" },
    { name: "Admission Procedure", path: "procedure" },
    { name: "Fee Structure", path: "fee-structure" },
    { name: "Scholarship Details", path: "scholarship" },
    { name: "FAQs", path: "faq" },
];

// Title mapping
const titleMap = {
    "annoucement": "Admission Announcement",
    "schedule": "Admission Schedule",
    "eligibility": "Eligibility",
    "procedure": "Admission Procedure",
    "fee-structure": "Fee Structure",
    "scholarship": "Scholarship Details",
    "faq": "FAQs",
};


    // Get dynamic title based on route
    const getTitle = () => {
        const matchedKey = Object.keys(titleMap).find((key) =>
            location.pathname.includes(key),
        );

        return matchedKey ? titleMap[matchedKey] : "Admission Procedure";
    };

    const title = getTitle();

    const bgImage = "/assets/banner_gif/inner_bnr.jpg";

    const breadcrumbs = [
        { name: "Admissions", path: "/admissions/annoucement" },
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

export default Admission;
