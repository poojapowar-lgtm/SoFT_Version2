import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../../utils/apiBase";

const API_URL = `${API_BASE}/api/funded-research`;

const FundedProjects = () => {
    const [projects, setProjects] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ================= FORMAT ACADEMIC YEAR =================
    const formatAcademicYear = (year) => {
        const startYear = Number(year);
        const endYear = startYear + 1;

        return `${startYear}-${endYear}`;
    };

    // ================= FETCH AVAILABLE YEARS =================
    useEffect(() => {
        const fetchYears = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(`${API_URL}/years`);

                const years = Array.isArray(response.data)
                    ? [...new Set(
                        response.data
                            .map(String)
                            .filter((year) => /^\d{4}$/.test(year))
                    )].sort((a, b) => Number(b) - Number(a))
                    : [];

                setAvailableYears(years);

                if (years.length > 0) {
                    setSelectedYear(years[0]);
                } else {
                    setProjects([]);
                    setLoading(false);
                }
            } catch (error) {
                console.error(
                    "Error fetching funded research years:",
                    error.response?.data || error.message
                );

                setError("Unable to load funded research years.");
                setLoading(false);
            }
        };

        fetchYears();
    }, []);

    // ================= FETCH PROJECTS BY SELECTED YEAR =================
    useEffect(() => {
        if (!selectedYear) return;

        let isMounted = true;

        const fetchProjects = async () => {
            try {
                setLoading(true);
                setError("");
                setProjects([]);

                const response = await axios.get(
                    `${API_URL}/year/${selectedYear}`
                );

                if (isMounted) {
                    setProjects(
                        Array.isArray(response.data) ? response.data : []
                    );
                }
            } catch (error) {
                console.error(
                    "Error fetching funded research projects:",
                    error.response?.data || error.message
                );

                if (isMounted) {
                    setProjects([]);
                    setError("Unable to load funded research projects.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProjects();

        return () => {
            isMounted = false;
        };
    }, [selectedYear]);

    // ================= TABLE =================
    const renderProjectTable = () => (
        <div className="table-responsive">
            <table className="common-table">
                <thead>
                    <tr>
                        <th>Sr. No.</th>
                        <th>Name of Faculty</th>
                        <th>Project Name</th>
                    </tr>
                </thead>

                <tbody>
                    {projects.length > 0 ? (
                        projects.map((item, index) => (
                            <tr key={item.id ?? index}>
                                <td>{item.sr_no ?? index + 1}</td>
                                <td>{item.faculty_name || "-"}</td>
                                <td>{item.project_name || "-"}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3">
                                No funded research projects available for{" "}
                                {formatAcademicYear(selectedYear)}.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <h2 className="innerpage-title">
                Funded Research Projects
            </h2>

            {/* DYNAMIC ACADEMIC YEAR BUTTONS */}
            {availableYears.length > 0 && (
                <div className="page-content-btns">
                    {availableYears.map((year) => (
                        <button
                            key={year}
                            type="button"
                            className={`btn ${
                                selectedYear === year ? "active" : ""
                            }`}
                            onClick={() => setSelectedYear(year)}
                        >
                            {formatAcademicYear(year)}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <p>Loading funded research projects...</p>
            ) : error ? (
                <p>{error}</p>
            ) : availableYears.length === 0 ? (
                <p>No funded research projects available.</p>
            ) : (
                <>
                    <h3 className="table-title">
                        Funded Research Projects{" "}
                        {formatAcademicYear(selectedYear)}
                    </h3>

                    {renderProjectTable()}
                </>
            )}
        </div>
    );
};

export default FundedProjects;
