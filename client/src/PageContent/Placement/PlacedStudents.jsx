import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../../utils/apiBase";
// import "./placedstudents.css";

const PlacedStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `${API_BASE}/api/placed-students`,
        { timeout: 15000 }
      );

      if (!Array.isArray(res.data)) {
        throw new Error("Invalid API response");
      }

      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching placed students:", err);

      setError(
        err.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : "Unable to load placed students. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const validStudents = students.filter(
    (item) =>
      typeof item.name === "string" &&
      item.name.trim() !== ""
  );

  return (
    <div className="research-container">
      <h2 className="innerpage-title">Placed Students</h2>

      {!loading && !error && (
        <p>
          Total Placed Students: <strong>{students.length}</strong>
        </p>
      )}

      <div className="table-responsive">
        <table className="common-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Photo</th>
              <th>Name of Student</th>
              <th>Discipline</th>
              <th>Industry / Organization</th>
              <th>Package (LPA)</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  Loading placement records...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  {error}
                  <br />
                  <button
                    type="button"
                    onClick={fetchStudents}
                    style={{ marginTop: "10px", cursor: "pointer" }}
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No data available
                </td>
              </tr>
            ) : (
              students.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>

                  <td>
                    {item.photo ? (
                      <img
                        src={`${API_BASE}/uploads/${item.photo}`}
                        alt={item.name || "Student"}
                        className="student-img"
                        width="100"
                        height="80"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="no-img">N/A</span>
                    )}
                  </td>

                  <td>
                    {item.name?.trim() || "Name unavailable"}
                  </td>

                  <td>{item.discipline || "N/A"}</td>
                  <td>{item.organization || "N/A"}</td>
                  <td>{item.package_lpa ?? "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlacedStudents;
