import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordless, setIsPasswordless] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      if (isPasswordless) {
        const actionCodeSettings = {
          url: "http://localhost:3000/login", // Update with your app's URL
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem("emailForSignIn", email);
        alert("Check your email for the sign-in link.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/my-id");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>User Login</h2>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {!isPasswordless && (
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      )}
      <button onClick={handleLogin}>Log In</button>
      <p>
        No account yet? <Link to="/application">Apply Here</Link>
      </p>
      <p>
        <input
          type="checkbox"
          checked={isPasswordless}
          onChange={(e) => setIsPasswordless(e.target.checked)}
        />{" "}
        Use passwordless login
      </p>
    </div>
  );
}

export default Login;
