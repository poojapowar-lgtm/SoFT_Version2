
import React, { useState, useRef } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import ReCAPTCHA from "react-google-recaptcha";
import axios from "axios";
import "./enquiry.css";
import API_BASE from "../utils/apiBase";

const EnquiryForm = ({ onClose }) => {
  const recaptchaRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    course: "",
  });

  const [captchaToken, setCaptchaToken] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
      alert("Please complete the reCAPTCHA verification.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await axios.post(
        `${API_BASE}/api/enquiry`,
        {
          ...formData,
          recaptchaToken: captchaToken,
        }
      );

      alert(
        typeof res.data === "string"
          ? res.data
          : res.data.message || "Enquiry submitted successfully!"
      );

      setFormData({
        name: "",
        email: "",
        mobile: "",
        course: "",
      });

      setCaptchaToken(null);
      recaptchaRef.current?.reset();

      onClose();
    } catch (err) {
      console.error("Error submitting enquiry:", err);

      alert(
        err.response?.data?.message ||
          "Error submitting enquiry. Please try again."
      );

      // Allow the user to complete a fresh CAPTCHA after an error.
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="enquiry-container">
      <IoMdCloseCircle
        className="enquiry-close-btn"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="Close enquiry form"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClose();
          }
        }}
      />

      <div className="enquiry-top">
        <h2 className="enquiry-title">Quick Enquiry</h2>
        <h4 className="enquiry-subtitle">
          Get information about our courses
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="enquiry-form">
        <label htmlFor="enquiry-name">Name *</label>
        <input
          id="enquiry-name"
          type="text"
          name="name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="enquiry-email">Email *</label>
        <input
          id="enquiry-email"
          type="email"
          name="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="enquiry-mobile">Phone Number *</label>
        <input
          id="enquiry-mobile"
          type="tel"
          name="mobile"
          placeholder="Enter 10-digit mobile number"
          value={formData.mobile}
          onChange={handleChange}
          pattern="[0-9]{10}"
          maxLength={10}
          inputMode="numeric"
          required
        />

        <label htmlFor="enquiry-course">Course *</label>
        <select
          id="enquiry-course"
          name="course"
          value={formData.course}
          onChange={handleChange}
          required
        >
          <option value="">---Select Course---</option>
          <option value="B. Tech. (Food Technology)">
            B. Tech. (Food Technology)
          </option>
          <option value="Direct 2nd Year B. Tech">
            Direct 2nd Year B. Tech.
          </option>
          <option value="M. Tech. (Food Technology)">
            M. Tech. (Food Technology)
          </option>
          <option value="M. Tech. (Food Safety)">
            M. Tech. (Food Safety)
          </option>
          <option value="M. Tech. Working Professional">
            M. Tech. Working Professional
          </option>
          <option value="Ph. D. (Food Technology)">
            Ph. D. (Food Technology)
          </option>
        </select>

        <div className="enquiry-captcha">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptchaToken(token)}
            onExpired={() => setCaptchaToken(null)}
            onErrored={() => setCaptchaToken(null)}
          />
        </div>

        <button
          type="submit"
          className="btn"
          disabled={isSubmitting}
          style={{
            display: "block",
            width: "100%",
            margin: "8px 0",
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default EnquiryForm;
