import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  query,
  collection,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import tancLogo from "../assets/images/tanc-logo.jpg";
import LoadingSpinner from "../components/LoadingSpinner";
import ImageWithFallback from "../components/ImageWithFallback";
import "../styles/ID.css";

const getExpiryDateString = (expiresAtTimestamp) => {
  if (!expiresAtTimestamp || !expiresAtTimestamp.toDate) return "Unknown";
  try {
    return expiresAtTimestamp.toDate().toLocaleDateString();
  } catch (err) {
    console.error("Invalid expiry date format:", err);
    return "Unknown";
  }
};

function IDView() {
  const [userData, setUserData] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      setUserData(null);
      setIsExpired(false);
      setStatus("Loading your ID...");

      try {
        const user = auth.currentUser;
        if (!user) {
          if (!cancelled) {
            setStatus("No user is logged in.");
            setIsLoading(false);
            navigate("/login");
          }
          return;
        }

        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          if (!cancelled) {
            setStatus(
              "Admin accounts do not have a member ID. Please log in as a user."
            );
            setIsLoading(false);
          }
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          const appQuery = query(
            collection(db, "applications"),
            where("userId", "==", user.uid),
            limit(1)
          );
          const appSnapshot = await getDocs(appQuery);

          if (!cancelled) {
            if (!appSnapshot.empty) {
              const appData = appSnapshot.docs[0].data();
              if (appData.rejected) {
                setStatus(
                  "Your application was rejected. Please contact support for details."
                );
              } else if (appData.status === "pending") {
                setStatus(
                  "Your application is still pending approval. Please check back later."
                );
              } else {
                setStatus(
                  "Your ID record is not available yet. Please contact support."
                );
              }
            } else {
              setStatus(
                <>
                  Membership record not found. Have you applied?{" "}
                  <Link to="/application">Apply here</Link>
                </>
              );
            }
            setIsLoading(false);
          }
          return;
        }

        const fetchedUserData = {
          ...userDoc.data(),
          id: user.uid,
        };

        if (!cancelled) {
          setUserData(fetchedUserData);

          const now = new Date();
          const expiryDate = fetchedUserData.expiresAt?.toDate();
          if (expiryDate && expiryDate < now) {
            setIsExpired(true);
            setStatus(
              <>
                Your membership has expired.{" "}
                <Link to="/renewal-application">Renew your membership</Link> to
                view your ID.
              </>
            );
          } else {
            setIsExpired(false);
            setStatus("");
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        if (!cancelled) {
          setError("An error occurred while loading your ID: " + err.message);
          setStatus("Error loading ID.");
          setIsLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (isLoading) {
    return <LoadingSpinner message={status || "Loading your ID..."} />;
  }

  if (error) {
    return (
      <div className="id-container">
        <div className="status-container error">
          <h2>Error</h2>
          <p className="status-message">{error}</p>
          <button onClick={() => navigate("/")}>Go Home</button>
        </div>
      </div>
    );
  }

  if (status && !userData) {
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

  if (isExpired) {
    return (
      <div className="id-container">
        <div className="status-container expired-notice">
          <h2>Membership Expired</h2>
          <p className="status-message">{status}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="id-container">
        <div className="status-container">
          <h2>My ID</h2>
          <p className="status-message">
            Could not load ID data. Please try again later or contact support.
          </p>
          <button onClick={() => navigate("/")}>Go Home</button>
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
            {userData.photoUrl ? (
              <ImageWithFallback
                src={userData.photoUrl}
                alt="Member"
                className="member-photo"
                width="150"
                height="150"
                transformations="w_150,h_150,c_fill,g_face,f_auto,q_auto"
              />
            ) : (
              <div className="id-photo-placeholder">?</div>
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
                  ? `TNC-${userData.id.substring(0, 8).toUpperCase()}`
                  : "TNC-N/A"}
              </span>
            </div>

            <div className="id-info">
              <span className="id-label">Date of Birth</span>
              <span className="id-value">{userData.dateOfBirth || "N/A"}</span>
            </div>

            <div className="id-info">
              <span className="id-label">Gender</span>
              <span className="id-value">{userData.gender || "N/A"}</span>
            </div>

            <div className="id-info">
              <span className="id-label">Member Since</span>
              <span className="id-value">
                {userData.memberSince
                  ? new Date(userData.memberSince).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="id-footer">
          <div>
            <span className="id-label">Valid Until</span>
            <span className="id-expiry">
              {getExpiryDateString(userData.expiresAt)}
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
              You requested a physical ID card during application. Please
              contact the TANC office regarding pickup or mailing.
            </p>
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
