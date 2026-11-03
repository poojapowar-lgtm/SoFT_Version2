
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/consultancy-projects";

const Consultancy = () => {
  const [activeYear, setActiveYear] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [consultancyData, setConsultancyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= FETCH AVAILABLE YEARS =================
  useEffect(() => {
    const fetchYears = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_URL}/years`);

        const years = [
          ...new Set(
            (Array.isArray(response.data) ? response.data : [])
              .map((year) => String(year))
              .filter((year) => /^\d{4}$/.test(year))
          ),
        ].sort((a, b) => Number(b) - Number(a));

        setAvailableYears(years);

        if (years.length > 0) {
          setActiveYear(years[0]);
        } else {
          setActiveYear("");
          setConsultancyData([]);
        }
      } catch (err) {
        console.error(
          "Error fetching consultancy years:",
          err.response?.data || err.message
        );

        setError("Unable to load consultancy project years.");
      } finally {
        setLoading(false);
      }
    };

    fetchYears();
  }, []);

  // ================= FETCH DATA BY YEAR =================
  useEffect(() => {
    if (!activeYear) return;

    let isMounted = true;

    const fetchConsultancyData = async () => {
      try {
        setLoading(true);
        setError("");
        setConsultancyData([]);

        const response = await axios.get(
          `${API_URL}/year/${activeYear}`
        );

        if (isMounted) {
          setConsultancyData(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (err) {
        console.error(
          "Error fetching consultancy projects:",
          err.response?.data || err.message
        );

        if (isMounted) {
          setError("Unable to load consultancy project data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchConsultancyData();

    return () => {
      isMounted = false;
    };
  }, [activeYear]);

  // ================= RENDER TABLE =================
  const renderTable = (data) => (
    <div className="table-responsive">
      <table className="common-table">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Name of Faculty</th>
            <th>Project name</th>
            <th>Year</th>
          </tr>
        </thead>

        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={item.id || index}>
                <td>{item.sr_no ?? index + 1}</td>
                <td>{item.faculty_name || "-"}</td>
                <td>{item.project_name || "-"}</td>
                <td>{item.year || "-"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">
                No consultancy projects available for {activeYear}.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="consultancy-container">
      <h2 className="innerpage-title">Consultancy Areas</h2>

      {/* DYNAMIC YEAR BUTTONS */}
      <div className="page-content-btns">
        {availableYears.map((year) => {
          const nextYear = Number(year) + 1;

          return (
            <button
              key={year}
              type="button"
              className={
                activeYear === year ? "btn active" : "btn"
              }
              onClick={() => setActiveYear(year)}
            >
              {year}-{nextYear}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p>Loading consultancy projects...</p>
      ) : error ? (
        <p>{error}</p>
      ) : availableYears.length === 0 ? (
        <p>No consultancy project years available.</p>
      ) : (
        <>
          <h3 className="table-title">
            Consultancy Projects {activeYear}-{Number(activeYear) + 1}
          </h3>

          {renderTable(consultancyData)}
        </>
      )}
    </div>
  );
};

export default Consultancy;
