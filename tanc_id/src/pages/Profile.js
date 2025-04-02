import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateEmail, updatePassword } from "firebase/auth";
import LoadingSpinner from "../components/LoadingSpinner";
import ImageWithFallback from "../components/ImageWithFallback";
import { uploadToCloudinary, optimizeImageBeforeUpload } from "../cloudinary";
import "../styles/Profile.css";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newPhoto, setNewPhoto] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login", { replace: true });
          return;
        }

        console.log("Fetching user data for:", user.uid);

        // Check if user exists in users collection
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
          // Check if user is an admin
          const adminDoc = await getDoc(doc(db, "admins", user.uid));

          if (adminDoc.exists()) {
            // Allow admin to see their account info
            console.log("User is an admin");
            if (isMounted) {
              const adminData = {
                id: user.uid,
                emailAddress: user.email || adminDoc.data().emailAddress,
                firstName: adminDoc.data().firstName || "Admin",
                lastName: adminDoc.data().lastName || "User",
                isAdmin: true,
              };
              setUserData(adminData);
              setFormData(adminData);
              setIsLoading(false);
            }
            return;
          }

          console.log("User not found in users or admins collection");
          // Neither a user nor admin
          if (isMounted) {
            setError("Account not found. Please contact support.");
            setIsLoading(false);
          }
          return;
        }

        // Regular user data
        console.log("User found in users collection");
        const data = {
          id: user.uid,
          ...userDoc.data(),
        };

        if (isMounted) {
          setUserData(data);
          setFormData(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        if (isMounted) {
          setError("Failed to load your profile information: " + err.message);
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
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePhotoChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      try {
        // Optimize the image before setting it
        const optimizedFile = await optimizeImageBeforeUpload(
          e.target.files[0],
          600
        );
        setNewPhoto(optimizedFile);
      } catch (err) {
        console.error("Error optimizing image:", err);
        setNewPhoto(e.target.files[0]); // Fallback to original file
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      const updates = { ...formData };
      delete updates.id; // Remove id from updates object
      delete updates.isAdmin; // Remove isAdmin flag

      // Handle photo upload if changed
      if (newPhoto) {
        setMessage("Uploading photo...");
        const photoRes = await uploadToCloudinary(newPhoto);
        updates.photoUrl = photoRes.secure_url;
      }

      console.log("Updating profile with data:", updates);

      if (!userData.isAdmin) {
        // Update Firestore document for regular users
        console.log("Updating user document:", userData.id);
        await updateDoc(doc(db, "users", userData.id), updates);
      } else {
        // For admins, update the admin document
        console.log("Updating admin document:", userData.id);
        await updateDoc(doc(db, "admins", userData.id), {
          firstName: updates.firstName,
          lastName: updates.lastName,
          emailAddress: updates.emailAddress,
        });
      }

      // Update email if changed
      if (formData.emailAddress !== userData.emailAddress) {
        console.log(
          "Updating email from",
          userData.emailAddress,
          "to",
          formData.emailAddress
        );
        await updateEmail(auth.currentUser, formData.emailAddress);
        await auth.currentUser.getIdToken(true); // Force token refresh
      }

      // Update password if provided
      if (newPassword) {
        console.log("Updating password");
        await updatePassword(auth.currentUser, newPassword);
        setNewPassword("");
        setShowPasswordField(false);
      }

      // Update local user data
      setUserData({ ...userData, ...updates });

      // Update any cached user data in localStorage
      if (localStorage.getItem("userData")) {
        const cachedData = JSON.parse(localStorage.getItem("userData"));
        localStorage.setItem(
          "userData",
          JSON.stringify({ ...cachedData, ...updates })
        );
      }

      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  return (
    <div className="profile-container">
      <h2>
        My Profile{" "}
        {userData?.isAdmin && <span className="admin-badge">Admin</span>}
      </h2>

      {error && <div className="profile-error">{error}</div>}
      {message && <div className="profile-success">{message}</div>}

      <div className="profile-card">
        {!isEditing ? (
          <>
            <div className="profile-header">
              <div className="profile-photo">
                {userData?.photoUrl ? (
                  <ImageWithFallback
                    src={userData.photoUrl}
                    alt="Profile"
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-image-placeholder">
                    {userData?.firstName?.charAt(0)}
                    {userData?.lastName?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="profile-name">
                <h3>
                  {userData?.firstName}{" "}
                  {userData?.middleName ? userData.middleName + " " : ""}
                  {userData?.lastName}
                </h3>
                {!userData?.isAdmin && (
                  <p>Member since: {userData?.memberSince}</p>
                )}
                {userData?.isAdmin && (
                  <p className="admin-status">Administrator Account</p>
                )}
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{userData?.emailAddress}</span>
              </div>

              {!userData?.isAdmin && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Date of Birth:</span>
                    <span className="detail-value">
                      {userData?.dateOfBirth}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Gender:</span>
                    <span className="detail-value">{userData?.gender}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Home Address:</span>
                    <span className="detail-value">
                      {userData?.homeAddress}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="profile-actions">
              <button
                onClick={() => setIsEditing(true)}
                className="profile-edit-button"
              >
                Edit Profile
              </button>
              {!userData?.isAdmin && (
                <button
                  onClick={() => navigate("/my-id")}
                  className="profile-view-id"
                >
                  View My ID
                </button>
              )}
              {userData?.isAdmin && (
                <button
                  onClick={() => navigate("/admin-panel")}
                  className="profile-admin-panel"
                >
                  Admin Panel
                </button>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {!userData?.isAdmin && (
              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName || ""}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress || ""}
                onChange={handleInputChange}
              />
            </div>

            {!userData?.isAdmin && (
              <div className="form-group">
                <label>Home Address</label>
                <input
                  type="text"
                  name="homeAddress"
                  value={formData.homeAddress || ""}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {!showPasswordField ? (
              <div className="form-group">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setShowPasswordField(true)}
                >
                  Change Password
                </button>
              </div>
            ) : (
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <p className="form-hint">
                  Leave blank to keep current password
                </p>
              </div>
            )}

            {!userData?.isAdmin && (
              <div className="form-group">
                <label>Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="file-input"
                />
                {userData?.photoUrl && !newPhoto && (
                  <div className="current-photo">
                    <span>Current photo:</span>
                    <img
                      src={userData.photoUrl}
                      alt="Current"
                      width="100"
                      className="thumbnail"
                    />
                  </div>
                )}
                {newPhoto && (
                  <div className="new-photo">
                    <span>New photo:</span>
                    <img
                      src={URL.createObjectURL(newPhoto)}
                      alt="Preview"
                      width="100"
                      className="thumbnail"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(userData);
                  setNewPhoto(null);
                  setShowPasswordField(false);
                  setNewPassword("");
                }}
                className="cancel-button"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-button"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
