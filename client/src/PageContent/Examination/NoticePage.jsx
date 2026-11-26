import React, { useEffect, useState } from "react";
import "../../PageContent/HomeComponent/News/news.css";
import axios from "axios";
import API_BASE from "../../utils/apiBase";

const NoticePage = ({ type, title }) => {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    fetchNotices();
  }, [type]);

  const fetchNotices = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/news?type=${type}`
      );
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = date
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();

    return { day, month };
  };

  return (
    <div className="notice-page">
      <h2 className="innerpage-title">{title}</h2>

      {notices.length === 0 ? (
        <p>No notices available</p>
      ) : (
        notices.map((item) => {
          const dateObj = formatDate(
            item.date || item.created_at || item.notice_date
          );

          return (
            <div className="notice-card" key={item.id}>

              {/* DATE BLOCK */}
              {dateObj && (
                <div className="date-card">
                  <span className="day">{dateObj.day}</span>
                  <span className="month">{dateObj.month}</span>
                </div>
              )}

              {/* TITLE */}
              <p>{item.title}</p>

              {/* FILE LINK */}
              {item.file_path && (
                <a
                  href={`${API_BASE}${item.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`View PDF: ${item.title}`}
                  className="notice-link"
                >
                  {item.link_text || "View PDF"}
                </a>
              )}

              {/* URL LINK */}
              {!item.file_path && item.link_url && (
                <a
                  href={item.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="notice-link"
                >
                  {item.link_text || "Open Link"}
                </a>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default NoticePage;