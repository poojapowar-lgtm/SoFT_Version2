import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Recruiters.css";

const Recruiters = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/recruiters")
      .then((res) => {
        console.log("API DATA:", res.data); // CHECK THIS
        setData(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <section className="recruiters">
      <div className="logo-slider">
        <div className="logo-track">
          {[...data, ...data].map((item, index) => (
            <div className="logo-card" key={index}>
              <img
                src={`http://localhost:5000/uploads/${item.logo}`}
                alt={item.company_name}
                width="300"
                height="100"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Recruiters;