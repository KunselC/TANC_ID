import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ApplicationIcon, IdCardIcon, SecurityIcon } from "../components/Icons";
import "../styles/Confirmation.css";

function Confirmation() {
  const location = useLocation();
  const { type, name, wantId, paymentMethod } = location.state || {};

  const membershipFee = 100;
  const idFee = 5;
  const totalAmount = wantId ? membershipFee + idFee : membershipFee;

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
            {/* Payment information summary for new applications */}
            {paymentMethod && (
              <div className="payment-info-summary">
                <h4>Payment Information Summary:</h4>
                <p>
                  <strong>
                    Total Amount Due Upon Approval: ${totalAmount}
                  </strong>
                </p>
                <p>
                  <strong>Selected Payment Method:</strong>{" "}
                  {paymentMethod.charAt(0).toUpperCase() +
                    paymentMethod.slice(1)}
                </p>
                {paymentMethod === "cash" && (
                  <p>
                    Please prepare ${totalAmount} in cash to be paid in person
                    at the TANC office upon approval: 5200 Dalai Lama Ave,
                    Richmond, CA 94804.
                  </p>
                )}
                {paymentMethod === "check" && (
                  <>
                    <p>
                      Please prepare a check for ${totalAmount} payable to:{" "}
                      <strong>
                        Tibetan Association of Northern California
                      </strong>
                      .
                    </p>
                    <p>
                      Mail to or bring to the TANC office upon approval: 5200
                      Dalai Lama Ave, Richmond, CA 94804
                    </p>
                  </>
                )}
                {paymentMethod === "online" && (
                  <>
                    <p>
                      Upon approval, please make an online payment of $
                      {totalAmount} to:
                    </p>
                    <p>
                      <strong>Bank:</strong> US Bank
                    </p>
                    <p>
                      <strong>Account Name:</strong> Tibetan Association of
                      Northern California
                    </p>
                    <p>
                      <strong>Account Number:</strong> 1575 0752 0797
                    </p>
                    <p>
                      <strong>Routing Number:</strong> 121122676
                    </p>
                    <p>
                      Please include your full name in the payment
                      description/memo.
                    </p>
                  </>
                )}
              </div>
            )}
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
              <SecurityIcon />
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
                  fee for 5 years. Contact the TANC office for payment options
                  (Cash/Check at 5200 Dalai Lama Ave, Richmond, CA 94804 or
                  Online as per details provided during application).
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

        <div className="confirmation-details">
          <p>
            Thank you for submitting your{" "}
            {type === "renewal" ? "renewal" : "new membership"} application,{" "}
            {name}.
          </p>
          <p>
            Your application is now pending review. You will be notified via
            email once a decision has been made.
          </p>
          {type === "application" && (
            <>
              <p>Membership Fee: ${membershipFee}</p>
              {wantId && <p>Physical ID Card Fee: ${idFee}</p>}
              <p>
                <strong>Total Amount Due Upon Approval: ${totalAmount}</strong>
              </p>
              {wantId && <p>You have requested a physical ID card.</p>}

              {paymentMethod && (
                <div className="payment-info-summary">
                  <h4>Payment Information Summary:</h4>
                  <p>
                    <strong>Selected Payment Method:</strong>{" "}
                    {paymentMethod.charAt(0).toUpperCase() +
                      paymentMethod.slice(1)}
                  </p>
                  {paymentMethod === "cash" && (
                    <p>
                      Please prepare ${totalAmount} in cash to be paid in person
                      at the TANC office upon approval: 5200 Dalai Lama Ave,
                      Richmond, CA 94804.
                    </p>
                  )}
                  {paymentMethod === "check" && (
                    <>
                      <p>
                        Please prepare a check for ${totalAmount} payable to:{" "}
                        <strong>
                          Tibetan Association of Northern California
                        </strong>
                        .
                      </p>
                      <p>
                        You can mail it or bring it to the TANC office upon
                        approval: 5200 Dalai Lama Ave, Richmond, CA 94804
                      </p>
                    </>
                  )}
                  {paymentMethod === "online" && (
                    <>
                      <p>
                        Upon approval, please make an online payment of $
                        {totalAmount} to:
                      </p>
                      <p>
                        <strong>Bank:</strong> US Bank
                      </p>
                      <p>
                        <strong>Account Name:</strong> Tibetan Association of
                        Northern California
                      </p>
                      <p>
                        <strong>Account Number:</strong> 1575 0752 0797
                      </p>
                      <p>
                        <strong>Routing Number:</strong> 121122676
                      </p>
                      <p>
                        Please include your full name in the payment
                        description/memo.
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          {type === "renewal" && (
            <>
              <h2>Important Renewal Information:</h2>
              <p>
                Your renewal application is being processed. Please ensure the
                renewal fee is paid to avoid any lapse in membership.
              </p>
              <div className="payment-info-summary">
                <h4>Payment Information Summary:</h4>
                <p>
                  <strong>Selected Payment Method:</strong>{" "}
                  {paymentMethod.charAt(0).toUpperCase() +
                    paymentMethod.slice(1)}
                </p>
                {paymentMethod === "cash" && (
                  <p>
                    Please prepare $100 in cash to be paid in person at the TANC
                    office upon approval: 5200 Dalai Lama Ave, Richmond, CA
                    94804.
                  </p>
                )}
                {paymentMethod === "check" && (
                  <>
                    <p>
                      Please prepare a check for $100 payable to:{" "}
                      <strong>
                        Tibetan Association of Northern California
                      </strong>
                      .
                    </p>
                    <p>
                      You can mail it or bring it to the TANC office upon
                      approval: 5200 Dalai Lama Ave, Richmond, CA 94804
                    </p>
                  </>
                )}
                {paymentMethod === "online" && (
                  <>
                    <p>
                      Upon approval, please make an online payment of $100 to:
                    </p>
                    <p>
                      <strong>Bank:</strong> US Bank
                    </p>
                    <p>
                      <strong>Account Name:</strong> Tibetan Association of
                      Northern California
                    </p>
                    <p>
                      <strong>Account Number:</strong> 1575 0752 0797
                    </p>
                    <p>
                      <strong>Routing Number:</strong> 121122676
                    </p>
                    <p>
                      Please include your full name in the payment
                      description/memo.
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>

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
