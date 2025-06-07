import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { uploadToCloudinary } from "../cloudinary";
import imageCompression from "browser-image-compression";
import LoadingSpinner from "../components/LoadingSpinner";
import ImageWithFallback from "../components/ImageWithFallback";
import "../styles/Profile.css";

// Modal Component (can be moved to a separate file if preferred)
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="profile-modal-backdrop">
      <div className="profile-modal-content">
        <div className="profile-modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="profile-modal-close-button">
            &times;
          </button>
        </div>
        <div className="profile-modal-body">{children}</div>
      </div>
    </div>
  );
};

function Profile() {
  const [userData, setUserData] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordForAuth, setCurrentPasswordForAuth] = useState(""); // For re-authentication
  const [showPasswordField, setShowPasswordField] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // Generic updating state
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Modal states
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false); // New modal state for address
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false); // For re-authenticating before sensitive changes

  // Temporary states for modal inputs
  const [tempFirstName, setTempFirstName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempHomeAddress, setTempHomeAddress] = useState(""); // New temp state for address

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      let docRef;
      let docSnap;
      let fetchedData = {};

      const adminDocRef = doc(db, "admins", user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        docRef = adminDocRef;
        docSnap = adminDocSnap;
        fetchedData = { ...docSnap.data(), id: user.uid, isAdmin: true };
      } else {
        docRef = doc(db, "users", user.uid);
        docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          fetchedData = { ...docSnap.data(), id: user.uid, isAdmin: false };
        } else {
          setError(
            "Profile data not found. Please complete your application or contact support."
          );
          setIsLoading(false);
          return;
        }
      }

      setUserData(fetchedData);
      // Initialize temp states for modals
      setTempFirstName(fetchedData.firstName || "");
      setTempLastName(fetchedData.lastName || "");
      setTempEmail(fetchedData.emailAddress || user.email || "");
      setTempHomeAddress(fetchedData.homeAddress || ""); // Initialize temp home address
      setPhotoPreview(fetchedData.photoUrl || null);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile data: " + err.message);
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handlePhotoChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!["image/png", "image/jpeg"].includes(file.type)) {
        setError("Invalid file type. Please upload PNG or JPG.");
        setNewPhoto(null);
        setPhotoPreview(userData?.photoUrl || null);
        e.target.value = null;
        return;
      }
      setError("");

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      try {
        setMessage("Optimizing photo...");
        const optimizedFile = await imageCompression(file, options);
        setNewPhoto(optimizedFile);
        setMessage("");
      } catch (err) {
        console.error("Error optimizing image:", err);
        setError("Could not optimize image, using original file.");
        setNewPhoto(file);
        setMessage("");
      }
    }
  };

  const handleSavePhoto = async () => {
    if (!newPhoto) {
      setError("No new photo selected.");
      return;
    }
    setIsUpdating(true);
    setError("");
    setMessage("Uploading photo...");
    try {
      const photoRes = await uploadToCloudinary(newPhoto);
      const collectionName = userData.isAdmin ? "admins" : "users";
      const docRef = doc(db, collectionName, userData.id);
      await updateDoc(docRef, {
        photoUrl: photoRes.secure_url,
        updatedAt: Timestamp.now(),
      });
      setUserData((prev) => ({ ...prev, photoUrl: photoRes.secure_url }));
      setNewPhoto(null);
      // Photo preview is already updated
      setMessage("Profile photo updated successfully!");
    } catch (err) {
      console.error("Photo update error:", err);
      setError(`Error updating photo: ${err.message}`);
      setMessage("");
    } finally {
      setIsUpdating(false);
    }
  };

  const openNameModal = () => {
    setTempFirstName(userData?.firstName || "");
    setTempLastName(userData?.lastName || "");
    setError("");
    setMessage("");
    setIsNameModalOpen(true);
  };

  const handleNameChangeSubmit = async () => {
    if (!tempFirstName.trim() || !tempLastName.trim()) {
      setError("First and last name cannot be empty.");
      return;
    }
    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      await addDoc(collection(db, "nameChangeRequests"), {
        userId: userData.id,
        oldFirstName: userData.firstName,
        oldLastName: userData.lastName,
        newFirstName: tempFirstName.trim(),
        newLastName: tempLastName.trim(),
        userEmail: userData.emailAddress, // For admin convenience
        status: "pending",
        requestedAt: Timestamp.now(),
      });
      setMessage(
        "Name change request submitted for admin approval. Your name will be updated once approved."
      );
      setIsNameModalOpen(false);
    } catch (err) {
      console.error("Name change request error:", err);
      setError(`Error submitting name change request: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEmailModal = () => {
    setTempEmail(userData?.emailAddress || auth.currentUser?.email || "");
    setError("");
    setMessage("");
    setIsEmailModalOpen(true);
  };

  const handleEmailChangeSubmit = async () => {
    if (!tempEmail.trim() || !/\S+@\S+\.\S+/.test(tempEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (tempEmail.trim() === userData.emailAddress) {
      setMessage("Email address is the same. No changes made.");
      setIsEmailModalOpen(false);
      return;
    }

    setIsUpdating(true);
    setError("");
    setMessage("Updating email...");

    try {
      const user = auth.currentUser;
      // Re-authentication might be needed for email change
      // For simplicity, we'll try direct update first. If it fails with 'auth/requires-recent-login', prompt for re-auth.
      await updateEmail(user, tempEmail.trim());

      const collectionName = userData.isAdmin ? "admins" : "users";
      const docRef = doc(db, collectionName, userData.id);
      await updateDoc(docRef, {
        emailAddress: tempEmail.trim(),
        updatedAt: Timestamp.now(),
      });

      setUserData((prev) => ({ ...prev, emailAddress: tempEmail.trim() }));
      await user.getIdToken(true); // Refresh token
      setMessage("Email address updated successfully!");
      setIsEmailModalOpen(false);
    } catch (err) {
      console.error("Email update error:", err);
      if (err.code === "auth/requires-recent-login") {
        setError(
          "Changing email requires you to re-authenticate. Please enter your current password."
        );
        setIsEmailModalOpen(false); // Close email modal
        setIsReauthModalOpen(true); // Open re-auth modal
        // Store tempEmail to use after re-auth
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email address is already in use by another account.");
      } else {
        setError(`Error updating email: ${err.message}`);
      }
      setMessage("");
    } finally {
      setIsUpdating(false);
    }
  };

  const openAddressModal = () => {
    setTempHomeAddress(userData?.homeAddress || "");
    setError("");
    setMessage("");
    setIsAddressModalOpen(true);
  };

  const handleAddressChangeSubmit = async () => {
    if (!tempHomeAddress.trim()) {
      setError("Home address cannot be empty.");
      return;
    }
    if (tempHomeAddress.trim() === userData.homeAddress) {
      setMessage("Address is the same. No changes made.");
      setIsAddressModalOpen(false);
      return;
    }

    setIsUpdating(true);
    setError("");
    setMessage("Updating address...");

    try {
      const collectionName = userData.isAdmin ? "admins" : "users";
      const docRef = doc(db, collectionName, userData.id);
      await updateDoc(docRef, {
        homeAddress: tempHomeAddress.trim(),
        updatedAt: Timestamp.now(),
      });

      setUserData((prev) => ({ ...prev, homeAddress: tempHomeAddress.trim() }));
      setMessage("Home address updated successfully!");
      setIsAddressModalOpen(false);
    } catch (err) {
      console.error("Address update error:", err);
      setError(`Error updating address: ${err.message}`);
      setMessage("");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReauthenticateAndRetryEmail = async () => {
    if (!currentPasswordForAuth) {
      setError("Please enter your current password to re-authenticate.");
      return;
    }
    setIsUpdating(true);
    setError("");
    setMessage("Re-authenticating...");

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPasswordForAuth
      );
      await reauthenticateWithCredential(user, credential);

      setMessage("Re-authentication successful. Retrying email update...");
      setCurrentPasswordForAuth(""); // Clear password
      setIsReauthModalOpen(false); // Close re-auth modal

      // Retry email update (logic from handleEmailChangeSubmit)
      await updateEmail(user, tempEmail.trim());
      const collectionName = userData.isAdmin ? "admins" : "users";
      const docRef = doc(db, collectionName, userData.id);
      await updateDoc(docRef, {
        emailAddress: tempEmail.trim(),
        updatedAt: Timestamp.now(),
      });
      setUserData((prev) => ({ ...prev, emailAddress: tempEmail.trim() }));
      await user.getIdToken(true);
      setMessage("Email address updated successfully!");
      // tempEmail is already set
    } catch (reauthErr) {
      console.error("Re-authentication or retry email error:", reauthErr);
      if (reauthErr.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (reauthErr.code === "auth/email-already-in-use") {
        setError("This email address is already in use by another account.");
      } else {
        setError(
          `Error during re-authentication or email update: ${reauthErr.message}`
        );
      }
      setMessage("");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChangeSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsUpdating(true);
    setError("");
    setMessage("Updating password...");

    try {
      const user = auth.currentUser;
      // Re-authentication might be needed for password change as well.
      // For simplicity, direct update. If 'auth/requires-recent-login', prompt for re-auth.
      await updatePassword(user, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordField(false);
      setMessage("Password updated successfully!");
    } catch (err) {
      console.error("Password update error:", err);
      if (err.code === "auth/requires-recent-login") {
        setError(
          "Changing password requires you to re-authenticate. Please enter your current password."
        );
        // Here you would typically open a re-auth modal for password change too.
        // For now, just showing error. Consider adding re-auth flow for password similar to email.
        // setIsReauthModalOpen(true); // and set a flag for what action to perform after re-auth
      } else {
        setError(`Error updating password: ${err.message}`);
      }
      setMessage("");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDateDMY = (dateInput) => {
    if (!dateInput) return "N/A";
    // Check if it's a Firebase Timestamp and convert, otherwise assume it's a Date object or string
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error && !userData && !isReauthModalOpen) {
    // Don't show main error if reauth modal is open
    return (
      <div className="profile-container error-container">Error: {error}</div>
    );
  }

  return (
    <div className="profile-container">
      <h2>My Profile {userData?.isAdmin ? "(Admin)" : ""}</h2>

      {error && !isReauthModalOpen && (
        <div className="profile-error">{error}</div>
      )}
      {message && <div className="profile-message">{message}</div>}

      <div className="profile-section">
        <h4>Photo</h4>
        <div className="profile-photo-section">
          <div className="photo-preview-container">
            {userData && (
              <ImageWithFallback
                src={photoPreview || userData.photoUrl}
                alt="Profile Photo"
                className="profile-photo-current"
                width="150"
                height="150"
                transformations="w_150,h_150,c_fill,g_face,f_auto,q_auto"
              />
            )}
          </div>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handlePhotoChange}
            disabled={isUpdating}
            className="profile-file-input"
          />
          {newPhoto && (
            <button
              onClick={handleSavePhoto}
              className="profile-action-button"
              disabled={isUpdating}
            >
              {isUpdating ? <LoadingSpinner size="small" /> : "Save Photo"}
            </button>
          )}
          <p className="form-hint">
            Upload a new photo (PNG or JPG). Will be optimized.
          </p>
        </div>
      </div>

      <div className="profile-section">
        <h4>Personal Information</h4>
        <div className="profile-info-item">
          <span className="profile-info-label">First Name:</span>
          <span className="profile-info-value">{userData?.firstName}</span>
          <button
            onClick={openNameModal}
            className="profile-change-button"
            disabled={isUpdating}
          >
            Change Name
          </button>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-label">Last Name:</span>
          <span className="profile-info-value">{userData?.lastName}</span>
          {/* Change Name button is shared for first and last name via the modal */}
        </div>
        <div className="profile-info-item">
          <span className="profile-info-label">Address:</span>
          <span className="profile-info-value">
            {userData?.homeAddress || "Not set"}
          </span>
          <button
            onClick={openAddressModal}
            className="profile-change-button"
            disabled={isUpdating}
          >
            Change Address
          </button>
        </div>
      </div>

      <div className="profile-section">
        <h4>Account Information</h4>
        <div className="profile-info-item">
          <span className="profile-info-label">Email Address:</span>
          <span className="profile-info-value">{userData?.emailAddress}</span>
          <button
            onClick={openEmailModal}
            className="profile-change-button"
            disabled={isUpdating}
          >
            Change Email
          </button>
        </div>

        {userData && !userData.isAdmin && (
          <>
            <div className="profile-info-item read-only">
              <span className="profile-info-label">Member Since:</span>
              <span className="profile-info-value">
                {userData.memberSince
                  ? formatDateDMY(userData.memberSince)
                  : "N/A"}
              </span>
            </div>
            <div className="profile-info-item read-only">
              <span className="profile-info-label">Membership Expires:</span>
              <span className="profile-info-value">
                {userData.expiresAt
                  ? formatDateDMY(userData.expiresAt) // No .toDate() needed if already Date from fetch
                  : "Unknown"}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="profile-section">
        <h4>Security</h4>
        <div className="password-update-section">
          <button
            type="button"
            onClick={() => {
              setShowPasswordField(!showPasswordField);
              setError(""); // Clear errors when toggling
              setMessage("");
              if (showPasswordField) {
                // if closing
                setNewPassword("");
                setConfirmPassword("");
              }
            }}
            className="profile-action-button" // Consistent button style
            disabled={isUpdating}
          >
            {showPasswordField ? "Cancel Password Change" : "Change Password"}
          </button>

          {showPasswordField && (
            <div className="password-fields-container">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  className="form-input"
                  placeholder="New Password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <button
                onClick={handlePasswordChangeSubmit}
                className="profile-action-button"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <LoadingSpinner size="small" />
                ) : (
                  "Save New Password"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        title="Change Name"
      >
        <div className="form-group">
          <label htmlFor="tempFirstName">First Name</label>
          <input
            id="tempFirstName"
            type="text"
            value={tempFirstName}
            onChange={(e) => setTempFirstName(e.target.value)}
            className="form-input"
            disabled={isUpdating}
          />
        </div>
        <div className="form-group">
          <label htmlFor="tempLastName">Last Name</label>
          <input
            id="tempLastName"
            type="text"
            value={tempLastName}
            onChange={(e) => setTempLastName(e.target.value)}
            className="form-input"
            disabled={isUpdating}
          />
        </div>
        {error && <p className="profile-error">{error}</p>}
        <button
          onClick={handleNameChangeSubmit}
          className="profile-modal-button"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <LoadingSpinner size="small" />
          ) : (
            "Submit Name Change Request"
          )}
        </button>
      </Modal>

      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Change Email Address"
      >
        <div className="form-group">
          <label htmlFor="tempEmail">New Email Address</label>
          <input
            id="tempEmail"
            type="email"
            value={tempEmail}
            onChange={(e) => setTempEmail(e.target.value)}
            className="form-input"
            disabled={isUpdating}
          />
        </div>
        {error && <p className="profile-error">{error}</p>}
        <button
          onClick={handleEmailChangeSubmit}
          className="profile-modal-button"
          disabled={isUpdating}
        >
          {isUpdating ? <LoadingSpinner size="small" /> : "Update Email"}
        </button>
      </Modal>

      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Change Home Address"
      >
        <div className="form-group">
          <label htmlFor="tempHomeAddress">New Home Address</label>
          <textarea
            id="tempHomeAddress"
            value={tempHomeAddress}
            onChange={(e) => setTempHomeAddress(e.target.value)}
            className="form-input" // Assuming form-input can be a textarea too, or use a specific class
            rows="3"
            disabled={isUpdating}
          />
        </div>
        {error && <p className="profile-error">{error}</p>}
        <button
          onClick={handleAddressChangeSubmit}
          className="profile-modal-button"
          disabled={isUpdating}
        >
          {isUpdating ? <LoadingSpinner size="small" /> : "Update Address"}
        </button>
      </Modal>

      <Modal
        isOpen={isReauthModalOpen}
        onClose={() => {
          setIsReauthModalOpen(false);
          setError("");
          setCurrentPasswordForAuth("");
        }}
        title="Re-authentication Required"
      >
        <p>For security, please enter your current password to continue.</p>
        <div className="form-group">
          <label htmlFor="currentPasswordForAuth">Current Password</label>
          <input
            id="currentPasswordForAuth"
            type="password"
            value={currentPasswordForAuth}
            onChange={(e) => setCurrentPasswordForAuth(e.target.value)}
            className="form-input"
            disabled={isUpdating}
          />
        </div>
        {error && <p className="profile-error">{error}</p>}
        <button
          onClick={handleReauthenticateAndRetryEmail}
          className="profile-modal-button"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <LoadingSpinner size="small" />
          ) : (
            "Confirm Password and Retry"
          )}
        </button>
      </Modal>

      {/* Removed the main form tag and the single "Update Profile" button */}
    </div>
  );
}

export default Profile;

/*
TODO for Profile.css:
- Style .profile-section, .profile-info-item, .profile-info-label, .profile-info-value, .profile-change-button
- Style .profile-action-button
- Style .profile-modal-backdrop, .profile-modal-content, .profile-modal-header, .profile-modal-body, .profile-modal-close-button, .profile-modal-button
- Style .password-fields-container
- Ensure .form-group, .form-input, .profile-error, .profile-message are styled appropriately within modals and sections.
*/
