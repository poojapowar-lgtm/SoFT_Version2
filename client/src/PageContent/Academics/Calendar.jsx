
import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../../utils/apiBase";

const Calendar = () => {
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= FETCH ACADEMIC CALENDAR =================
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/academic-calendar`
        );

        setCalendarData(res.data);
      } catch (err) {
        console.error("Error fetching academic calendar:", err);
        setError("Unable to load academic calendar. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, []);

  return (
    <div>
      <h2 className="innerpage-title">Academic Calendar</h2>

      {/* ACADEMIC PLANNERS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <div className="syllabus-section">
          <p>
            Academic Planner – First Year Onwards | A.Y. 2026–27
          </p>

          <a href="/assets/docs/Academic planner_1st year_2026-27.docx">
            <button className="btn" type="button">
              View Academic Planner
            </button>
          </a>
        </div>

        <div className="syllabus-section">
          <p>
            Academic Planner – Second Year Onwards | A.Y. 2026–27
          </p>

          <a href="/assets/docs/Academic plannner_2nd yr onwards_2026-27.docx">
            <button className="btn" type="button">
              View Academic Planner
            </button>
          </a>
        </div>
      </div>

      {/* ACADEMIC CALENDAR TABLE */}
      <div className="table-responsive">
        <table className="common-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Name of the Program</th>
              <th>Date and Event</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  Loading academic calendar...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan="3"
                  style={{ textAlign: "center", color: "red" }}
                >
                  {error}
                </td>
              </tr>
            ) : calendarData.length > 0 ? (
              calendarData.map((item, index) => (
                <tr key={item.id}>
                  <td>{item.sr_no || index + 1}</td>

                  <td className="calendar-table-name">
                    {item.program_name}
                  </td>

                  <td className="calendar-event-list">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: item.date_and_event || "",
                      }}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No academic calendar records available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Calendar;
