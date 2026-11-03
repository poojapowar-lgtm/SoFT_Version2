import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../Pages/board_body.css";

const BoardResearch = () => {
  const [ResearchBoardData, setResearchBoardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResearchCommittee = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/members?type=research_committee"
        );

        setResearchBoardData(response.data);
      } catch (err) {
        console.error("Error fetching Research Committee:", err);
        setError("Unable to load School Research Committee members.");
      } finally {
        setLoading(false);
      }
    };

    fetchResearchCommittee();
  }, []);

  return (
    <div>
      <h2 className="innerpage-title">
        School Research Committee
      </h2>

      <div className="board-body-container">
        {loading ? (
          <p>Loading Research Committee members...</p>
        ) : error ? (
          <p>{error}</p>
        ) : ResearchBoardData.length === 0 ? (
          <p>No Research Committee members available.</p>
        ) : (
          ResearchBoardData.map((item) => (
            <div className="board-card" key={item.id}>
              <h3 className="board-name">
                {item.name}
              </h3>
              <p className="board-desg">
                {item.designation}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoardResearch;
