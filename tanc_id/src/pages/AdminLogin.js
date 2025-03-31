import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "../styles/Login.css";

function AdminLogin() {
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async () => {
    if (!adminUser || !adminPass) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2 className="login-title">Admin Login</h2>
        <p className="login-subtitle">System administration access</p>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="login-form">
        <div className="login-group">
          <label htmlFor="admin-email" className="login-label">
            Email:
          </label>
          <input
            id="admin-email"
            className="login-input"
            placeholder="Admin Email"
            value={adminUser}
            onChange={(e) => setAdminUser(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="login-group">
          <label htmlFor="admin-password" className="login-label">
            Password:
          </label>
          <input
            id="admin-password"
            className="login-input"
            placeholder="Admin Password"
            type="password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleAdminLogin}
          disabled={isLoading}
          className="login-button"
        >
          {isLoading ? "Logging in..." : "Login as Admin"}
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;
