import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "../styles/ID.css";

function IDView() {
  const [userData, setUserData] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const navigate = useNavigate();

  // Calculate expiry date (5 years from member since date)
  const calculateExpiryDate = (memberSince) => {
    if (!memberSince) return "Unknown";
    const date = new Date(memberSince);
    date.setFullYear(date.getFullYear() + 5);
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setStatus("No user is logged in.");
          return;
        }

        // First check if user is an admin
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          setStatus("Please log in as a user to view your ID.");
          return;
        }

        // Then check if user exists in users collection
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          setStatus("You need to wait for approval before seeing your ID.");
          return;
        }

        // Add the user ID to the data
        setUserData({
          ...userDoc.data(),
          id: user.uid,
        });
        setStatus("");
      } catch (err) {
        console.error("Error fetching user data:", err);
        setStatus("Error loading your ID information. Please try again later.");
      }
    };

    fetchUserData();
  }, []);

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

  return (
    <div className="id-container">
      <h2>Your TANC Membership ID</h2>

      <div className="id-card">
        <div className="id-header">
          <img
            src="https://tanc.org/wp-content/uploads/2023/09/tanc-logo-1.png"
            alt="TANC Logo"
            className="id-logo"
          />
          <h2 className="id-title">
            Tibetan Association of Northern California
          </h2>
          <p className="id-subtitle">Official Membership ID</p>
        </div>

        <div className="id-body">
          <div className="id-photo">
            {userData.photoUrl && <img src={userData.photoUrl} alt="Member" />}
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
