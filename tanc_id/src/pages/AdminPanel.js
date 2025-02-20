import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
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

  const handleApprove = async (id) => {
    const applicationRef = doc(db, "applications", id);
    await updateDoc(applicationRef, { approved: true });
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, approved: true } : app))
    );
  };

  const handleDeny = async (id) => {
    const applicationRef = doc(db, "applications", id);
    await updateDoc(applicationRef, { approved: false });
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, approved: false } : app))
    );
  };

  const handleSelectApplication = (application) => {
    setSelectedApplication(application);
  };

  const filteredUsers = users.filter((user) =>
    user.email
      ? user.email.toLowerCase().includes(searchTerm.toLowerCase())
      : false
  );

  const filteredAdmins = admins.filter((admin) =>
    admin.email
      ? admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      : false
  );

  const filteredApplications = applications.filter((app) =>
    app.email
      ? app.email.toLowerCase().includes(searchTerm.toLowerCase())
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
            <li key={user.id}>{user.email}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Admins</h3>
        <ul>
          {filteredAdmins.map((admin) => (
            <li key={admin.id}>{admin.email}</li>
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
                {app.name} - {app.email}
                <button onClick={() => handleSelectApplication(app)}>
                  View Details
                </button>
                <button onClick={() => handleApprove(app.id)}>Approve</button>
                <button onClick={() => handleDeny(app.id)}>Deny</button>
              </li>
            ))}
        </ul>
      </div>
      {selectedApplication && (
        <div>
          <h3>Application Details</h3>
          <p>Name: {selectedApplication.name}</p>
          <p>Email: {selectedApplication.email}</p>
          <img src={selectedApplication.photoUrl} alt="User" width="200" />
          <button onClick={() => handleApprove(selectedApplication.id)}>
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
