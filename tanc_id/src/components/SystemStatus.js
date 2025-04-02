import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

function SystemStatus() {
  const [status, setStatus] = useState({
    firebase: "Checking...",
    cloudinary: "Checking...",
    firebaseAuth: "Checking...",
    cloudinaryPreset: "Checking...",
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkFirebase();
    checkCloudinary();
    checkFirebaseAuth();
  }, []);

  const checkFirebase = async () => {
    try {
      const testQuery = query(collection(db, "applications"), limit(1));
      await getDocs(testQuery);
      setStatus((prev) => ({ ...prev, firebase: "Connected ✅" }));
    } catch (error) {
      console.error("Firebase connection error:", error);
      setStatus((prev) => ({ ...prev, firebase: "Error ❌" }));
    }
  };

  const checkCloudinary = async () => {
    try {
      // First check basic connectivity
      const pingResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/ping`,
        { method: "GET" }
      );

      if (!pingResponse.ok) {
        setStatus((prev) => ({ ...prev, cloudinary: "Error connecting ❌" }));
        return;
      }

      // Test an unsigned upload with a tiny blank canvas
      try {
        const testBlob = await createTestImage();
        const testFormData = new FormData();
        testFormData.append("file", testBlob);
        testFormData.append(
          "upload_preset",
          process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
        );

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: testFormData,
          }
        );

        if (uploadResponse.ok) {
          setStatus((prev) => ({
            ...prev,
            cloudinary: "Connected ✅",
            cloudinaryPreset: "Configured correctly ✅",
          }));
        } else {
          const errorData = await uploadResponse.json();
          if (errorData.error?.message?.includes("preset")) {
            setStatus((prev) => ({
              ...prev,
              cloudinary: "Connected ✅",
              cloudinaryPreset:
                "Upload preset not configured for unsigned uploads ❌",
            }));
          } else {
            setStatus((prev) => ({
              ...prev,
              cloudinary: "Connected ✅",
              cloudinaryPreset: `Error: ${
                errorData.error?.message || "Unknown error"
              } ❌`,
            }));
          }
        }
      } catch (uploadError) {
        console.error("Test upload error:", uploadError);
        setStatus((prev) => ({
          ...prev,
          cloudinary: "Connected ✅",
          cloudinaryPreset: "Error testing upload preset ❌",
        }));
      }
    } catch (error) {
      console.error("Cloudinary check error:", error);
      setStatus((prev) => ({
        ...prev,
        cloudinary: "Error ❌",
        cloudinaryPreset: "Not tested ⚠️",
      }));
    }
  };

  // Helper function to create a small test image
  const createTestImage = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  const checkFirebaseAuth = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setStatus((prev) => ({ ...prev, firebaseAuth: "Logged in ✅" }));
      } else {
        setStatus((prev) => ({ ...prev, firebaseAuth: "Not logged in ⚠️" }));
      }
    } catch (error) {
      console.error("Firebase auth check error:", error);
      setStatus((prev) => ({ ...prev, firebaseAuth: "Error ❌" }));
    }
  };

  const fixCloudinaryPreset = () => {
    window.open("https://cloudinary.com/console/settings/upload", "_blank");
  };

  return (
    <div className="system-status">
      <button onClick={() => setShowDetails(!showDetails)}>
        {showDetails ? "Hide System Status" : "Check System Status"}
      </button>

      {showDetails && (
        <div className="status-details">
          <h4>System Status</h4>
          <ul>
            <li>
              <strong>Firebase Database:</strong> {status.firebase}
            </li>
            <li>
              <strong>Cloudinary:</strong> {status.cloudinary}
            </li>
            <li>
              <strong>Upload Preset:</strong> {status.cloudinaryPreset}
              {status.cloudinaryPreset.includes("❌") && (
                <button onClick={fixCloudinaryPreset} className="fix-button">
                  Fix in Cloudinary
                </button>
              )}
            </li>
            <li>
              <strong>Firebase Auth:</strong> {status.firebaseAuth}
            </li>
          </ul>

          <div className="environment-info">
            <h5>Environment Configuration</h5>
            <ul>
              <li>
                <strong>Firebase Project:</strong>{" "}
                {process.env.REACT_APP_FIREBASE_PROJECT_ID || "Not set"}
              </li>
              <li>
                <strong>Cloudinary Cloud:</strong>{" "}
                {process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "Not set"}
              </li>
              <li>
                <strong>Cloudinary Preset:</strong>{" "}
                {process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "Not set"}
              </li>
            </ul>
          </div>

          <div className="troubleshooting-tips">
            <h5>Troubleshooting Tips</h5>
            <p>If you see upload preset errors:</p>
            <ol>
              <li>
                Go to your{" "}
                <a
                  href="https://cloudinary.com/console/settings/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cloudinary Upload Settings
                </a>
              </li>
              <li>
                Find your upload preset:{" "}
                <strong>
                  {process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "tanc_id"}
                </strong>
              </li>
              <li>Enable "Unsigned uploading" for this preset</li>
              <li>Save your changes and refresh this page</li>
            </ol>
          </div>

          <button onClick={() => window.location.reload()}>
            Refresh System Status
          </button>
        </div>
      )}
    </div>
  );
}

export default SystemStatus;
