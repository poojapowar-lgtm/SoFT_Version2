import React, { useEffect, useState } from "react";
import axios from "axios";

const Governing_Body = () => {
  const [govboardData, setGovboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGoverningMembers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/members?type=governing"
        );

        setGovboardData(response.data);
      } catch (err) {
        console.error("Error fetching Governing Body members:", err);
        setError("Unable to load Governing Body members.");
      } finally {
        setLoading(false);
      }
    };

    fetchGoverningMembers();
  }, []);

  return (
    <>
      <h2 className="innerpage-title">Governing Body</h2>

      <div className="board-body-container">
        {loading ? (
          <p>Loading Governing Body members...</p>
        ) : error ? (
          <p>{error}</p>
        ) : govboardData.length === 0 ? (
          <p>No Governing Body members available.</p>
        ) : (
          govboardData.map((item) => (
            <div className="board-card" key={item.id}>
              <h3 className="board-name">{item.name}</h3>

              <p className="board-desg">{item.designation}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default Governing_Body;
