import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { updateEmail, updatePassword } from "firebase/auth";
import { uploadToCloudinary } from "../cloudinary";
import imageCompression from "browser-image-compression";
import LoadingSpinner from "../components/LoadingSpinner";
import ImageWithFallback from "../components/ImageWithFallback";
import "../styles/Profile.css";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
  });
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchProfileData = async () => {
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

        if (isMounted) {
          setUserData(fetchedData);
          setFormData({
            firstName: fetchedData.firstName || "",
            lastName: fetchedData.lastName || "",
            emailAddress: fetchedData.emailAddress || user.email || "",
          });
          setPhotoPreview(fetchedData.photoUrl || null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        if (isMounted) {
          setError("Failed to load profile data: " + err.message);
          setIsLoading(false);
        }
      }
    };

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError("");
    setMessage("");

    if (!formData.firstName || !formData.lastName) {
      setError("First and last name cannot be empty.");
      setIsUpdating(false);
      return;
    }
    if (!formData.emailAddress || !/\S+@\S+\.\S+/.test(formData.emailAddress)) {
      setError("Please enter a valid email address.");
      setIsUpdating(false);
      return;
    }
    if (showPasswordField) {
      if (!newPassword || newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        setIsUpdating(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        setIsUpdating(false);
        return;
      }
    }

    try {
      const updates = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.emailAddress,
      };

      if (newPhoto) {
        setMessage("Uploading photo...");
        const photoRes = await uploadToCloudinary(newPhoto);
        updates.photoUrl = photoRes.secure_url;
        setMessage("");
      }

      const collectionName = userData.isAdmin ? "admins" : "users";
      const docRef = doc(db, collectionName, userData.id);

      const firestoreUpdates = {
        firstName: updates.firstName,
        lastName: updates.lastName,
        emailAddress: updates.emailAddress,
        updatedAt: Timestamp.now(),
      };
      if (updates.photoUrl && collectionName === "users") {
        firestoreUpdates.photoUrl = updates.photoUrl;
      }

      await updateDoc(docRef, firestoreUpdates);

      if (formData.emailAddress !== auth.currentUser.email) {
        setMessage("Updating email...");
        await updateEmail(auth.currentUser, formData.emailAddress);
        await auth.currentUser.getIdToken(true);
        setMessage("");
      }

      if (showPasswordField && newPassword) {
        setMessage("Updating password...");
        await updatePassword(auth.currentUser, newPassword);
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordField(false);
        setMessage("");
      }

      const updatedLocalUserData = { ...userData, ...firestoreUpdates };
      if (updates.photoUrl) {
        updatedLocalUserData.photoUrl = updates.photoUrl;
      }
      setUserData(updatedLocalUserData);
      setFormData({
        firstName: updatedLocalUserData.firstName,
        lastName: updatedLocalUserData.lastName,
        emailAddress: updatedLocalUserData.emailAddress,
      });
      setNewPhoto(null);
      setPhotoPreview(updatedLocalUserData.photoUrl || null);

      setMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      let userMessage = "Error updating profile: ";
      if (err.code === "auth/requires-recent-login") {
        userMessage +=
          "This operation requires you to log in again for security reasons.";
      } else if (err.code === "auth/email-already-in-use") {
        userMessage +=
          "This email address is already in use by another account.";
      } else {
        userMessage += err.message;
      }
      setError(userMessage);
      setMessage("");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error && !userData) {
    return (
      <div className="profile-container error-container">Error: {error}</div>
    );
  }

  return (
    <div className="profile-container">
      <h2>My Profile {userData?.isAdmin ? "(Admin)" : ""}</h2>

      {error && <div className="profile-error">{error}</div>}
      {message && <div className="profile-message">{message}</div>}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-photo-section">
          <label>Profile Photo</label>
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
          <p className="form-hint">
            Upload a new photo (PNG or JPG). Will be optimized.
          </p>
        </div>

        <div className="profile-details-section">
          <div className="form-group">
            <label htmlFor="firstName" className="form-label required">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              className="form-input"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={isUpdating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName" className="form-label required">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              className="form-input"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={isUpdating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emailAddress" className="form-label required">
              Email Address
            </label>
            <input
              id="emailAddress"
              name="emailAddress"
              type="email"
              className="form-input"
              value={formData.emailAddress}
              onChange={handleInputChange}
              disabled={isUpdating}
            />
          </div>

          {userData && !userData.isAdmin && (
            <>
              <div className="form-group read-only">
                <label className="form-label">Member Since</label>
                <span>
                  {userData.memberSince
                    ? new Date(userData.memberSince).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="form-group read-only">
                <label className="form-label">Membership Expires</label>
                <span>{getExpiryDateString(userData.expiresAt)}</span>
              </div>
            </>
          )}

          <div className="password-update-section">
            <button
              type="button"
              onClick={() => setShowPasswordField(!showPasswordField)}
              className="text-button"
              disabled={isUpdating}
            >
              {showPasswordField ? "Cancel Password Change" : "Change Password"}
            </button>

            {showPasswordField && (
              <>
                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label required">
                    New Password
                  </label>
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
                  <label
                    htmlFor="confirmPassword"
                    className="form-label required"
                  >
                    Confirm New Password
                  </label>
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
              </>
            )}
          </div>

          <button
            type="submit"
            className="profile-submit-button"
            disabled={isUpdating}
          >
            {isUpdating ? <LoadingSpinner size="small" /> : "Update Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

const getExpiryDateString = (expiresAtTimestamp) => {
  if (!expiresAtTimestamp || !expiresAtTimestamp.toDate) return "Unknown";
  try {
    return expiresAtTimestamp.toDate().toLocaleDateString();
  } catch (err) {
    console.error("Invalid expiry date format:", err);
    return "Unknown";
  }
};

export default Profile;
