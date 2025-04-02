import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import LoadingSpinner from "../components/LoadingSpinner";
import ImageWithFallback from "../components/ImageWithFallback";
import "../styles/ID.css";
import tancLogo from "../assets/images/tanc-logo.jpg";

function IDView() {
  const [userData, setUserData] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Calculate expiry date (5 years from member since date)
  const calculateExpiryDate = (memberSince) => {
    if (!memberSince) return "Unknown";
    try {
      const date = new Date(memberSince);
      date.setFullYear(date.getFullYear() + 5);
      return date.toLocaleDateString();
    } catch (err) {
      console.error("Invalid date format:", err);
      return "Unknown";
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          if (isMounted) {
            setStatus("No user is logged in.");
            setIsLoading(false);
          }
          return;
        }

        // First check if user is an admin
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          if (isMounted) {
            setStatus("Please log in as a user to view your ID.");
            setIsLoading(false);
          }
          return;
        }

        // Then check if user exists in users collection
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          if (isMounted) {
            setStatus("You need to wait for approval before seeing your ID.");
            setIsLoading(false);
          }
          return;
        }

        // Add the user ID to the data
        if (isMounted) {
          setUserData({
            ...userDoc.data(),
            id: user.uid,
          });
          setStatus("");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        if (isMounted) {
          setError(err.message);
          setStatus(
            "Error loading your ID information. Please try again later."
          );
          setIsLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading your ID..." />;
  }

  if (status) {
    return (
      <div className="id-container">
        <div className="status-container">
          <h2>My ID</h2>
          <p className="status-message">{status}</p>
          {status === "No user is logged in." && (
            <button onClick={() => navigate("/login")}>Go to Login</button>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="id-container">
        <div className="status-container error">
          <h2>Error</h2>
          <p className="status-message">
            An error occurred while loading your ID: {error}
          </p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="id-container">
      <h2>Your TANC Membership ID</h2>

      <div className="id-card">
        <div className="id-header">
          <img src={tancLogo} alt="TANC Logo" className="id-logo" />
          <h2 className="id-title">
            Tibetan Association of Northern California
          </h2>
          <p className="id-subtitle">Official Membership ID</p>
        </div>

        <div className="id-body">
          <div className="id-photo">
            {userData.photoUrl && (
              <ImageWithFallback
                src={userData.photoUrl}
                alt="Member"
                className="member-photo"
              />
            )}
          </div>

          <div className="id-details">
            <div className="id-name">
              {userData.firstName}{" "}
              {userData.middleName ? userData.middleName + " " : ""}
              {userData.lastName}
            </div>

            <div className="id-info">
              <span className="id-label">Member ID</span>
              <span className="id-value">
                {userData.id
                  ? `TNC-${userData.id.substring(0, 6)}`
                  : "TNC-" + Math.floor(Math.random() * 100000)}
              </span>
            </div>

            <div className="id-info">
              <span className="id-label">Date of Birth</span>
              <span className="id-value">{userData.dateOfBirth}</span>
            </div>

            <div className="id-info">
              <span className="id-label">Gender</span>
              <span className="id-value">{userData.gender}</span>
            </div>

            <div className="id-info">
              <span className="id-label">Member Since</span>
              <span className="id-value">{userData.memberSince}</span>
            </div>
          </div>
        </div>

        <div className="id-footer">
          <div>
            <span className="id-label">Valid Until</span>
            <span className="id-expiry">
              {calculateExpiryDate(userData.memberSince)}
            </span>
          </div>
          <span className="id-notice">Official Member Identification</span>
        </div>
      </div>

      <div className="id-instructions">
        <h3>Your Digital ID Card</h3>
        <p>
          This digital ID is your official TANC membership credential. You can
          present it at community events, programs, and services.
        </p>

        {userData.wantId && (
          <div className="physical-id-notice">
            <p>
              You have requested a physical ID card. It will be prepared and
              available for pickup at the TANC office.
            </p>
            <p>A $5 fee applies for the physical card.</p>
          </div>
        )}

        <button onClick={() => window.print()} className="print-button">
          Print ID Card
        </button>
      </div>
    </div>
  );
}

export default IDView;
