import React from "react";
import { useLocation, Link } from "react-router-dom";
import "../styles/Confirmation.css";
import { IdCardIcon, ApplicationIcon } from "../components/Icons";

function Confirmation() {
  const location = useLocation();
  const { type, name, wantId } = location.state || {
    type: "generic",
    name: "Member",
    wantId: false,
  };

  const renderContent = () => {
    switch (type) {
      case "application":
        return (
          <>
            <div className="confirmation-icon">
              <ApplicationIcon />
            </div>
            <h1>Thank You, {name}!</h1>
            <p className="confirmation-message">
              Your membership application has been submitted successfully.
            </p>
            <div className="confirmation-details">
              <h2>What happens next?</h2>
              <ol>
                <li>Our admin team will review your application</li>
                <li>
                  You'll receive an email when your application is approved
                </li>
                <li>
                  Once approved, you can log in to access your digital ID card
                </li>
                {wantId && (
                  <li>
                    Your physical ID card will be prepared for pickup at the
                    TANC office
                  </li>
                )}
              </ol>
            </div>
            <p>
              Please check your email for updates about your application status.
            </p>
          </>
        );

      case "payment":
        return (
          <>
            <div className="confirmation-icon">
              <IdCardIcon />
            </div>
            <h1>Payment Successful!</h1>
            <p className="confirmation-message">
              Thank you for your payment, {name}.
            </p>
            <div className="confirmation-details">
              <p>
                Your membership is now active. You can now access your digital
                ID.
              </p>
            </div>
          </>
        );

      default:
        return (
          <>
            <h1>Thank You!</h1>
            <p className="confirmation-message">
              Your request has been processed.
            </p>
          </>
        );
    }
  };

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        {renderContent()}

        <div className="confirmation-actions">
          <Link to="/" className="button primary-button">
            Return to Home
          </Link>
          {type === "application" && (
            <Link to="/login" className="button secondary-button">
              Go to Login
            </Link>
          )}
          {type === "payment" && (
            <Link to="/my-id" className="button secondary-button">
              View My ID
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Confirmation;
