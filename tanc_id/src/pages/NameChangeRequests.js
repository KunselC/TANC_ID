import React, { useEffect, useState, useMemo, useCallback } from "react"; // Added useCallback
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import UserDetails from "../components/UserDetails";
import LoadingSpinner from "../components/LoadingSpinner";

function NameChangeRequests({ searchTerm = "", sortBy = "requestedAt_desc" }) {
  const [allRequests, setAllRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setActionStatus("");
    try {
      let q = collection(db, "nameChangeRequests");
      // Determine the field and direction for orderBy
      let orderByField = "requestedAt"; // Default
      let orderByDirection = "desc"; // Default

      if (sortBy) {
        if (sortBy.startsWith("requestedAt")) {
          orderByField = "requestedAt";
          orderByDirection = sortBy.endsWith("_asc") ? "asc" : "desc";
        } else if (sortBy.startsWith("oldName")) {
          orderByField = "oldLastName"; // Assuming sort by last name primarily
          orderByDirection = sortBy.endsWith("_asc") ? "asc" : "desc";
        } else if (sortBy.startsWith("newName")) {
          orderByField = "newLastName"; // Assuming sort by last name primarily
          orderByDirection = sortBy.endsWith("_asc") ? "asc" : "desc";
        }
      }

      q = query(q, orderBy(orderByField, orderByDirection));

      const snapshot = await getDocs(q);
      const fetchedRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllRequests(fetchedRequests);
    } catch (error) {
      console.error("Error fetching name change requests:", error);
      setActionStatus("Error fetching requests. Please try again.");
    }
    setIsLoading(false);
  }, [sortBy]); // Added sortBy to useCallback dependencies

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]); // Now correctly depends on the memoized fetchRequests

  // Optimistic UI update: remove from local state immediately
  const handleApprove = async (request) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionStatus("Approving...");

    // Optimistically update UI
    setAllRequests((prevRequests) =>
      prevRequests.filter((r) => r.id !== request.id)
    );
    setSelectedRequest(null);

    try {
      const userRef = doc(db, "users", request.userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Rollback optimistic update if user not found
        fetchRequests(); // or add the request back to allRequests
        throw new Error("User not found. Cannot approve name change.");
      }

      const userData = userSnap.data();
      const currentNameHistory = userData.nameChangeHistory || [];
      const newNameEntry = {
        oldFirstName: request.oldFirstName,
        oldMiddleName: request.oldMiddleName || "",
        oldLastName: request.oldLastName,
        newFirstName: request.newFirstName,
        newMiddleName: request.newMiddleName || "",
        newLastName: request.newLastName,
        changedAt: Timestamp.now(),
        reason: request.reason || "Admin approved name change.", // Use reason from request
      };

      await updateDoc(userRef, {
        firstName: request.newFirstName,
        middleName:
          request.newMiddleName !== undefined
            ? request.newMiddleName
            : userData.middleName,
        lastName: request.newLastName,
        nameChangeHistory: [...currentNameHistory, newNameEntry],
        updatedAt: Timestamp.now(),
      });

      await updateDoc(doc(db, "nameChangeRequests", request.id), {
        status: "approved",
        processedAt: Timestamp.now(),
      });

      setActionStatus("Name change approved successfully.");
      // No need to call fetchRequests() here due to optimistic update,
      // unless there's a need to ensure data consistency from server.
    } catch (error) {
      console.error("Error approving name change:", error);
      setActionStatus(`Error approving: ${error.message}`);
      // Rollback optimistic update on error
      fetchRequests(); // Re-fetch to get the correct state
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optimistic UI update: remove from local state immediately
  const handleDeny = async (request) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionStatus("Denying...");

    // Optimistically update UI
    setAllRequests((prevRequests) =>
      prevRequests.filter((r) => r.id !== request.id)
    );
    setSelectedRequest(null);

    try {
      await updateDoc(doc(db, "nameChangeRequests", request.id), {
        status: "denied",
        processedAt: Timestamp.now(),
      });

      setActionStatus("Name change request denied.");
      // No need to call fetchRequests() here due to optimistic update
    } catch (error) {
      console.error("Error denying name change:", error);
      setActionStatus(`Error denying: ${error.message}`);
      // Rollback optimistic update on error
      fetchRequests(); // Re-fetch to get the correct state
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAndSortedRequests = useMemo(() => {
    let processedRequests = allRequests.filter(
      (req) =>
        !req.status || (req.status !== "approved" && req.status !== "denied")
    );

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedRequests = processedRequests.filter((req) => {
        const oldFullName = `${req.oldFirstName || ""} ${
          req.oldMiddleName || ""
        } ${req.oldLastName || ""}`.toLowerCase();
        const newFullName = `${req.newFirstName || ""} ${
          req.newMiddleName || ""
        } ${req.newLastName || ""}`.toLowerCase();
        return (
          req.userId?.toLowerCase().includes(lowerSearchTerm) ||
          oldFullName.includes(lowerSearchTerm) ||
          newFullName.includes(lowerSearchTerm) ||
          req.reason?.toLowerCase().includes(lowerSearchTerm)
        );
      });
    }
    // Sorting is primarily handled by Firestore query.
    // Client-side sorting can be added here if more complex sorting (e.g., multi-field) is needed
    // or if Firestore sorting isn't sufficient for all cases (e.g., sorting by full name string).
    // For now, we rely on the `sortBy` prop to influence the Firestore query.

    // Example client-side sort if needed (adjust based on `sortBy` prop values):
    // if (sortBy === 'oldName_asc') {
    //   processedRequests.sort((a, b) =>
    //     `${a.oldLastName} ${a.oldFirstName}`.localeCompare(`${b.oldLastName} ${b.oldFirstName}`)
    //   );
    // } else if (sortBy === 'oldName_desc') {
    //   processedRequests.sort((a, b) =>
    //     `${b.oldLastName} ${b.oldFirstName}`.localeCompare(`${a.oldLastName} ${a.oldFirstName}`)
    //   );
    // } // etc. for newName

    return processedRequests;
  }, [allRequests, searchTerm]);

  if (isLoading)
    return <LoadingSpinner message="Loading name change requests..." />;

  return (
    <div className="name-change-requests admin-panel-section">
      <h3>Name Change Requests</h3>
      {actionStatus && (
        <div
          className={`action-status ${
            actionStatus.startsWith("Error")
              ? "error-message"
              : "success-message"
          }`}
        >
          {actionStatus}
        </div>
      )}
      {selectedRequest ? (
        <div className="user-details-view">
          <UserDetails
            userId={selectedRequest.userId}
            initialData={selectedRequest} // Pass request data for display
            context="nameChangeRequest"
          />
          <div className="request-details">
            <h4>Requested Change:</h4>
            <p>
              <strong>Old Name:</strong> {selectedRequest.oldFirstName}{" "}
              {selectedRequest.oldMiddleName || ""}{" "}
              {selectedRequest.oldLastName}
            </p>
            <p>
              <strong>New Name:</strong> {selectedRequest.newFirstName}{" "}
              {selectedRequest.newMiddleName || ""}{" "}
              {selectedRequest.newLastName}
            </p>
            <p>
              <strong>Reason for Change:</strong>{" "}
              {selectedRequest.reason || "N/A"}
            </p>
            <p>
              <strong>Requested At:</strong>{" "}
              {selectedRequest.requestedAt?.toDate().toLocaleString()}
            </p>
          </div>
          <div className="action-buttons">
            <button
              onClick={() => handleApprove(selectedRequest)}
              disabled={isSubmitting}
              className="approve-button"
            >
              {isSubmitting && selectedRequest
                ? "Approving..."
                : "Approve Name Change"}
            </button>
            <button
              onClick={() => handleDeny(selectedRequest)}
              disabled={isSubmitting}
              className="deny-button"
            >
              {isSubmitting && selectedRequest
                ? "Denying..."
                : "Deny Name Change"}
            </button>
            <button
              onClick={() => {
                setSelectedRequest(null);
                setActionStatus("");
              }}
              disabled={isSubmitting}
              className="back-button"
            >
              Back to List
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          {filteredAndSortedRequests.length === 0 && !isLoading ? (
            // Use filteredAndSortedRequests
            <p>
              No pending name change requests
              {searchTerm ? " matching your criteria" : ""}.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Current Name (from request)</th>
                  <th>Requested New Name</th>
                  <th>Date Requested</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRequests.map((req) => (
                  // Use filteredAndSortedRequests
                  <tr key={req.id}>
                    <td>{req.userId}</td>
                    <td>
                      {req.oldFirstName} {req.oldMiddleName || ""}{" "}
                      {req.oldLastName}
                    </td>
                    <td>
                      {req.newFirstName} {req.newMiddleName || ""}{" "}
                      {req.newLastName}
                    </td>
                    <td>{req.requestedAt?.toDate().toLocaleDateString()}</td>
                    {/* Ensure status display is robust */}
                    <td
                      className={`status-${
                        req.status ? req.status.toLowerCase() : "pending"
                      }`}
                    >
                      {req.status || "pending"}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionStatus("");
                        }}
                        className="view-button"
                        disabled={isSubmitting}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default NameChangeRequests;
