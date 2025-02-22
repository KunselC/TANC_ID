import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Welcome</h1>
      <Link to="/application">Apply</Link>
      <br />
      <Link to="/login">User Login</Link>
      <br />
      <Link to="/admin-login">Admin Login</Link>
      <br />
      <Link to="/admin-panel">Admin Panel</Link>
      <br />
      <Link to="/my-id">My ID</Link>
    </div>
  );
}

export default Home;
