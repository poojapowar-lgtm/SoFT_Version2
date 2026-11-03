
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../PageContent/HomeComponent/News/news.css";

const ExamSchedule = () => {
    const [examSchedule, setExamSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchExamSchedule = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:5000/api/examination-schedule"
                );

                setExamSchedule(
                    Array.isArray(response.data) ? response.data : []
                );
            } catch (err) {
                console.error("Error fetching examination schedule:", err);
                setError("Unable to load the examination schedule. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchExamSchedule();
    }, []);

    return (
        <div>
            <h2 className="innerpage-title">Examination Schedule</h2>

            <div className="table-responsive">
                {loading ? (
                    <p>Loading examination schedule...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : examSchedule.length === 0 ? (
                    <p>No examination schedule available.</p>
                ) : (
                    <table className="common-table">
                        <thead>
                            <tr>
                                <th>Examination</th>
                                <th>Odd Semester (Sem III, V & VII)</th>
                                <th>Even Semester (Sem IV, VI & VIII)</th>
                            </tr>
                        </thead>

                        <tbody>
                            {examSchedule.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.examination}</td>
                                    <td>{item.odd_semester}</td>
                                    <td>{item.even_semester}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ExamSchedule;
