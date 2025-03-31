import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import {
  getAuth,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Handle email link sign-in
const auth = getAuth();
if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = window.localStorage.getItem("emailForSignIn");
  if (!email) {
    email = window.prompt("Please provide your email for confirmation");
  }

  if (email) {
    signInWithEmailLink(auth, email, window.location.href)
      .then((result) => {
        window.localStorage.removeItem("emailForSignIn");

        // Clean up the URL without reloading the page
        window.history.replaceState(null, null, window.location.pathname);

        // Navigate to ID page
        window.location.href = "/my-id";
      })
      .catch((error) => {
        console.error("Error signing in with email link:", error);
        alert("Error signing in with email link. Please try again.");
      });
  }
}

reportWebVitals();
