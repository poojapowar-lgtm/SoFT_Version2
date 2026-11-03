import React from "react";
import { MdOutlineDone } from "react-icons/md";

const Facilities = () => {

    // libraryData
    const libraryData = {
        title: "Library Resources & Facilities",
        details:
            "The library houses more than 5,000 books covering Food Technology and allied disciplines, including Food Microbiology, Biotechnology, Food Processing, Food Engineering, and Food Business Management. The collection is classified according to the Dewey Decimal Classification (DDC) system.",
        sections: [
            {
                subtitle: "Library Resources & Facilities",
                list: [
                    "Dedicated book-stacking, periodicals, reference, and digital library sections",
                    "20 digital library terminals",
                    "Well-ventilated reading halls with seating capacity for more than 250 students",
                    "Access to international research journals",
                    "Intranet-enabled digital resources",
                ],
            },
            {
                subtitle: "Library Services",
                list: [
                    "Catalogue searches, book reservations, and circulation are managed through TCS iON ERP and barcode technology",
                    "An OPAC (Online Public Access Catalogue) facility is available for searching library resources",
                ],
            },
            {
                subtitle: "Library Membership & Circulation",
                list: [
                    "Students and staff receive a user ID and password through TCS iON",
                    "Books can be borrowed using valid library credentials and the borrower's roll number or employee number",
                    "Undergraduate and postgraduate students: 4 books for 15 days",
                    "Research scholars: 4 books for 15 days",
                ],
            },
            {
                subtitle: "Library Rules & Regulations",
                list: [
                    "Books must be returned within the prescribed 15-day borrowing period. Reissue may be permitted depending on demand and availability.",
                    "An overdue fine of ₹25 per day per book may be imposed for late returns.",
                    "Borrowers are responsible for lost or damaged library materials and must report any such incident to the librarian immediately.",
                    "Lost or damaged books must be replaced with the latest edition or handled according to library rules.",
                    "Reference books may be consulted only in the designated reference section and cannot be borrowed for home use.",
                    "Library timings: Book Issue Counter: 8:30 AM–6:30 PM; Reading Hall: 8:00 AM–8:00 PM",
                ],
            },
        ],
    };

    // canteenData
    const canteenData = {
        title: "Canteen & Mess Facilities",
        details:
            "MIT-ADT University provides hygienic, student-friendly dining facilities that offer safe, nutritious, and quality meals. These facilities promote balanced nutrition and support students' overall well-being.",
        sections: [
            {
                list: [
                    "Separate hostel facilities for boys and girls",
                    "24/7 water and electricity supply",
                    "Wi-Fi-enabled campus",
                ],
            },
        ],
    };


    // centralData
    const centralData = {
        title: "Central Campus Facilities",
        details:
            "The university provides a range of campus facilities designed to support students' academic needs, health, convenience, and overall well-being.",
        sections: [
            {
                list: [
                    "A green campus with modern infrastructure",
                    "Central library and sports complex",
                    "Shuttle services within the campus",
                    "Banking, ATM, medical, and grooming facilities",
                ],
            },
        ],
    };

    // hostelData
    const hostelData = {
        title: "Hostel Facilities",
        details:
            'MIT-ADT University offers safe, secure, and well-equipped hostel accommodation for boys and girls, creating a "home away from home" environment that promotes discipline and holistic development.',
        sections: [
            {
                subtitle: "Accommodation & Availability",
                list: [
                    "On-campus hostels: 7 for boys and girls",
                    "Off-campus girls' hostels: 8",
                    "Off-campus boys' hostels: 9",
                    "Rooms available in 2-, 3-, 4-, and 6-sharing configurations",
                ],
            },
            {
                subtitle: "Key Features & Amenities",
                list: [
                    "24/7 security with CCTV surveillance",
                    "Well-furnished rooms with essential furniture",
                    "Wi-Fi, an uninterrupted power supply, and RO-purified drinking water",
                    "Solar or electric geysers for hot water",
                    "Recreation rooms and indoor games",
                    "Laundry and common utility facilities",
                ],
            },
            {
                subtitle: "Additional Services",
                list: [
                    "Mess and transport facilities for off-campus hostels",
                    "Daily transportation to campus",
                    "Centralized hostel admission system",
                ],
            },
            {
                subtitle: "Hostel Environment",
                list: [
                    "Promotes cultural diversity and peer interaction",
                    "Encourages discipline and independent living",
                    "Supports holistic student development",
                ],
            },
        ],
    };


    // const campusData = [canteenData, centralData];

    return (
        <div>
            <h2 className="innerpage-title">Facilities</h2>

            {/* CANTEEN DATA */}
            <div className="future-container">
                <div className="pg-outcomes-container">

                    {/* Canteen */}
                    <div className="pg-outcomes-item" key="canteen">
                        <div className="pg-outcomes-number">1</div>

                        <div className="pg-outcomes-card">
                            <h3 className="innerpage-subtitle" style={{ margin: "0px" }}>
                                {canteenData.title}
                            </h3>

                            {canteenData.details && <p>{canteenData.details}</p>}

                            {canteenData.sections?.map((sec, i) => (
                                <div key={i} className="facility-section">
                                    {sec.subtitle && (
                                        <p><strong>{sec.subtitle}</strong></p>
                                    )}

                                    {sec.desc && <p>{sec.desc}</p>}

                                    {sec.list && (
                                        <ul className="page-list">
                                            {sec.list.map((item, j) => (
                                                <li key={j}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Central Mess */}
                    <div className="pg-outcomes-item" key="central">
                        <div className="pg-outcomes-number">2</div>

                        <div className="pg-outcomes-card">
                            <h3 className="innerpage-subtitle" style={{ margin: "0px" }}>
                                {centralData.title}
                            </h3>

                            {centralData.details && <p>{centralData.details}</p>}

                            {centralData.sections?.map((sec, i) => (
                                <div key={i} className="facility-section">
                                    {sec.subtitle && (
                                        <p><strong>{sec.subtitle}</strong></p>
                                    )}

                                    {sec.desc && <p>{sec.desc}</p>}

                                    {sec.list && (
                                        <ul className="page-list">
                                            {sec.list.map((item, j) => (
                                                <li key={j}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Library */}
                    <div className="pg-outcomes-item" key="library">
                        <div className="pg-outcomes-number">3</div>

                        <div className="pg-outcomes-card">
                            <h3 className="innerpage-subtitle" style={{ margin: "0px" }}>
                                {libraryData.title}
                            </h3>

                            {libraryData.details && <p>{libraryData.details}</p>}

                            <div className="campus-grid">
                                {libraryData.sections?.map((sec, i) => (
                                    <div key={i} className="section-card">
                                        {sec.subtitle && (
                                            <p><strong>{sec.subtitle}</strong></p>
                                        )}

                                        {sec.desc && <p>{sec.desc}</p>}

                                        {sec.list && (
                                            <ul className="page-list">
                                                {sec.list.map((item, j) => (
                                                    <li key={j}>{item}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Hostel */}
                    <div className="pg-outcomes-item" key="hostel">
                        <div className="pg-outcomes-number">4</div>

                        <div className="pg-outcomes-card">
                            <h3 className="innerpage-subtitle" style={{ margin: "0px" }}>
                                {hostelData.title}
                            </h3>

                            {hostelData.details && <p>{hostelData.details}</p>}

                            <div className="campus-grid">
                                {hostelData.sections?.map((sec, i) => (
                                    <div key={i} className="section-card">
                                        {sec.subtitle && (
                                            <p><strong>{sec.subtitle}</strong></p>
                                        )}

                                        {sec.desc && <p>{sec.desc}</p>}

                                        {sec.list && (
                                            <ul className="page-list">
                                                {sec.list.map((item, j) => (
                                                    <li key={j}>{item}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                    <div className="pg-outcomes-number"><MdOutlineDone /></div>
                </div>
            </div>

        </div>
    );
};

export default Facilities;