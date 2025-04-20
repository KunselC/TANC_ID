import React, { useState, useEffect, useMemo } from "react";
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
  where,
  deleteDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import LoadingSpinner from "../components/LoadingSpinner";
import UserDetails from "../components/UserDetails";
import ImageWithFallback from "../components/ImageWithFallback";
import SystemStatus from "../components/SystemStatus";
import "../styles/AdminPanel.css";

// Explanation: applications collection stores all submitted applications (new/renewal, pending/approved/rejected).
// users collection stores the current state of actual members (active/expired), created/updated upon application approval.

// Helper function to calculate expiry date (5 years from a given date)
const calculateExpiryDateFromDate = (fromDate) => {
  try {
    const startDate = new Date(fromDate);
    if (isNaN(startDate.getTime())) {
      console.warn("Invalid date provided for expiry calculation:", fromDate);
      // Default to 5 years from now if date is invalid
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() + 5);
      return Timestamp.fromDate(defaultDate);
    }
    startDate.setFullYear(startDate.getFullYear() + 5);
    return Timestamp.fromDate(startDate);
  } catch (err) {
    console.error("Error calculating expiry date:", err);
    // Default to 5 years from now in case of any error
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 5);
    return Timestamp.fromDate(defaultDate);
  }
};

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
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userFilterStatus, setUserFilterStatus] = useState("all");
  const [userSortBy, setUserSortBy] = useState("name");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/admin-login");
          return;
        }

        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
          navigate("/admin-login");
          localStorage.removeItem("isAdmin");
          return;
        }

        // Fetch Pending Applications (New and Renewal)
        const appQuery = query(
          collection(db, "applications"),
          where("status", "==", "pending"),
          orderBy("submittedAt", "desc")
        );
        const appSnapshot = await getDocs(appQuery);
        const fetchedApplications = appSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch All Users
        const usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc")
        );
        const usersSnapshot = await getDocs(usersQuery);
        const fetchedUsers = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (isMounted) {
          setApplications(fetchedApplications);
          setUsers(fetchedUsers);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (isMounted) {
          setError("Failed to load data: " + err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [navigate]); // Add navigate to the dependency array

  const handleApprove = async (application) => {
    setActionStatus("Processing...");
    const isRenewal = application.type === "renewal";
    const now = Timestamp.now();

    try {
      // Simplify update: only set status and approvedAt
      await updateDoc(doc(db, "applications", application.id), {
        status: "approved",
        approvedAt: now,
      });

      const newExpiryDate = calculateExpiryDateFromDate(now.toDate());

      const userDataForUpdate = {
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
        expiresAt: newExpiryDate,
        userId: application.userId,
        updatedAt: now,
        ...(isRenewal ? {} : { createdAt: now }),
      };

      await setDoc(doc(db, "users", application.userId), userDataForUpdate, {
        merge: true,
      });

      setApplications((prevApplications) =>
        prevApplications.filter((app) => app.id !== application.id)
      );
      setUsers((prevUsers) => {
        const existingUserIndex = prevUsers.findIndex(
          (u) => u.id === application.userId
        );
        const updatedUser = { id: application.userId, ...userDataForUpdate };
        if (existingUserIndex > -1) {
          const updatedUsers = [...prevUsers];
          updatedUsers[existingUserIndex] = updatedUser;
          return updatedUsers;
        } else {
          return [...prevUsers, updatedUser];
        }
      });

      setActionStatus(
        `Application ${isRenewal ? "renewal " : ""}approved successfully!`
      );
      setSelectedApplication(null);
      setActionType(null);
    } catch (error) {
      console.error(
        `Error approving ${isRenewal ? "renewal " : ""}application:`,
        error
      );
      setActionStatus(`Error approving application: ${error.message}`);
      setSelectedApplication((prev) =>
        prev ? { ...prev, status: "pending" } : null
      );
      setActionType("view");
    }
  };

  const handleReject = async (application) => {
    setActionStatus("Processing...");
    const isRenewal = application.type === "renewal";

    try {
      // Simplify update: only set status and rejectedAt
      await updateDoc(doc(db, "applications", application.id), {
        status: "rejected",
        rejectedAt: Timestamp.now(),
      });

      setApplications((prevApplications) =>
        prevApplications.filter((app) => app.id !== application.id)
      );

      setActionStatus(
        `Application ${isRenewal ? "renewal " : ""}rejected successfully!`
      );
      setSelectedApplication(null);
      setActionType(null);
    } catch (error) {
      console.error(
        `Error rejecting ${isRenewal ? "renewal " : ""}application:`,
        error
      );
      setActionStatus(`Error rejecting application: ${error.message}`);
      setSelectedApplication((prev) =>
        prev ? { ...prev, status: "pending" } : null
      );
      setActionType("view");
    }
  };

  const handleDeleteInitiate = (application) => {
    setConfirmingDelete(application.id);
    setSelectedApplication(application);
    setActionType("view");
    setActionStatus("");
  };

  const handleDeleteConfirm = async (application) => {
    if (!application || confirmingDelete !== application.id) return;

    setActionType("delete");
    setActionStatus("Processing delete...");

    try {
      await deleteDoc(doc(db, "applications", application.id));

      setApplications((prevApplications) =>
        prevApplications.filter((app) => app.id !== application.id)
      );

      setActionStatus("Application deleted successfully!");
      setSelectedApplication(null);
      setConfirmingDelete(null);
      setActionType(null);
    } catch (error) {
      console.error("Error deleting application:", error);
      setActionStatus(`Error deleting application: ${error.message}`);
      setConfirmingDelete(null);
      setActionType("view");
    }
  };

  const handleDeleteCancel = () => {
    setConfirmingDelete(null);
  };

  const filteredAndSortedUsers = useMemo(() => {
    const now = new Date();
    return users
      .filter((user) => {
        const searchTermLower = userSearchTerm.toLowerCase();
        const nameMatch =
          user.firstName?.toLowerCase().includes(searchTermLower) ||
          user.lastName?.toLowerCase().includes(searchTermLower) ||
          `${user.firstName} ${user.lastName}`
            .toLowerCase()
            .includes(searchTermLower);
        const emailMatch = user.emailAddress
          ?.toLowerCase()
          .includes(searchTermLower);
        if (!nameMatch && !emailMatch) {
          return false;
        }

        if (userFilterStatus !== "all") {
          const isExpired = user.expiresAt?.toDate() < now;
          if (userFilterStatus === "active" && isExpired) return false;
          if (userFilterStatus === "expired" && !isExpired) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (userSortBy === "name") {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        } else if (userSortBy === "expiry") {
          const dateA = a.expiresAt?.toDate() || 0;
          const dateB = b.expiresAt?.toDate() || 0;
          return dateA - dateB;
        }
        return 0;
      });
  }, [users, userSearchTerm, userFilterStatus, userSortBy]);

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setActionType("view");
    setActionStatus("");
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
  };

  const handleCloseApplicationDetails = () => {
    setSelectedApplication(null);
    setActionType(null);
    setActionStatus("");
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading admin panel..." />;
  }

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

  if (selectedApplication && actionType === "view") {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h2>
            Application Details (
            {selectedApplication.type === "renewal" ? "Renewal" : "New"})
          </h2>
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
            <p>
              <strong>Submitted:</strong>{" "}
              {selectedApplication.submittedAt?.toDate().toLocaleString() ||
                "N/A"}
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
                  width="200" // Keep for layout hint
                  transformations="w_200,h_200,c_limit,f_auto,q_auto" // Add transformations
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
                  width="200" // Keep for layout hint
                  transformations="w_200,h_200,c_fill,g_face,f_auto,q_auto" // Add transformations (fill, face detection)
                />
              </div>
            )}
          </div>

          <div className="application-actions">
            <button
              onClick={() => handleApprove(selectedApplication)}
              className="approve-button"
              disabled={actionStatus.includes("Processing")}
            >
              Approve{" "}
              {selectedApplication.type === "renewal"
                ? "Renewal"
                : "Application"}
            </button>
            <button
              onClick={() => handleReject(selectedApplication)}
              className="reject-button"
              disabled={actionStatus.includes("Processing")}
            >
              Reject{" "}
              {selectedApplication.type === "renewal"
                ? "Renewal"
                : "Application"}
            </button>

            {confirmingDelete !== selectedApplication.id ? (
              <button
                onClick={() => handleDeleteInitiate(selectedApplication)}
                className="delete-button"
                disabled={actionStatus.includes("Processing")}
              >
                Delete Application
              </button>
            ) : (
              <div className="confirmation-buttons">
                <span>Are you sure?</span>
                <button
                  onClick={() => handleDeleteConfirm(selectedApplication)}
                  className="confirm-delete-button"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className="cancel-delete-button"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="admin-container">
      <h2>Admin Panel</h2>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Applications ({applications.length})
        </button>
        <button
          className={`tab-button ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          Approved Applications (
          {applications.filter((app) => app.status === "approved").length})
        </button>
        <button
          className={`tab-button ${activeTab === "rejected" ? "active" : ""}`}
          onClick={() => setActiveTab("rejected")}
        >
          Rejected Applications (
          {applications.filter((app) => app.status === "rejected").length})
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

          {applications.filter((application) => {
            switch (activeTab) {
              case "pending":
                return application.status === "pending";
              case "approved":
                return application.status === "approved";
              case "rejected":
                return application.status === "rejected";
              default:
                return true;
            }
          }).length === 0 ? (
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
                {applications
                  .filter((application) => {
                    switch (activeTab) {
                      case "pending":
                        return application.status === "pending";
                      case "approved":
                        return application.status === "approved";
                      case "rejected":
                        return application.status === "rejected";
                      default:
                        return true;
                    }
                  })
                  .map((application) => (
                    <tr key={application.id}>
                      <td>
                        {application.firstName} {application.lastName}
                      </td>
                      <td>{application.emailAddress}</td>
                      <td>{application.dateOfBirth}</td>
                      <td>
                        {application.submittedAt
                          ? application.submittedAt
                              .toDate()
                              .toLocaleDateString()
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
          <h3>All Users ({filteredAndSortedUsers.length})</h3>

          <div className="user-controls">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="user-search-input"
            />
            <select
              value={userFilterStatus}
              onChange={(e) => setUserFilterStatus(e.target.value)}
              className="user-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={userSortBy}
              onChange={(e) => setUserSortBy(e.target.value)}
              className="user-sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="expiry">Sort by Expiry Date</option>
            </select>
          </div>

          {isLoading ? (
            <LoadingSpinner message="Loading users..." />
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : filteredAndSortedUsers.length === 0 ? (
            <p className="no-data">No users match your criteria.</p>
          ) : (
            <table className="admin-table users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Member Since</th>
                  <th>Expires At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.map((user) => {
                  const expiryDate = user.expiresAt?.toDate();
                  const isExpired = expiryDate < new Date();
                  const statusText = isExpired ? "Expired" : "Active";

                  return (
                    <tr
                      key={user.id}
                      className={isExpired ? "expired-user" : ""}
                    >
                      <td>
                        {user.firstName} {user.lastName}
                      </td>
                      <td>{user.emailAddress}</td>
                      <td>
                        {user.memberSince
                          ? new Date(user.memberSince).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        {expiryDate
                          ? expiryDate.toLocaleDateString()
                          : "Unknown"}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${statusText.toLowerCase()}`}
                        >
                          {statusText}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleViewUser(user)}
                          className="view-button small"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <UserDetails
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
            >
              <ImageWithFallback
                src={selectedUser.photoUrl}
                alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                className="user-detail-photo"
                width="150" // Keep for layout hint
                transformations="w_150,h_150,c_fill,g_face,f_auto,q_auto" // Add transformations
              />
            </UserDetails>
          </div>
        </div>
      )}

      <SystemStatus />
    </div>
  );
}

export default AdminPanel;
