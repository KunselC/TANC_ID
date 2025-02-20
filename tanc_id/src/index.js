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
  signInWithEmailLink(auth, email, window.location.href)
    .then((result) => {
      window.localStorage.removeItem("emailForSignIn");
      window.location.href = "/my-id";
    })
    .catch((error) => {
      console.error(error);
    });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
