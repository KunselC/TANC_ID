import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    // Perform admin login check
    // If successful, navigate to admin panel
    navigate("/admin-panel");
  };

  return (
    <div>
      <h2>Admin Login</h2>
      <input
        placeholder="Admin Username"
        value={adminUser}
        onChange={(e) => setAdminUser(e.target.value)}
      />
      <input
        placeholder="Admin Password"
        type="password"
        value={adminPass}
        onChange={(e) => setAdminPass(e.target.value)}
      />
      <button onClick={handleAdminLogin}>Log In</button>
    </div>
  );
}

export default AdminLogin;
