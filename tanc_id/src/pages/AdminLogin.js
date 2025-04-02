import React, { useState, useEffect } from "react";
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

  // Check if already authenticated as admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user && localStorage.getItem("isAdmin") === "true") {
        // Verify admin status from database
        try {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (adminDoc.exists()) {
            navigate("/admin-panel");
          }
        } catch (err) {
          console.error("Error verifying admin status:", err);
        }
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const handleAdminLogin = async () => {
    if (!adminUser || !adminPass) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting admin login with:", adminUser);

      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        adminUser,
        adminPass
      );
      const user = userCredential.user;
      console.log("User authenticated, checking admin status for:", user.uid);

      // Check if the user is an admin
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDoc = await getDoc(adminDocRef);

      console.log("Admin document exists:", adminDoc.exists());

      if (adminDoc.exists()) {
        console.log("User confirmed as admin, navigating to panel");
        // Store admin status in local storage to persist between refreshes
        localStorage.setItem("isAdmin", "true");
        // Navigate to admin panel
        navigate("/admin-panel");
      } else {
        // User is not an admin, sign out and show error
        console.log("User is not an admin, signing out");
        await auth.signOut();
        localStorage.removeItem("isAdmin");
        setError("You do not have access to the admin panel.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      // More descriptive error messages
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/user-not-found") {
        setError("No admin account exists with this email.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection.");
      } else {
        setError(`Login error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Support for Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAdminLogin();
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
            onKeyPress={handleKeyPress}
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
            onKeyPress={handleKeyPress}
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
