import React from "react";
import "../styles/LoadingSpinner.css";

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner-inner spinner-circle1"></div>
        <div className="spinner-inner spinner-circle2"></div>
        <div className="spinner-inner spinner-circle3"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
