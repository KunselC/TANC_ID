import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  deleteDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import LoadingSpinner from "../components/LoadingSpinner";
import UserDetails from "../components/UserDetails";
import ImageWithFallback from "../components/ImageWithFallback";
import "../styles/AdminPanel.css";

function AdminPanel() {
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionStatus, setActionStatus] = useState("");
  const [actionType, setActionType] = useState(null);
  const navigate = useNavigate();

  // Initial data loading
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Check if user is authenticated
        const user = auth.currentUser;
        if (!user) {
          console.log("No user found, redirecting to admin login");
          navigate("/admin-login");
          return;
        }

        // Check if user is admin
        console.log("Checking admin status for:", user.uid);
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
          console.log("User is not an admin, redirecting to admin login");
          navigate("/admin-login");
          localStorage.removeItem("isAdmin");
          return;
        }

        console.log("Admin authenticated successfully, fetching data...");

        // Fetch applications with detailed error handling
        try {
          const applicationsRef = collection(db, "applications");
          const applicationsQuery = query(
            applicationsRef,
            orderBy("createdAt", "desc")
          );

          const querySnapshot = await getDocs(applicationsQuery);

          const applicationsData = [];
          querySnapshot.forEach((doc) => {
            applicationsData.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          console.log("Fetched applications:", applicationsData.length);
          if (isMounted) setApplications(applicationsData);
        } catch (appError) {
          console.error("Error fetching applications:", appError);
          if (isMounted)
            setError("Failed to load applications: " + appError.message);
        }

        // Fetch users with separate error handling
        try {
          const usersRef = collection(db, "users");
          const usersSnapshot = await getDocs(usersRef);

          const usersData = [];
          usersSnapshot.forEach((doc) => {
            usersData.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          console.log("Fetched users:", usersData.length);
          if (isMounted) setUsers(usersData);
        } catch (usersError) {
          console.error("Error fetching users:", usersError);
          if (isMounted)
            setError((prev) =>
              prev
                ? prev + " Also failed to load users."
                : "Failed to load users: " + usersError.message
            );
        }

        if (isMounted) setIsLoading(false);
      } catch (error) {
        console.error("Error in admin panel data fetch:", error);
        if (isMounted) {
          setError(`Failed to load admin data: ${error.message}`);
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Approve application handler
  const handleApprove = async (application) => {
    setSelectedApplication(application);
    setActionType("approve");
    setActionStatus("Processing...");

    try {
      // Update the application status
      await updateDoc(doc(db, "applications", application.id), {
        approved: true,
        approvedAt: Timestamp.now(),
      });

      // Create a new user record with the application data
      const userData = {
        firstName: application.firstName,
        middleName: application.middleName || "",
        lastName: application.lastName,
        dateOfBirth: application.dateOfBirth,
        gender: application.gender,
        memberSince: application.memberSince,
        emailAddress: application.emailAddress,
        homeAddress: application.homeAddress,
        photoUrl: application.headShotUrl || "",
        status: "active",
        createdAt: Timestamp.now(),
        expiresAt: calculateExpiryDate(application.memberSince),
        userId: application.userId,
      };

      // Save the user data to Firestore
      await setDoc(doc(db, "users", application.userId), userData);

      // Update local state
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === application.id ? { ...app, approved: true } : app
        )
      );
      setUsers((prevUsers) => [
        ...prevUsers,
        { id: application.userId, ...userData },
      ]);

      setActionStatus("Application approved successfully!");
    } catch (error) {
      console.error("Error approving application:", error);
      setActionStatus(`Error: ${error.message}`);
    }
  };

  // Reject application handler
  const handleReject = async (application) => {
    setSelectedApplication(application);
    setActionType("reject");
    setActionStatus("Processing...");

    try {
      // Update the application status
      await updateDoc(doc(db, "applications", application.id), {
        rejected: true,
        rejectedAt: Timestamp.now(),
      });

      // Update local state
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === application.id ? { ...app, rejected: true } : app
        )
      );

      setActionStatus("Application rejected successfully!");
    } catch (error) {
      console.error("Error rejecting application:", error);
      setActionStatus(`Error: ${error.message}`);
    }
  };

  // Delete application handler
  const handleDelete = async (application) => {
    if (
      window.confirm(
        "Are you sure you want to delete this application? This cannot be undone."
      )
    ) {
      setSelectedApplication(application);
      setActionType("delete");
      setActionStatus("Processing...");

      try {
        // Delete the application
        await deleteDoc(doc(db, "applications", application.id));

        // Update local state
        setApplications((prevApplications) =>
          prevApplications.filter((app) => app.id !== application.id)
        );

        setActionStatus("Application deleted successfully!");
        setSelectedApplication(null);
      } catch (error) {
        console.error("Error deleting application:", error);
        setActionStatus(`Error: ${error.message}`);
      }
    }
  };

  // Helper function to calculate expiry date (5 years from member since date)
  const calculateExpiryDate = (memberSince) => {
    try {
      const date = new Date(memberSince);
      date.setFullYear(date.getFullYear() + 5);
      return Timestamp.fromDate(date);
    } catch (err) {
      console.error("Invalid date format:", err);
      // Default to 5 years from now
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() + 5);
      return Timestamp.fromDate(defaultDate);
    }
  };

  // Filter applications based on active tab
  const filteredApplications = applications.filter((application) => {
    switch (activeTab) {
      case "pending":
        return !application.approved && !application.rejected;
      case "approved":
        return application.approved;
      case "rejected":
        return application.rejected;
      default:
        return true;
    }
  });

  // Handle view application details
  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setActionType("view");
    setActionStatus("");
  };

  // Handle view user details
  const handleViewUser = (user) => {
    setSelectedUser(user);
  };

  // Handle closing application details view
  const handleCloseApplicationDetails = () => {
    setSelectedApplication(null);
    setActionType(null);
    setActionStatus("");
  };

  // Handle retry for errors
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Render loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading admin panel..." />;
  }

  // Render error state
  if (error) {
    return (
      <div className="admin-container error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  // Render application details
  if (selectedApplication && actionType === "view") {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h2>Application Details</h2>
          <button
            onClick={handleCloseApplicationDetails}
            className="back-button"
          >
            Back to List
          </button>
        </div>

        <div className="application-details">
          <div className="application-info">
            <h3>
              {selectedApplication.firstName}{" "}
              {selectedApplication.middleName
                ? selectedApplication.middleName + " "
                : ""}
              {selectedApplication.lastName}
            </h3>
            <p>
              <strong>Date of Birth:</strong> {selectedApplication.dateOfBirth}
            </p>
            <p>
              <strong>Gender:</strong> {selectedApplication.gender}
            </p>
            <p>
              <strong>Member Since:</strong> {selectedApplication.memberSince}
            </p>
            <p>
              <strong>Email Address:</strong> {selectedApplication.emailAddress}
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
                <ImageWithFallback
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
                <ImageWithFallback
                  src={selectedApplication.headShotUrl}
                  alt="Head Shot"
                  className="application-image"
                  width="200"
                />
              </div>
            )}
          </div>

          <div className="application-actions">
            {!selectedApplication.approved && !selectedApplication.rejected && (
              <>
                <button
                  onClick={() => handleApprove(selectedApplication)}
                  className="approve-button"
                >
                  Approve Application
                </button>
                <button
                  onClick={() => handleReject(selectedApplication)}
                  className="reject-button"
                >
                  Reject Application
                </button>
              </>
            )}
            <button
              onClick={() => handleDelete(selectedApplication)}
              className="delete-button"
            >
              Delete Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Action feedback view
  if (selectedApplication && actionType && actionType !== "view") {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h2>
            Application{" "}
            {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
          </h2>
        </div>

        <div className="action-status">
          <p>{actionStatus}</p>
          <button
            onClick={handleCloseApplicationDetails}
            className="back-button"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  // Main admin panel view
  return (
    <div className="admin-container">
      <h2>Admin Panel</h2>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Applications (
          {applications.filter((app) => !app.approved && !app.rejected).length})
        </button>
        <button
          className={`tab-button ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          Approved Applications (
          {applications.filter((app) => app.approved).length})
        </button>
        <button
          className={`tab-button ${activeTab === "rejected" ? "active" : ""}`}
          onClick={() => setActiveTab("rejected")}
        >
          Rejected Applications (
          {applications.filter((app) => app.rejected).length})
        </button>
        <button
          className={`tab-button ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users ({users.length})
        </button>
      </div>

      {activeTab !== "users" ? (
        <div className="application-list">
          <h3>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
            Applications
          </h3>

          {filteredApplications.length === 0 ? (
            <p className="no-data">No {activeTab} applications found.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Date of Birth</th>
                  <th>Date Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      {application.firstName} {application.lastName}
                    </td>
                    <td>{application.emailAddress}</td>
                    <td>{application.dateOfBirth}</td>
                    <td>
                      {application.createdAt
                        ? new Date(application.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewApplication(application)}
                        className="view-button"
                      >
                        View
                      </button>
                      {activeTab === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(application)}
                            className="approve-button small"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(application)}
                            className="reject-button small"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="user-list">
          <h3>All Users</h3>

          {users.length === 0 ? (
            <p className="no-data">No users found.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Member Since</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.firstName} {user.lastName}
                    </td>
                    <td>{user.emailAddress}</td>
                    <td>{user.memberSince}</td>
                    <td>
                      {user.expiresAt
                        ? user.expiresAt.toDate
                          ? user.expiresAt.toDate().toLocaleDateString()
                          : new Date(user.expiresAt).toLocaleDateString()
                        : "Unknown"}
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewUser(user)}
                        className="view-button"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <UserDetails
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
