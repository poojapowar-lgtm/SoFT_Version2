
import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import {
  TbPlayerTrackPrevFilled,
  TbPlayerTrackNextFilled,
} from "react-icons/tb";

import "../Speak.css";
import "./achievements.css";
import API_BASE from "../../utils/apiBase";

const API_URL = `${API_BASE}/api/achievements`;
const IMAGE_BASE_URL = `${API_BASE}/`;

const Achievements = () => {
  const [active, setActive] = useState("faculty");
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const [itemsPerView, setItemsPerView] = useState(
    () => (window.innerWidth <= 768 ? 1 : 2)
  );

  const sliderRef = useRef(null);

  // TABS
  const tabs = [
    {
      id: "faculty",
      label: "Faculty Achievement",
      type: "Faculty",
    },
    {
      id: "student",
      label: "Student Achievement",
      type: "Student",
    },
  ];

  const selectedType =
    tabs.find((tab) => tab.id === active)?.type || "Faculty";

  // FETCH ACHIEVEMENTS
  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setIndex(0);

      const response = await axios.get(
        `${API_URL}?type=${selectedType}`
      );

      setAchievements(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Error fetching achievements:", err);

      setError(
        "Unable to load achievements. Please try again later."
      );

      setAchievements([]);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // RESPONSIVE SLIDER
  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(window.innerWidth <= 768 ? 1 : 2);
      setIndex(0);
    };

    let resizeTimer;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    };

    window.addEventListener("resize", debouncedResize);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // MAX INDEX
  const maxIndex = Math.max(
    0,
    achievements.length - itemsPerView
  );

  // NAVIGATION
  const scrollLeft = () => {
    setIndex((prev) => Math.max(0, prev - 1));
  };

  const scrollRight = () => {
    setIndex((prev) =>
      prev >= maxIndex ? maxIndex : prev + 1
    );
  };

  // VISIBLE ACHIEVEMENTS
  const visibleData = achievements.slice(
    index,
    index + itemsPerView
  );

  // AUTO SLIDER
  useEffect(() => {
    if (isPaused || achievements.length <= itemsPerView) {
      return;
    }

    const interval = setInterval(() => {
      setIndex((prev) =>
        prev >= maxIndex ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [
    isPaused,
    achievements.length,
    itemsPerView,
    maxIndex,
  ]);

  // IMAGE URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    return `${IMAGE_BASE_URL}${imagePath.replace(/^\/+/, "")}`;
  };

  // READ MORE / READ LESS
  const toggleReadMore = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="achievements-section">

      <h2 className="innerpage-title">
        Achievements
      </h2>

      {/* TABS */}
      <div className="tab-buttons">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn ${active === tab.id ? "active" : ""}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p>Loading achievements...</p>}

      {!loading && error && (
        <p className="achievement-error">{error}</p>
      )}

      {!loading && !error && achievements.length > 0 && (
        <div className="speak-slider-wrapper" >

          <div
            className="speak-slider"
            ref={sliderRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {visibleData.map((item, itemIndex) => {
              const fields = [
                {
                  label: "Academic Year",
                  value: item.academic_year,
                },
                {
                  label: "Event/Category",
                  value: item.event_category,
                },
                {
                  label: "Competition/Activity",
                  value: item.competition_activity,
                },
              ];

              return (
                <div
                  className="achievement-card"
                  key={item.id || itemIndex}
                >
                  <div className="achievement-top">

                    {/* IMAGE */}
                    <div className="achievement-image">
                      {item.image_path && (
                        <img
                          src={getImageUrl(item.image_path)}
                          alt={item.name || "Achievement"}
                          width="400"
                          height="250"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="speak-right">
                      <h3 className="student-name">
                        {item.name}
                      </h3>

                      <ul className="speak-list">
                        {fields.map(
                          (field, i) =>
                            field.value && (
                              <li key={i}>
                                <strong>
                                  {field.label}:
                                </strong>{" "}
                                {field.value}
                              </li>
                            )
                        )}
                      </ul>
                    </div>

                  </div>

                  {item.description && (() => {
                    const descriptionText = item.description
                      .replace(/<[^>]*>/g, "")
                      .trim();

                    const isExpanded = expandedItems[item.id || itemIndex];

                    return (
                      <div className="speak-message">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(
                              isExpanded
                                ? item.description
                                : descriptionText.substring(0, 400) +
                                (descriptionText.length > 400 ? "..." : "")
                            ),
                          }}
                        />

                        {descriptionText.length > 400 && (
                          <button
                            type="button"
                            onClick={() =>
                              toggleReadMore(item.id || itemIndex)
                            }
                            className="read-more"
                          >
                            {isExpanded ? "Read Less" : "Read More"}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* DOTS */}
          {maxIndex > 0 && (
            <div className="dots">
              {Array.from({ length: maxIndex + 1 }).map(
                (_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to achievement ${i + 1}`}
                    aria-current={
                      index === i ? "true" : undefined
                    }
                    className={`dot ${index === i ? "active" : ""
                      }`}
                    onClick={() => setIndex(i)}
                  />
                )
              )}
            </div>
          )}

          {/* NAV BUTTONS */}
          {achievements.length > itemsPerView && (
            <div className="nav-buttons">
              <button
                type="button"
                onClick={scrollLeft}
                disabled={index === 0}
                aria-label="Previous achievement"
              >
                <TbPlayerTrackPrevFilled />
              </button>

              <button
                type="button"
                onClick={scrollRight}
                disabled={index >= maxIndex}
                aria-label="Next achievement"
              >
                <TbPlayerTrackNextFilled />
              </button>
            </div>
          )}

        </div>
      )}

      {!loading && !error && achievements.length === 0 && (
        <p>No achievements available.</p>
      )}

    </div>
  );
};

export default Achievements;
