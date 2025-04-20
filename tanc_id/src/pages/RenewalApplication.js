import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, addDoc, collection, Timestamp } from "firebase/firestore";
import { updateEmail, updatePassword } from "firebase/auth";
import { uploadToCloudinary, optimizeImageBeforeUpload } from "../cloudinary"; // Assuming these exist
import LoadingSpinner from "../components/LoadingSpinner";
import ImageWithFallback from "../components/ImageWithFallback";
import "../styles/Form.css"; // Reuse form styles
import "../styles/Renewal.css"; // Add specific renewal styles

function RenewalApplication() {
  const navigate = useNavigate();
  const [currentUserData, setCurrentUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // For submission loading state
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newHeadshot, setNewHeadshot] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [wantsToUpdate, setWantsToUpdate] = useState(false); // Control showing the form

  useEffect(() => {
    let isMounted = true;
    const fetchUserData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          setError("Active membership record not found. Cannot renew.");
          setIsLoading(false);
          return;
        }

        const data = { id: user.uid, ...userDoc.data() };
        if (isMounted) {
          setCurrentUserData(data);
          setFormData(data); // Pre-fill form data
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching user data for renewal:", err);
        if (isMounted) {
          setError("Failed to load your information: " + err.message);
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleHeadshotChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const optimizedFile = await optimizeImageBeforeUpload(
          e.target.files[0],
          600
        );
        setNewHeadshot(optimizedFile);
      } catch (err) {
        console.error("Error optimizing image:", err);
        setError("Error processing image. Please try another file.");
        setNewHeadshot(null); // Fallback
      }
    }
  };

  // Handles both "Renew without changes" and "Submit Updated Info"
  const handleSubmitRenewal = async (e) => {
    e.preventDefault(); // Prevent default form submission if applicable
    setIsUpdating(true);
    setError("");
    setMessage("Processing renewal request...");

    const user = auth.currentUser;
    if (!user) {
      setError("Authentication error. Please log in again.");
      setIsUpdating(false);
      return;
    }

    try {
      let finalUserData = { ...currentUserData }; // Start with original data
      let headShotUrl = currentUserData.photoUrl; // Keep existing photo by default

      // If updating, prepare the updates object
      if (wantsToUpdate) {
        // --- Photo Upload ---
        if (newHeadshot) {
          setMessage("Uploading new headshot...");
          try {
            const photoRes = await uploadToCloudinary(newHeadshot);
            headShotUrl = photoRes.secure_url;
            setMessage("Headshot uploaded.");
          } catch (uploadError) {
            throw new Error(`Headshot upload failed: ${uploadError.message}`);
          }
        }

        // --- Email Update ---
        if (formData.emailAddress !== currentUserData.emailAddress) {
          setMessage("Updating email address...");
          try {
            await updateEmail(user, formData.emailAddress);
            await user.getIdToken(true); // Force refresh token
            setMessage("Email updated.");
          } catch (emailError) {
            throw new Error(
              `Failed to update email: ${emailError.message}. Please re-authenticate if prompted.`
            );
          }
        }

        // --- Password Update ---
        if (newPassword) {
          setMessage("Updating password...");
          try {
            await updatePassword(user, newPassword);
            setNewPassword(""); // Clear password field
            setShowPasswordField(false);
            setMessage("Password updated.");
          } catch (passwordError) {
            throw new Error(
              `Failed to update password: ${passwordError.message}. Please re-authenticate if prompted.`
            );
          }
        }

        // --- Prepare updated user data for the renewal application ---
        finalUserData = {
          ...currentUserData, // Base
          // Apply changes from the form
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || "",
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          homeAddress: formData.homeAddress,
          emailAddress: formData.emailAddress, // Use the potentially updated email
          photoUrl: headShotUrl, // Use the potentially updated photo URL
          // Keep original memberSince, expiresAt will be recalculated on approval
        };
      }

      // --- Create Renewal Application in Firestore ---
      setMessage("Submitting renewal application...");
      const renewalApplicationData = {
        userId: user.uid, // Link to the authenticated user
        originalUserId: currentUserData.id, // Link to the existing user doc ID
        type: "renewal", // Mark as renewal type
        submittedAt: Timestamp.now(),
        status: "pending", // Renewal needs admin approval
        // Include all relevant user data (either original or updated)
        firstName: finalUserData.firstName,
        middleName: finalUserData.middleName,
        lastName: finalUserData.lastName,
        dateOfBirth: finalUserData.dateOfBirth,
        gender: finalUserData.gender,
        memberSince: finalUserData.memberSince, // Keep original join date
        emailAddress: finalUserData.emailAddress,
        homeAddress: finalUserData.homeAddress,
        headShotUrl: finalUserData.photoUrl, // Use photoUrl field for consistency
        // No greenbook needed for renewal
      };

      await addDoc(collection(db, "applications"), renewalApplicationData);

      // --- Navigate to Confirmation ---
      navigate("/confirmation", {
        state: {
          type: "renewal",
          name: finalUserData.firstName,
        },
      });
    } catch (err) {
      console.error("Renewal submission error:", err);
      setError(`Error submitting renewal: ${err.message}`);
      setMessage(""); // Clear processing message
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your information..." />;
  }

  if (error && !currentUserData) {
    // Show fatal error if user data couldn't load
    return (
      <div className="form-container error-container">
        <p>{error}</p>
      </div>
    );
  }

  if (!currentUserData) {
    // Should be handled by loading/error, but as a fallback
    return (
      <div className="form-container">
        <p>Could not load user data.</p>
      </div>
    );
  }

  return (
    <div className="form-container renewal-container">
      <h2 className="form-title">Membership Renewal</h2>

      {error && <div className="form-status form-status-error">{error}</div>}
      {message && <div className="form-status form-status-info">{message}</div>}

      {!wantsToUpdate ? (
        // --- Initial View: Show current info and options ---
        <div className="renewal-summary">
          <h3>Your Current Information</h3>
          <div className="profile-card">
            {" "}
            {/* Reuse profile card styles */}
            <div className="profile-header">
              <div className="profile-photo">
                {currentUserData.photoUrl ? (
                  <ImageWithFallback
                    src={currentUserData.photoUrl}
                    alt="Headshot"
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-image-placeholder">?</div>
                )}
              </div>
              <div className="profile-name">
                <h3>
                  {currentUserData.firstName} {currentUserData.middleName}{" "}
                  {currentUserData.lastName}
                </h3>
                <p>
                  Member Since:{" "}
                  {currentUserData.memberSince
                    ? new Date(currentUserData.memberSince).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  Expires:{" "}
                  {currentUserData.expiresAt
                    ? currentUserData.expiresAt.toDate().toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="profile-details">
              {/* Display other relevant details */}
              <p>
                <strong>Email:</strong> {currentUserData.emailAddress}
              </p>
              <p>
                <strong>DOB:</strong> {currentUserData.dateOfBirth}
              </p>
              <p>
                <strong>Gender:</strong> {currentUserData.gender}
              </p>
              <p>
                <strong>Address:</strong> {currentUserData.homeAddress}
              </p>
            </div>
          </div>

          <p className="renewal-fee-notice">
            The standard renewal fee is $100 for 5 years. Please proceed to
            submit your renewal application. You will be reminded about payment
            upon successful submission.
          </p>

          <div className="renewal-actions">
            <button
              onClick={handleSubmitRenewal}
              className="button primary-button"
              disabled={isUpdating}
            >
              {isUpdating ? "Processing..." : "Renew Without Changes"}
            </button>
            <button
              onClick={() => setWantsToUpdate(true)}
              className="button secondary-button"
              disabled={isUpdating}
            >
              Update Information Before Renewing
            </button>
          </div>
        </div>
      ) : (
        // --- Update Form View ---
        <form onSubmit={handleSubmitRenewal} className="renewal-form">
          <h3>Update Your Information</h3>
          <p>
            Review and update your details below. Leave fields unchanged if they
            are correct.
          </p>

          {/* Reuse form groups from Application/Profile */}
          <div className="form-row">
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Middle Name</label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName || ""}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          {/* DOB and Gender - Usually don't change, but allow for corrections */}
          <div className="form-row">
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth || ""}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Home Address</label>
            <input
              type="text"
              name="homeAddress"
              value={formData.homeAddress || ""}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="emailAddress"
              value={formData.emailAddress || ""}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          {/* Password Change Option */}
          {!showPasswordField ? (
            <div className="form-group">
              <button
                type="button"
                className="text-button"
                onClick={() => setShowPasswordField(true)}
              >
                Change Password (Optional)
              </button>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="form-input"
              />
              <p className="form-hint">Leave blank to keep current password.</p>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setShowPasswordField(false);
                  setNewPassword("");
                }}
              >
                Cancel Password Change
              </button>
            </div>
          )}

          {/* Headshot Update */}
          <div className="form-group">
            <label className="form-label">
              Update Headshot Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleHeadshotChange}
              className="form-file-input"
            />
            <div className="photo-previews">
              {currentUserData?.photoUrl && !newHeadshot && (
                <div className="current-photo">
                  <span>Current:</span>
                  <img
                    src={currentUserData.photoUrl}
                    alt="Current Headshot"
                    width="100"
                    className="thumbnail"
                  />
                </div>
              )}
              {newHeadshot && (
                <div className="new-photo">
                  <span>New Preview:</span>
                  <img
                    src={URL.createObjectURL(newHeadshot)}
                    alt="New Headshot Preview"
                    width="100"
                    className="thumbnail"
                  />
                </div>
              )}
            </div>
          </div>

          <p className="renewal-fee-notice">
            The standard renewal fee is $100 for 5 years. Submit your updated
            information below. You will be reminded about payment upon
            successful submission.
          </p>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setWantsToUpdate(false)}
              className="button secondary-button"
              disabled={isUpdating}
            >
              Cancel Update
            </button>
            <button
              type="submit"
              className="button primary-button"
              disabled={isUpdating}
            >
              {isUpdating ? "Submitting..." : "Submit Updated Info & Renew"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default RenewalApplication;
