import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import UserDetails from "../components/UserDetails";
import "../styles/AdminPanel.css";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);

        const adminsSnapshot = await getDocs(collection(db, "admins"));
        const adminsList = adminsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAdmins(adminsList);

        const applicationsSnapshot = await getDocs(
          collection(db, "applications")
        );
        const applicationsList = applicationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApplications(applicationsList);
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("Error loading data. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async (application) => {
    try {
      const applicationRef = doc(db, "applications", application.id);
      const userRef = doc(db, "users", application.userId);

      // Move application to users collection
      await setDoc(userRef, {
        firstName: application.firstName,
        middleName: application.middleName,
        lastName: application.lastName,
        dateOfBirth: application.dateOfBirth,
        gender: application.gender,
        memberSince: application.memberSince,
        emailAddress: application.emailAddress,
        homeAddress: application.homeAddress,
        photoUrl: application.headShotUrl,
        wantId: application.wantId,
      });

      // Remove application from applications collection
      await deleteDoc(applicationRef);

      // Update state
      setApplications((prev) =>
        prev.filter((app) => app.id !== application.id)
      );
      setUsers((prev) => [
        ...prev,
        {
          id: application.userId,
          firstName: application.firstName,
          middleName: application.middleName,
          lastName: application.lastName,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          memberSince: application.memberSince,
          emailAddress: application.emailAddress,
          homeAddress: application.homeAddress,
          photoUrl: application.headShotUrl,
          wantId: application.wantId,
        },
      ]);
      setSelectedApplication(null);
      alert("Application approved successfully!");
    } catch (err) {
      console.error("Error approving application:", err);
      alert("Error approving application: " + err.message);
    }
  };

  const handleDeny = async (application) => {
    try {
      const applicationRef = doc(db, "applications", application.id);
      const userRef = doc(db, "users", application.userId);

      // Remove application from applications collection
      await deleteDoc(applicationRef);

      // Remove user from users collection if it exists
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        await deleteDoc(userRef);
      }

      // Remove images from Cloudinary
      if (application.headShotUrl) {
        // Note: This should ideally be done via a server/cloud function for security
        try {
          await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/destroy`,
            {
              method: "POST",
              body: JSON.stringify({ public_id: application.headShotUrl }),
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        } catch (cloudinaryErr) {
          console.error("Error removing image from Cloudinary:", cloudinaryErr);
          // Continue with the process even if image removal fails
        }
      }

      setApplications((prev) =>
        prev.filter((app) => app.id !== application.id)
      );
      setSelectedApplication(null);
      alert("Application denied successfully!");
    } catch (err) {
      console.error("Error denying application:", err);
      alert("Error denying application: " + err.message);
    }
  };

  const handleRemoveUser = async (user) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${user.firstName} ${user.lastName}?`
      )
    ) {
      return;
    }

    try {
      // Delete user from users collection
      await deleteDoc(doc(db, "users", user.id));

      // Remove images from Cloudinary
      if (user.photoUrl) {
        try {
          await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/destroy`,
            {
              method: "POST",
              body: JSON.stringify({ public_id: user.photoUrl }),
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        } catch (cloudinaryErr) {
          console.error("Error removing image from Cloudinary:", cloudinaryErr);
          // Continue with the process even if image removal fails
        }
      }

      // Update state
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSelectedUser(null);
      alert("User removed successfully!");
    } catch (err) {
      console.error("Error removing user:", err);
      alert("Error removing user: " + err.message);
    }
  };

  const handleSelectApplication = (application) => {
    setSelectedApplication(application);
  };

  const handleSelectUser = (user) => {
    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser(null); // Toggle off if the same user is clicked again
    } else {
      setSelectedUser(user);
    }
  };

  // Improved filtering for better performance and error handling
  const filteredUsers = users.filter(
    (user) =>
      (user.firstName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (user.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.emailAddress?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      )
  );

  const filteredAdmins = admins.filter((admin) =>
    (admin.emailAddress?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(
    (app) =>
      (app.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (app.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (app.emailAddress?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="loading-container">Loading admin panel...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search"
        />
      </div>

      <div className="admin-section">
        <h3>Users</h3>
        {filteredUsers.length === 0 ? (
          <p className="admin-empty">No users found.</p>
        ) : (
          <ul className="admin-list">
            {filteredUsers.map((user) => (
              <li key={user.id} className="admin-list-item">
                <span className="admin-user-name">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={() => handleSelectUser(user)}
                  className="admin-button admin-button-view"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleRemoveUser(user)}
                  className="admin-button admin-button-remove"
                >
                  Remove User
                </button>
                {selectedUser && selectedUser.id === user.id && (
                  <UserDetails
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="admin-section">
        <h3>Admins</h3>
        <p className="admin-note">
          Note: You can search Firebase Authentication for a specific UID to
          find the associated email.
        </p>
        {filteredAdmins.length === 0 ? (
          <p className="admin-empty">No admins found.</p>
        ) : (
          <ul className="admin-list">
            {filteredAdmins.map((admin) => (
              <li key={admin.id} className="admin-list-item">
                <span className="admin-user-name">
                  {admin.emailAddress || admin.email}
                </span>
                <span className="admin-user-id">UID: {admin.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="admin-section">
        <h3>Pending Applications</h3>
        {filteredApplications.length === 0 ? (
          <p className="admin-empty">No pending applications found.</p>
        ) : (
          <ul className="admin-list">
            {filteredApplications
              .filter((app) => !app.approved)
              .map((app) => (
                <li key={app.id} className="admin-list-item">
                  <span className="admin-user-name">
                    {app.firstName} {app.lastName} - {app.emailAddress}
                  </span>
                  <div>
                    <button
                      onClick={() => handleSelectApplication(app)}
                      className="admin-button admin-button-view"
                    >
                      View Details
                    </button>
                    {!selectedApplication && (
                      <>
                        <button
                          onClick={() => handleApprove(app)}
                          className="admin-button admin-button-approve"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeny(app)}
                          className="admin-button admin-button-deny"
                        >
                          Deny
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>

      {selectedApplication && (
        <div className="admin-section application-details">
          <h3>Application Details</h3>
          <div className="admin-details-grid">
            <div className="admin-details-column">
              <p>
                <strong>First Name:</strong> {selectedApplication.firstName}
              </p>
              <p>
                <strong>Middle Name:</strong>{" "}
                {selectedApplication.middleName || "N/A"}
              </p>
              <p>
                <strong>Last Name:</strong> {selectedApplication.lastName}
              </p>
              <p>
                <strong>Date of Birth:</strong>{" "}
                {selectedApplication.dateOfBirth}
              </p>
              <p>
                <strong>Gender:</strong> {selectedApplication.gender}
              </p>
              <p>
                <strong>Member Since:</strong> {selectedApplication.memberSince}
              </p>
              <p>
                <strong>Email Address:</strong>{" "}
                {selectedApplication.emailAddress}
              </p>
              <p>
                <strong>Home Address:</strong> {selectedApplication.homeAddress}
              </p>
              <p>
                <strong>Want ID:</strong>{" "}
                {selectedApplication.wantId ? "Yes" : "No"}
              </p>
            </div>

            <div className="application-images">
              {selectedApplication.greenBookUrl && (
                <div>
                  <p>
                    <strong>Green Book:</strong>
                  </p>
                  <img
                    src={selectedApplication.greenBookUrl}
                    alt="Green Book"
                    className="application-image"
                    width="200"
                  />
                </div>
              )}

              {selectedApplication.headShotUrl && (
                <div>
                  <p>
                    <strong>Head Shot:</strong>
                  </p>
                  <img
                    src={selectedApplication.headShotUrl}
                    alt="Head Shot"
                    className="application-image"
                    width="200"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="application-actions">
            <button
              onClick={() => handleApprove(selectedApplication)}
              className="admin-button admin-button-approve"
            >
              Approve
            </button>
            <button
              onClick={() => handleDeny(selectedApplication)}
              className="admin-button admin-button-deny"
            >
              Deny
            </button>
            <button
              onClick={() => setSelectedApplication(null)}
              className="admin-button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
