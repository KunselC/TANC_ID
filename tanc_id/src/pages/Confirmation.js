import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  ApplicationIcon,
  IdCardIcon,
  SecurityIcon, // Use SecurityIcon instead of CheckCircleIcon
} from "../components/Icons";
import "../styles/Confirmation.css";

function Confirmation() {
  const location = useLocation();
  const {
    type = "generic",
    name = "Member",
    wantId = false,
  } = location.state || {};

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
                <li>Our admin team will review your application.</li>
                <li>
                  You'll receive an email when your application is approved.
                </li>
                <li>
                  Once approved, you can log in to access your digital ID card.
                </li>
                {wantId && (
                  <li>
                    Your physical ID card request has been noted. Please contact
                    the TANC office regarding pickup/mailing after approval.
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
                Your membership is now active/renewed. You can access your
                digital ID.
              </p>
            </div>
          </>
        );

      case "renewal":
        return (
          <>
            <div className="confirmation-icon">
              <SecurityIcon /> {/* Use SecurityIcon */}
            </div>
            <h1>Renewal Submitted, {name}!</h1>
            <p className="confirmation-message">
              Your membership renewal application has been sent successfully.
            </p>
            <div className="confirmation-details">
              <h2>Next Steps:</h2>
              <ol>
                <li>Our admin team will review your renewal request.</li>
                <li>You'll receive an email upon approval.</li>
                <li>
                  <strong>Important:</strong> Remember to pay the $100 renewal
                  fee for 5 years. Contact the TANC office for payment options.
                </li>
                <li>
                  Your membership expiry date will be updated upon approval and
                  payment confirmation.
                </li>
              </ol>
            </div>
            <p>
              You can check your profile or ID page later for the updated expiry
              date after approval.
            </p>
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
          {type === "renewal" && (
            <Link to="/my-id" className="button secondary-button">
              Check My ID Status
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
