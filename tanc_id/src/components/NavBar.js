import React from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function NavBar({ user }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav style={{ display: "flex", gap: "1rem" }}>
      <Link to="/">Home</Link>
      <Link to="/application">Apply</Link>
      {user ? (
        <>
          <Link to="/my-id">My ID</Link>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <Link to="/login">User Login</Link>
      )}
      <Link to="/admin-login">Admin Login</Link>
    </nav>
  );
}

export default NavBar;
