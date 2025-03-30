import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import UserDetails from "../components/UserDetails";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    };

    const fetchAdmins = async () => {
      const querySnapshot = await getDocs(collection(db, "admins"));
      const adminsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAdmins(adminsList);
    };

    const fetchApplications = async () => {
      const querySnapshot = await getDocs(collection(db, "applications"));
      const applicationsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setApplications(applicationsList);
    };

    fetchUsers();
    fetchAdmins();
    fetchApplications();
  }, []);

  const handleApprove = async (application) => {
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
    setApplications((prev) => prev.filter((app) => app.id !== application.id));
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
    setSelectedApplication(null); // Remove details view after approve/deny
  };

  const handleDeny = async (application) => {
    const applicationRef = doc(db, "applications", application.id);
    const userRef = doc(db, "users", application.userId);

    // Delete user from authentication
    const user = auth.currentUser;
    if (user) {
      await deleteUser(user);
    }

    // Remove application from applications collection
    await deleteDoc(applicationRef);

    // Remove user from users collection
    await deleteDoc(userRef);

    // Remove images from Cloudinary
    if (application.headShotUrl) {
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
    }

    setApplications((prev) => prev.filter((app) => app.id !== application.id));
    setSelectedApplication(null); // Remove details view after approve/deny
  };

  const handleRemoveUser = async (user) => {
    try {
      // Delete user from authentication
      const userAuth = await auth.getUser(user.id);
      if (userAuth) {
        await deleteUser(userAuth);
      }

      // Remove user from users collection
      await deleteDoc(doc(db, "users", user.id));

      // Remove images from Cloudinary
      if (user.photoUrl) {
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
      }

      // Update state
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSelectedUser(null); // Remove details view after removal
    } catch (err) {
      console.error(err);
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

  const filteredUsers = users.filter((user) =>
    user.emailAddress
      ? user.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
      : false
  );

  const filteredAdmins = admins.filter((admin) =>
    admin.emailAddress
      ? admin.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
      : false
  );

  const filteredApplications = applications.filter((app) =>
    app.emailAddress
      ? app.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
      : false
  );

  return (
    <div>
      <h2>Admin Panel</h2>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div>
        <h3>Users</h3>
        <ul>
          {filteredUsers.map((user) => (
            <li key={user.id}>
              <button onClick={() => handleSelectUser(user)}>
                {user.firstName} {user.lastName}
              </button>
              {selectedUser && selectedUser.id === user.id && (
                <>
                  <UserDetails
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                  />
                  <button onClick={() => handleRemoveUser(selectedUser)}>
                    Remove User
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Admins</h3>
        <p>
          Note: You can search Firebase Authentication for a specific UID to
          find the associated email.
        </p>
        <ul>
          {filteredAdmins.map((admin) => (
            <li key={admin.id}>
              {admin.emailAddress} (UID: {admin.id})
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Pending Applications</h3>
        <ul>
          {filteredApplications
            .filter((app) => !app.approved)
            .map((app) => (
              <li key={app.id}>
                {app.firstName} {app.lastName} - {app.emailAddress}
                <button onClick={() => handleSelectApplication(app)}>
                  View Details
                </button>
                {!selectedApplication && (
                  <>
                    <button onClick={() => handleApprove(app)}>Approve</button>
                    <button onClick={() => handleDeny(app)}>Deny</button>
                  </>
                )}
              </li>
            ))}
        </ul>
      </div>
      {selectedApplication && (
        <div>
          <h3>Application Details</h3>
          <p>First Name: {selectedApplication.firstName}</p>
          <p>Middle Name: {selectedApplication.middleName}</p>
          <p>Last Name: {selectedApplication.lastName}</p>
          <p>Date of Birth: {selectedApplication.dateOfBirth}</p>
          <p>Gender: {selectedApplication.gender}</p>
          <p>Member Since: {selectedApplication.memberSince}</p>
          <p>Email Address: {selectedApplication.emailAddress}</p>
          <p>Home Address: {selectedApplication.homeAddress}</p>
          <img src={selectedApplication.greenBookUrl} alt="User" width="200" />
          <p>Want ID: {selectedApplication.wantId ? "Yes" : "No"}</p>
          <img src={selectedApplication.headShotUrl} alt="User" width="200" />
          <button onClick={() => handleApprove(selectedApplication)}>
            Approve
          </button>
          <button onClick={() => handleDeny(selectedApplication.id)}>
            Deny
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
