import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../../utils/apiBase";

const API_URL = `${API_BASE}/api/student-grievance`;

const Grievance = () => {
    const [activeTab, setActiveTab] = useState("committee");
    const [committeeData, setCommitteeData] = useState([]);
    const [squadData, setSquadData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const grievanceTypes = {
        committee: "Anti-Ragging Committee",
        squad: "Anti-Ragging Squad",
    };

    // Fetch data for the selected category
    useEffect(() => {
        const fetchGrievanceData = async () => {
            try {
                setLoading(true);
                setError("");

                const category = grievanceTypes[activeTab];

                const response = await axios.get(API_URL, {
                    params: { category },
                });

                const records = Array.isArray(response.data)
                    ? response.data
                    : [];

                if (activeTab === "committee") {
                    setCommitteeData(records);
                } else {
                    setSquadData(records);
                }
            } catch (err) {
                console.error("Error fetching grievance data:", err);

                setError(
                    "Unable to load grievance data. Please try again later."
                );

                if (activeTab === "committee") {
                    setCommitteeData([]);
                } else {
                    setSquadData([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchGrievanceData();
    }, [activeTab]);

    const activeData =
        activeTab === "committee" ? committeeData : squadData;

    return (
        <div>
            <h2 className="innerpage-title">Student Grievance</h2>

            {/* Tab Buttons */}
            <div className="tab-buttons">
                <button
                    type="button"
                    className={`btn ${activeTab === "committee" ? "active" : ""
                        }`}
                    onClick={() => setActiveTab("committee")}
                >
                    Anti-Ragging Committee
                </button>

                <button
                    type="button"
                    className={`btn ${activeTab === "squad" ? "active" : ""
                        }`}
                    onClick={() => setActiveTab("squad")}
                >
                    Anti-Ragging Squad
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {loading ? (
                    <p>Loading grievance data...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : activeData.length === 0 ? (
                    <p>No records available.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="common-table">
                            <thead>
                                <tr>
                                    <th>Sr. No.</th>
                                    <th>Representative</th>
                                    <th>Name</th>
                                    <th>Designation</th>
                                    <th>Contact No.</th>
                                    <th>Email Address</th>
                                </tr>
                            </thead>

                            <tbody>
                                {activeData.map((row, index) => (
                                    <tr key={row.id ?? index}>
                                        <td>{index + 1}</td>

                                        <td>{row.representative || "-"}</td>

                                        <td>{row.name || "-"}</td>

                                        <td>{row.designation || "-"}</td>

                                        <td>
                                            {row.contact_no ? (
                                                <a
                                                    href={`tel:${row.contact_no.replace(
                                                        /[^\d+]/g,
                                                        ""
                                                    )}`}
                                                >
                                                    {row.contact_no}
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </td>

                                        <td>
                                            {row.email_address ? (
                                                <a href={`mailto:${row.email_address}`}>
                                                    {row.email_address}
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Grievance;