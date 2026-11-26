
import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import { SocialIcon } from "react-social-icons";
import socialIconsData from "../socialIconsData";
import "./Footer.css";

import API_BASE from "../../utils/apiBase";

const Footer = () => {
  const [showButton, setShowButton] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);

  // Back-to-top button: update state only when visibility changes
  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 200;

      setShowButton((previous) =>
        previous !== shouldShow ? shouldShow : previous
      );
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Defer visitor tracking to browser idle time
  useEffect(() => {
    let timeoutId;
    let idleId;

    const trackVisitor = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/visitors/track`, {
          method: "POST",
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data.success) {
          setVisitorCount(data.count);
        }
      } catch (err) {
        console.error("Error tracking visitor:", err);
      }
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(trackVisitor, {
        timeout: 2000,
      });
    } else {
      timeoutId = setTimeout(trackVisitor, 1000);
    }

    return () => {
      if (idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="footer">

      {/* Top Section */}
      <div className="footer-top">
        <div className="footer-logos">

          <img
            className="ft-logo1"
            src="/assets/images/home/mit_logo.webp"
            alt="MIT-ADT University Logo"
            title="MIT-ADT University"
            width="170"
            height="50"
            loading="lazy"
            decoding="async"
          />

          <div className="footer-brand">
            <img
              className="ft-logo2"
              src="/favicon_new.png"
              alt="MIT School of Food Technology Logo"
              title="MIT School of Food Technology"
              width="90"
              height="65"
              loading="lazy"
              decoding="async"
            />
          </div>

        </div>

        <div className="footer-social">
          <div className="footer-social-box">

            {socialIconsData.map(({ url, network, bgColor }) => (
              <SocialIcon
                key={network || url}
                className="footer-social-icons"
                url={url}
                network={network}
                bgColor={bgColor}
                style={{
                  width: 40,
                  height: 40,
                }}
              />
            ))}

          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="footer-links-container">

        <div className="footer-links">
          <h4>Quick Links</h4>

          <ul>
            <li>
              <a
                href="/assets/docs/SoFT_3_Fold_Brochure_A_Grade.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Brochure
              </a>
            </li>

            <li><a href="/admissions/annoucement">Admission Announcement</a></li>
            <li><a href="/admissions/fee-structure">Fee Structure</a></li>
            <li><a href="/academics/academic-calendar">Academic Calendar</a></li>
            <li><a href="/contact">Connect with Us</a></li>
          </ul>

          <h4>Latest Happenings</h4>

          <ul>
            <li>
              <a href="/campus-life/events">
                Events &amp; Activities
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Student Centric</h4>

          <ul>
            <li><a href="/campus-life/facilities">Facilities</a></li>
            <li><a href="/academics/lab-facilities">Laboratories</a></li>
            <li><a href="/academics/student-grievance">Student Grievance</a></li>
          </ul>

          <h4>Exams</h4>

          <ul>
            <li>
              <a href="/examinations/examinations-schedule">
                Exam Schedule
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Alumni</h4>

          <ul>
            <li><a href="/placement/placed-students">Placed Students</a></li>
            <li><a href="/academics/achievements">Achievements</a></li>
          </ul>

          <h4>Other Links</h4>

          <ul>
            <li><a href="https://sdgs.un.org/" target="_blank" rel="noopener noreferrer">United Nations</a></li>
            <li><a href="https://www.fssai.gov.in/" target="_blank" rel="noopener noreferrer">FSSAI</a></li>
            <li><a href="https://www.mofpi.gov.in/" target="_blank" rel="noopener noreferrer">MoFPI</a></li>
            <li><a href="https://swayam.gov.in/nc_details/NPTEL" target="_blank" rel="noopener noreferrer">SWAYAM</a></li>
          </ul>
        </div>

        {/* Address and Google Map */}
        <div className="footer-links">

          <h4>Address</h4>

          <ul>
            <li>
              MIT-ADT Campus, Rajbaug, Pune–Solapur Highway, near Bharat
              Petrol Pump, Loni Kalbhor, Maharashtra 412201
            </li>
          </ul>

          <div className="footer-map-wrapper">
            <iframe
              className="map"
              title="MIT-SoFT Campus Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.8228655029525!2d74.02029187595625!3d18.49168107005449!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2e9784f39a613%3A0x189ffd59802ec685!2sMIT%20School%20of%20Food%20Technology%2C%20MIT%20ADT%20University%2C%20Pune!5e0!3m2!1sen!2sin!4v1773135364412!5m2!1sen!2sin"
              width="100%"
              height="200"
              style={{ width: "100%", maxWidth: "100%", border: 0 }}
              allow="fullscreen"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />

          </div>

          <a
            href="https://www.google.com/maps/place/MIT+ADT+UNIVERSITY,+Maharashtra+412201/@18.4933546,74.021984,17z/data=!3m1!4b1!4m6!3m5!1s0x3bc2e8015a3da997:0x6ea28cf1924e2860!8m2!3d18.4931501!4d74.0234023!16s%2Fg%2F11rd2wr6b5?entry=ttu&g_ep=EgoyMDI2MTExNS4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Directions
          </a>
        </div>

      </div>

      {/* Back to Top */}
      <button
        type="button"
        className={`back-to-top ${showButton ? "show" : ""}`}
        onClick={scrollToTop}
        aria-label="Back to top"
        aria-hidden={!showButton}
        tabIndex={showButton ? 0 : -1}
      >
        <FaArrowUp />
      </button>

      {/* Footer Bottom */}
      <div className="footer-bottom">

        <p className="bottom-text">
          MIT-SoFT Pune © 2026. All Rights Reserved. Designed & Developed by
          MIT-ADT Website Department.
        </p>

        <div className="visitor-box">
          <h4>Site Visitors:</h4>

          <p className="visitor-count" aria-live="polite">
            {visitorCount > 0
              ? visitorCount.toString().split("").join(" ")
              : "0 0 0 0 0 0"}
          </p>
        </div>

      </div>

    </footer>
  );
};

export default Footer;
