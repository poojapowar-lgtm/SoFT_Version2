import React from "react";
import "./programs.css";

const FutureScope = ({ title, description, description2, list, list2 }) => {
  return (
    <div>

      <div className="future-container">

        {title && <h2 className="innerpage-title">{title}</h2>}

        <div className="pg-outcomes-container">

          {description && (
            <div className="pg-outcomes-item">
              <div className="pg-outcomes-number">1</div>

              <div className="pg-outcomes-card">
                <h3 className="innerpage-subtitle" style={{ margin: "0px" }}>
                  Future Scope & Importance
                </h3>
                <p>{description}</p>
              </div>
            </div>
          )}

          {list?.length > 0 && (
            <div className="pg-outcomes-item">
              <div className="pg-outcomes-number">
                {description ? 2 : 1}
              </div>

              <div className="pg-outcomes-card">
                <h3 className="innerpage-subtitle" style={{ margin: "0px" }}>
                  Graduates are highly employable in
                </h3>

                <ul className="page-list">
                  {list.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {list2?.length > 0 && (
            <div className="pg-outcomes-item">
              <div className="pg-outcomes-number">
                {(description ? 1 : 0) + (list?.length > 0 ? 1 : 0) + 1}
              </div>

              <div className="pg-outcomes-card">
                <h3 className="innerpage-subtitle" style={{ margin: "0px" }}>
                  Common Job Positions
                </h3>

                <ul className="page-list">
                  {list2.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {description2 && (
            <div className="pg-outcomes-item">
              <div className="pg-outcomes-number">
                {(description ? 1 : 0) +
                  (list?.length > 0 ? 1 : 0) +
                  (list2?.length > 0 ? 1 : 0) +
                  1}
              </div>

              <div className="pg-outcomes-card">
                <h3 className="innerpage-subtitle" style={{ margin: "0px" }}>
                  Placement Prospects
                </h3>
                <p>{description2}</p>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default FutureScope;
