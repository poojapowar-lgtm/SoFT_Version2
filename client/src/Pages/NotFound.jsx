import React from "react";
import { Link } from "react-router-dom";
import SEOMeta from "../Components/SEO/SEOMeta";

const NotFound = () => {
  return (
    <>
      <SEOMeta
        title="Page Not Found – 404"
        description="The page you are looking for does not exist. Return to MIT School of Food Technology homepage."
        path="/404"
        noIndex={true}
      />

      <div
        style={{
          textAlign: "center",
          padding: "80px 20px",
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <h1 style={{ fontSize: "4rem", color: "#006400", margin: 0 }}>404</h1>
        <h2 style={{ fontSize: "1.5rem", color: "#333", margin: 0 }}>
          Page Not Found
        </h2>
        <p style={{ color: "#666", maxWidth: "480px" }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          style={{
            marginTop: "8px",
            padding: "10px 28px",
            background: "#006400",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Back to Home
        </Link>
      </div>
    </>
  );
};

export default NotFound;
