import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordless, setIsPasswordless] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!isPasswordless && !password) {
      setError("Please enter a password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (isPasswordless) {
        const actionCodeSettings = {
          url: window.location.origin + "/login",
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem("emailForSignIn", email);
        alert("Check your email for the sign-in link.");
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Check if the user is an admin
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          await signOut(auth);
          setError("Please log in as a user to view your ID.");
        } else {
          navigate("/my-id");
        }
      }
    } catch (err) {
      console.error(err);
      let errorMessage;

      switch (err.code) {
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account exists with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        default:
          errorMessage = err.message;
      }

      setError(`Error logging in: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h2 className="login-title">Member Login</h2>
        <p className="login-subtitle">
          Access your TANC ID and membership information
        </p>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="login-form">
        <div className="login-group">
          <label htmlFor="email" className="login-label">
            Email:
          </label>
          <input
            id="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {!isPasswordless && (
          <div className="login-group">
            <label htmlFor="password" className="login-label">
              Password:
            </label>
            <input
              id="password"
              className="login-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        <div className="login-checkbox-group">
          <input
            type="checkbox"
            id="passwordless"
            className="login-checkbox"
            checked={isPasswordless}
            onChange={(e) => setIsPasswordless(e.target.checked)}
            disabled={isLoading}
          />
          <label htmlFor="passwordless">
            Use passwordless login (via email link)
          </label>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="login-button"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </div>

      <div className="login-footer">
        <p>
          Don't have an account?{" "}
          <Link to="/application">Apply for membership</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
