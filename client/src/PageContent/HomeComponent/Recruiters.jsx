
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Recruiters.css";

const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const Recruiters = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/recruiters`)
      .then((res) => {
        setData(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error(
          "Error loading recruiters:",
          err.response?.data || err.message
        );
      });
  }, []);

  const getLogoUrl = (logo) => {
    if (!logo) return "";

    if (/^https?:\/\//i.test(logo)) {
      return logo;
    }

    const cleanPath = String(logo)
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    const uploadPath = cleanPath.startsWith("uploads/")
      ? cleanPath
      : `uploads/${cleanPath}`;

    return `${API_BASE_URL}/${uploadPath}`;
  };

  return (
    <section className="recruiters">
      <div className="logo-slider">
        <div className="logo-track">
          {[...data, ...data].map((item, index) => (
            <div className="logo-card" key={`${item.id || item.company_name}-${index}`}>
              <img
                src={getLogoUrl(item.logo)}
                alt={item.company_name || "Recruiter"}
                width="300"
                height="100"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Recruiters;
