import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

function AdminLogin() {
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAdminLogin = async () => {
    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        adminUser,
        adminPass
      );
      const user = userCredential.user;

      // Check if the user is an admin
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      if (adminDoc.exists()) {
        // User is an admin, navigate to admin panel
        navigate("/admin-panel");
      } else {
        // User is not an admin, sign out and show error
        await auth.signOut();
        setError("You do not have access to the admin panel.");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid admin credentials.");
    }
  };

  return (
    <div>
      <h2>Admin Login</h2>
      <input
        placeholder="Admin Username"
        value={adminUser}
        onChange={(e) => setAdminUser(e.target.value)}
      />
      <input
        placeholder="Admin Password"
        type="password"
        value={adminPass}
        onChange={(e) => setAdminPass(e.target.value)}
      />
      <button onClick={handleAdminLogin}>Log In</button>
      {error && <p>{error}</p>}
    </div>
  );
}

export default AdminLogin;
