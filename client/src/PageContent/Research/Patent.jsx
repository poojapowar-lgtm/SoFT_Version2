
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/patent-publications";

const Patent = () => {
    const [activeYear, setActiveYear] = useState("");
    const [availableYears, setAvailableYears] = useState([]);
    const [patentData, setPatentData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPatentData = async () => {
            try {
                setLoading(true);
                setError("");

                const yearsResponse = await axios.get(`${API_URL}/years`);

                const years = Array.isArray(yearsResponse.data)
                    ? [...new Set(yearsResponse.data.map(String))]
                        .sort((a, b) => Number(b) - Number(a))
                    : [];

                setAvailableYears(years);

                if (years.length === 0) {
                    setPatentData({});
                    return;
                }

                setActiveYear(years[0]);

                const responses = await Promise.all(
                    years.map((year) =>
                        axios.get(`${API_URL}/year/${year}`)
                    )
                );

                const dataByYear = {};

                years.forEach((year, index) => {
                    dataByYear[year] = Array.isArray(responses[index].data)
                        ? responses[index].data
                        : [];
                });

                setPatentData(dataByYear);
            } catch (err) {
                console.error("Error fetching patent publications:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load patent publication data. Please try again later."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPatentData();
    }, []);

    const formatDate = (date) => {
        if (!date) return "-";

        const dateString = String(date).split("T")[0];

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(dateString) ||
            dateString === "0000-00-00"
        ) {
            return "-";
        }

        const [year, month, day] = dateString.split("-");
        return `${day}-${month}-${year}`;
    };

    const hasValue = (data, key) =>
        data.some((item) => {
            const value = item[key];

            if (
                value === null ||
                value === undefined ||
                String(value).trim() === ""
            ) {
                return false;
            }

            if (
                key === "publication_date" &&
                String(value).slice(0, 10) === "0000-00-00"
            ) {
                return false;
            }

            return true;
        });

    const renderPatentTable = (data) => {
        const columns = [
            { key: "sr_no", label: "Sr. No." },
            { key: "faculty_name", label: "Name of Faculty" },
            { key: "publication_date", label: "Patent Publication Date" },
            { key: "patent_title", label: "Title of Patent" },
            { key: "patent_number", label: "Patent No." },
            { key: "patent_status", label: "Patent Status" },
            { key: "patent_of_awarding", label: "Patent of Awarding" },
        ];

        const visibleColumns = columns.filter((column) =>
            hasValue(data, column.key)
        );

        const renderValue = (item, key, index) => {
            if (key === "sr_no") return item.sr_no ?? index + 1;
            if (key === "publication_date") {
                return formatDate(item.publication_date);
            }

            return item[key] || "-";
        };

        return (
            <div className="table-responsive">
                <table className="common-table">
                    <thead>
                        <tr>
                            {visibleColumns.map((column) => (
                                <th key={column.key}>{column.label}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {data.length > 0 ? (
                            data.map((item, index) => (
                                <tr key={item.id || index}>
                                    {visibleColumns.map((column) => (
                                        <td key={column.key}>
                                            {renderValue(item, column.key, index)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={Math.max(visibleColumns.length, 1)}>
                                    No patent publication data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const getAcademicYearLabel = (year) => {
        if (!year) return "No year available";

        return `${Number(year) - 1}-${year}`;
    };

    return (
        <div>
            <h2 className="innerpage-title">
                Patent Paper Publication
            </h2>

            {loading ? (
                <p>Loading patent publications...</p>
            ) : error ? (
                <p role="alert">{error}</p>
            ) : availableYears.length === 0 ? (
                <p>No patent publication years available.</p>
            ) : (
                <>
                    {/* DYNAMIC YEAR BUTTONS */}
                    <div className="page-content-btns">
                        {availableYears.map((year) => (
                            <button
                                key={year}
                                type="button"
                                className={
                                    activeYear === year
                                        ? "btn active"
                                        : "btn"
                                }
                                onClick={() => setActiveYear(year)}
                            >
                                {getAcademicYearLabel(year)}
                            </button>
                        ))}
                    </div>

                    <h3 className="table-title">
                        Patent Publication Year{" "}
                        {getAcademicYearLabel(activeYear)}
                    </h3>

                    {renderPatentTable(patentData[activeYear] || [])}
                </>
            )}
        </div>
    );
};

export default Patent;
