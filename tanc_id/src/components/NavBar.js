import React from "react";
import { Link } from "react-router-dom";

function NavBar() {
  return (
    <nav style={{ display: "flex", gap: "1rem" }}>
      <Link to="/">Home</Link>
      <Link to="/application">Apply</Link>
      <Link to="/login">User Login</Link>
      <Link to="/admin-login">Admin Login</Link>
    </nav>
  );
}

export default NavBar;
