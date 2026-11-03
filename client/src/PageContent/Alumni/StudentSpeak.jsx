import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    TbPlayerTrackPrevFilled,
    TbPlayerTrackNextFilled,
} from "react-icons/tb";
import "./StudentSpeak.css";
import "../HomeComponent/PlacedStd.css";


const StudentSpeak = () => {
    const [data, setData] = useState([]);
    const [index, setIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const sliderRef = useRef(null); //  FIX

    useEffect(() => {
        axios
            .get("http://localhost:5000/api/student-speak")
            .then((res) => setData(res.data))
            .catch((err) => console.error(err));
    }, []);

    const getItemsPerView = () => (window.innerWidth <= 768 ? 1 : 2);

    const maxIndex = Math.max(0, data.length - getItemsPerView());

    const scrollLeft = () => {
        setIndex((prev) => Math.max(0, prev - 1));
    };

    const scrollRight = () => {
        setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    };
    const visibleData = data.slice(index, index + getItemsPerView());

    useEffect(() => {
        if (isPaused || data.length === 0) return;

        const interval = setInterval(() => {
            const items = getItemsPerView();
            setIndex((prev) =>
                prev + items >= data.length ? 0 : prev + 1
            );
        }, 3000);

        return () => clearInterval(interval);
    }, [isPaused, data]);

    return (
        <div>
            <h2 className="innerpage-title">Alumni Success Stories</h2>

            <div className="speak-slider-wrapper">

                <div
                    className="speak-slider"
                    ref={sliderRef}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {visibleData.length > 0 ? (
                        visibleData.map((item) => (
                            <div className="speak-card" key={item.id}>

                                {/* TOP ROW */}
                                <div className="speak-top">
                                    {/* IMAGE */}
                                    <div className="speak-left">
                                        <img
                                            src={
                                                item.image
                                                    ? `http://localhost:5000/uploads/${item.image}`
                                                    : "/default-user.webp"
                                            }
                                            alt={item.image_alt || item.name}
                                            title={item.image_title || item.name}
                                        />
                                    </div>

                                    {/* CONTENT */}
                                    <div className="speak-right">
                                        <h3 className="student-name">{item.name}</h3>
                                        <ul className="speak-list">
                                            <li>{item.degree_specialization || ""}</li>
                                            <li>{item.year_of_passing || ""}</li>
                                            <li><strong>Designation :</strong> {item.designation || ""}</li>
                                            <li><strong>Company :</strong> {item.company || ""}</li>
                                        </ul>
                                    </div>

                                </div>

                                {/* MESSAGE */}
                                <p className="speak-message">
                                    {expanded
                                        ? item.message
                                        : `${item.message?.substring(0, 400)}${item.message?.length > 400 ? "..." : ""}`}

                                    {item.message?.length > 400 && (
                                        <button
                                            onClick={() => setExpanded(!expanded)}
                                            className="read-more"
                                        >
                                            {expanded ? "Read Less" : "Read More"}
                                        </button>
                                    )}
                                </p>

                            </div>
                        ))
                    ) : (
                        <p>No data available</p>
                    )}
                </div>

                {/* DOTS */}
                <div className="dots">
                    {data.map((_, i) => (
                        <span
                            key={i}
                            className={`dot ${index === i ? "active" : ""}`}
                            onClick={() => setIndex(i)}
                        ></span>
                    ))}
                </div>

                {/* NAV BUTTONS */}
                <div className="nav-buttons">
                    <button
                        type="button"
                        onClick={scrollLeft}
                        disabled={index === 0}
                        aria-label="Previous alumni story"
                    >
                        <TbPlayerTrackPrevFilled />
                    </button>

                    <button
                        type="button"
                        onClick={scrollRight}
                        disabled={index >= maxIndex}
                        aria-label="Next alumni story"
                    >
                        <TbPlayerTrackNextFilled />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentSpeak;