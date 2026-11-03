import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "./events.css";

const Events = () => {
  const [eventData, setEventData] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlides, setLightboxSlides] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const imageScrollRefs = useRef({});
  const scrollCleanups = useRef([]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/events");
        setEventData(res.data);
      } catch (err) {
        console.error("Error fetching events", err);
      }
    };

    fetchEvents();
  }, []);

  // Automatically scroll images and pause on hover
  const startAutoScroll = useCallback((container, speed = 0.5) => {
    if (!container) return undefined;

    let animationId;
    let lastTime = 0;
    let isPaused = false;

    const pauseScroll = () => {
      isPaused = true;
    };

    const resumeScroll = () => {
      isPaused = false;
      lastTime = 0;
    };

    const scroll = (time) => {
      if (!lastTime) lastTime = time;

      const delta = time - lastTime;
      lastTime = time;

      if (!isPaused && container.scrollWidth > container.clientWidth + 1) {
        container.scrollLeft += speed * (delta / 16);

        // Restart at the beginning after reaching the end
        if (
          container.scrollLeft + container.clientWidth >=
          container.scrollWidth - 1
        ) {
          container.scrollLeft = 0;
        }
      }

      animationId = requestAnimationFrame(scroll);
    };

    // Desktop hover behavior
    container.addEventListener("mouseenter", pauseScroll);
    container.addEventListener("mouseleave", resumeScroll);

    // Mobile touch behavior
    container.addEventListener("touchstart", pauseScroll, {
      passive: true,
    });
    container.addEventListener("touchend", resumeScroll, {
      passive: true,
    });
    container.addEventListener("touchcancel", resumeScroll, {
      passive: true,
    });

    animationId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationId);

      container.removeEventListener("mouseenter", pauseScroll);
      container.removeEventListener("mouseleave", resumeScroll);
      container.removeEventListener("touchstart", pauseScroll);
      container.removeEventListener("touchend", resumeScroll);
      container.removeEventListener("touchcancel", resumeScroll);
    };
  }, []);

  // Attach auto-scroll to each event image row
  useEffect(() => {
    scrollCleanups.current.forEach((cleanup) => cleanup());
    scrollCleanups.current = [];

    Object.values(imageScrollRefs.current).forEach((container) => {
      if (container) {
        const cleanup = startAutoScroll(container, 0.5);

        if (cleanup) {
          scrollCleanups.current.push(cleanup);
        }
      }
    });

    return () => {
      scrollCleanups.current.forEach((cleanup) => cleanup());
      scrollCleanups.current = [];
    };
  }, [eventData, startAutoScroll]);

  // Remove HTML tags to calculate description length
  const getPlainText = (html = "") => {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Toggle Read More / Read Less
  const toggleReadMore = (eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };


  const openLightbox = (paths, clickedIndex) => {
    const slides = paths.map((path, index) => ({
      src: `http://localhost:5000${path}`,
      alt: `Event image ${index + 1}`,
    }));

    setLightboxSlides(slides);
    setLightboxIndex(clickedIndex);
    setLightboxOpen(true);
  };

  return (
    <div className="event-container">
      <h2 className="innerpage-title">Events</h2>

      {eventData.length === 0 ? (
        <p>No events available</p>
      ) : (
        eventData.map((event, index) => {
          const eventId = event.id ?? index;
          const isExpanded = !!expandedEvents[eventId];
          const description = event.description || "";
          const plainDescription = getPlainText(description);
          const needsReadMore = plainDescription.length > 100;


          // Parse event image paths safely
          let paths = [];

          if (event.file_path) {
            try {
              const parsedPaths = JSON.parse(event.file_path);

              paths = Array.isArray(parsedPaths)
                ? parsedPaths
                : [event.file_path];
            } catch {
              paths = [event.file_path];
            }
          }

          return (
            <div className="event-card" key={eventId}>
              {/* Event Title and Report */}
              <div className="title-row">
                <h2 className="innerpage-subtitle">{event.title}</h2>

                {event.doc_path && (
                  <a
                    href={`http://localhost:5000${event.doc_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn"
                    aria-label={`View event report: ${event.title}`}
                  >
                    View Event Report
                  </a>
                )}
              </div>

              {/* Auto-scrolling Event Images */}
              {paths.length > 0 && (
                <div
                  className="event-images"
                  ref={(node) => {
                    imageScrollRefs.current[eventId] = node;
                  }}
                >
                  {paths.map((path, i) => (
                    <img
                      key={`${eventId}-${i}`}
                      src={`http://localhost:5000${path}`}
                      alt={`${event.title || "Event"} - Image ${i + 1}`}
                      width="400"
                      height="250"
                      loading="lazy"
                      decoding="async"
                      onClick={() => openLightbox(paths, i)}
                      className="event-clickable-image"
                    />
                  ))}
                </div>
              )}
              {/* Event Description */}
              {description && (
                <>
                  <div
                    className={`ql-content ${isExpanded ? "expanded" : "collapsed"
                      }`}
                    dangerouslySetInnerHTML={{
                      __html: description,
                    }}
                  />

                  {needsReadMore && (
                    <div className="event-read-more-wrapper">
                      <button
                        type="button"
                        className="event-read-more-btn"
                        onClick={() => toggleReadMore(eventId)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? "Read Less" : "Read More..."}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Event Link */}
              {event.link_url && (
                <a
                  href={event.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="event-link"
                >
                  {event.link_text || "Learn More"}
                </a>
              )}
            </div>
          );
        })
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
        on={{
          view: ({ index }) => setLightboxIndex(index),
        }}
        carousel={{
          imageFit: "contain",
          finite: false,
        }}
        controller={{
          closeOnEscape: true,
          closeOnBackdropClick: true,
        }}
      />
    </div>
  );
};

export default Events;
