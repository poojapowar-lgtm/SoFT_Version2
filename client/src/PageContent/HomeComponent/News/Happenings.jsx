import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PiCalendarCheckFill  } from "react-icons/pi";
import API_BASE from "../../../utils/apiBase";

const Happenings = () => {
    const [happeningsData, setHappeningsData] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHappenings();
    }, []);

    const fetchHappenings = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/events`);

            setHappeningsData(
                Array.isArray(res.data) ? res.data : []
            );
        } catch (err) {
            console.error("Error fetching happenings:", err);
            setHappeningsData([]);
        }
    };

    // Safely get the first valid image path
    const getImagePath = (filePath) => {
        if (!filePath) return null;

        let paths = filePath;

        if (typeof filePath === "string") {
            try {
                paths = JSON.parse(filePath);
            } catch {
                paths = filePath;
            }
        }

        if (typeof paths === "string") {
            return paths.trim() || null;
        }

        if (Array.isArray(paths)) {
            const firstPath = paths.find(
                (path) => typeof path === "string" && path.trim() !== ""
            );

            return firstPath || null;
        }

        return null;
    };

    return (
        <div className="happenings">
            <div className="section-header">
                <h2 className="title">
                    <PiCalendarCheckFill  className="title-icon" />
                    Happenings
                </h2>

                <button
                    className="btn"
                    onClick={() => navigate("/campus-life/events")}
                >
                    View All
                </button>
            </div>

            <div className="happenings-scroll">
                <div className="happenings-track">
                    {[...happeningsData, ...happeningsData].map(
                        (item, index) => {
                            const imagePath = getImagePath(item?.file_path);

                            return (
                                <div
                                    className="happening-card"
                                    key={`${item?.id ?? item?.title ?? "event"}-${index}`}
                                    onClick={() =>
                                        navigate("/campus-life/events")
                                    }
                                    style={{ cursor: "pointer" }}
                                >
                                    {imagePath && (
                                        <img
                                            src={
                                                imagePath.startsWith("http")
                                                    ? imagePath
                                                    : `${API_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`
                                            }
                                            alt={item?.title || "Campus event"}
                                            width="1200"
                                            height="675"
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => {
                                                e.currentTarget.style.display =
                                                    "none";
                                            }}
                                        />
                                    )}

                                    <div className="overlay">
                                        <p className="happening-text">
                                            {item?.title || "Campus Event"}
                                        </p>
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>
        </div>
    );
};

export default Happenings;
