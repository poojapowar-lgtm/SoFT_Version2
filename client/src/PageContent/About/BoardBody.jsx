import React, { useEffect, useState } from "react";
import axios from "axios";

const BoardBody = () => {
  const [boardData, setBoardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBoardMembers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/members?type=board"
        );

        setBoardData(response.data);
      } catch (err) {
        console.error("Error fetching Board of Management:", err);
        setError("Unable to load Board of Management members.");
      } finally {
        setLoading(false);
      }
    };

    fetchBoardMembers();
  }, []);

  return (
    <>
      <h2 className="innerpage-title">Board of Management</h2>

      <div className="board-body-container">
        {loading ? (
          <p>Loading Board of Management...</p>
        ) : error ? (
          <p>{error}</p>
        ) : boardData.length === 0 ? (
          <p>No Board of Management members available.</p>
        ) : (
          boardData.map((item) => (
            <div className="board-card" key={item.id}>
              <h3 className="board-name">{item.name}</h3>

              <p className="board-desg">
                {item.designation}
              </p>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default BoardBody;
