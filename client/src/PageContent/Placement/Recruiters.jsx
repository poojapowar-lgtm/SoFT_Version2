import React, { useEffect, useState } from "react";
import axios from "axios";
import "./recruiters.css";
import API_BASE from "../../utils/apiBase";

const Recruiters = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/recruiters`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="recruiters-page">
      <h2 className="innerpage-title">Esteemed Recruiters</h2>

      <div className="recruiters-grid">
        {data.map((item, index) => (
          <div className="recruiter-card" key={index}>
            <img
              src={`${API_BASE}/uploads/${item.logo}`}
              alt={item.company_name}
              width="220"
              height="100"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recruiters;