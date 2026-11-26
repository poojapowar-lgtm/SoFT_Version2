import React, { useEffect, useState } from "react";
import axios from "axios";
import "./faculty.css";
import { MdOutlineKeyboardDoubleArrowRight } from "react-icons/md";
import { IoMdCloseCircle } from "react-icons/io";
import { createPortal } from "react-dom";
import SEOMeta from "../../Components/SEO/SEOMeta";
import { useLocation } from "react-router-dom";
import API_BASE from "../../utils/apiBase";

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const location = useLocation();

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/faculty`)
      .then((res) => setFaculty(res.data))
      .catch(() => console.log("Error fetching data"));
  }, []);

  // Person schema for selected faculty (shown in modal)
  const personData = selectedFaculty
    ? {
        name: selectedFaculty.name,
        designation: selectedFaculty.designation,
        image: selectedFaculty.image
          ? `${API_BASE}/uploads/${selectedFaculty.image}`
          : null,
        expertise: selectedFaculty.area_of_expertise || null,
      }
    : null;

  return (
    <>
      {personData && (
        <SEOMeta
          path={location.pathname}
          personData={personData}
        />
      )}
      <h2 className="innerpage-title">Faculty Members</h2>

      <div className="faculty-container">
        {[...faculty].reverse().map((item) => (
          <div
            className="faculty-card"
            key={item.id}
            onClick={() => setSelectedFaculty(item)}
          >
            <div className="faculty-img">
              <img
                src={`${API_BASE}/uploads/${item.image}`}
                alt={item.name}
                width="140"
                height="140"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="faculty-content">
              <h4 className="faculty-name">{item.name}</h4>
              <div className="designation-row">
                <p><strong>{item.designation}</strong></p>

                <div className="hover-icon">
                  <MdOutlineKeyboardDoubleArrowRight />
                </div>
              </div>
            </div>


          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedFaculty &&
        createPortal(
          <div
            className="faculty-modal"
            onClick={() => setSelectedFaculty(null)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="page-close-btn"
                onClick={() => setSelectedFaculty(null)}
              >
                <IoMdCloseCircle />
              </div>

              {/* Image Section */}
              <div className="modal-image-section">
                {/* Left Side - Image */}
                <div className="modal-img-wrapper">
                  <img
                    src={`${API_BASE}/uploads/${selectedFaculty.image}`}
                    alt={selectedFaculty.name}
                    className="modal-img"
                  />
                </div>

                {/* Right Side - Faculty Details */}
                <div className="modal-heading-details">
                  <h4 className="names">{selectedFaculty.name}</h4>

                  <p className="modal-designation">
                    <strong>{selectedFaculty.designation}</strong>
                  </p>
                </div>
              </div>

              {/* Text Section */}
              <div className="modal-details-section">
                <p className="modal-expertise">
                  {selectedFaculty.area_of_expertise}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Faculty;