import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/Login.css";

function AdminLogin() {
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (localStorage.getItem("isAdmin") === "true") {
      navigate("/admin-panel");
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!adminUser || !adminPass) {
      setError("Please enter both admin email and password.");
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
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDoc = await getDoc(adminDocRef);

      if (adminDoc.exists()) {
        // Store admin status in local storage to persist between refreshes
        localStorage.setItem("isAdmin", "true");
        // Navigate to admin panel
        navigate("/admin-panel");
      } else {
        // User is not an admin, sign out and show error
        await auth.signOut();
        setError("Access Denied: This account does not have admin privileges.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      let errorMessage = "An unexpected error occurred during login.";
      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage = "Invalid admin email or password.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many login attempts. Please try again later.";
          break;
        default:
          errorMessage =
            "Login failed. Please check your credentials or try again later.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Allow login on Enter key press in password field
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !isLoading) {
      handleLogin();
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
            type="email"
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
          onClick={handleLogin}
          disabled={isLoading}
          className="login-button"
        >
          {isLoading ? <LoadingSpinner size="small" /> : "Login"}
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;
