import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // If user is approved, navigate to /my-id
      // Otherwise navigate to a "not-approved" page
      navigate("/my-id");
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
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Log In</button>
      <p>
        No account yet? <Link to="/application">Apply Here</Link>
      </p>
    </div>
  );
}

export default Login;
