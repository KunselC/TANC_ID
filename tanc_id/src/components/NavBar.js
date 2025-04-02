import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/NavBar.css";
import tancLogo from "../assets/images/tanc-logo.jpg";

function NavBar({ user, isAdmin }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("isAdmin"); // Clear admin status on logout
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src={tancLogo} alt="TANC Logo" className="navbar-logo" />
          <span>TANC ID System</span>
        </div>

        <button className="mobile-menu-button" onClick={toggleMenu}>
          ☰
        </button>

        <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <Link
            to="/"
            className="navbar-link"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>

          <Link
            to="/application"
            className="navbar-link"
            onClick={() => setMenuOpen(false)}
          >
            Apply for ID
          </Link>

          {user ? (
            <>
              {!isAdmin && (
                <Link
                  to="/my-id"
                  className="navbar-link"
                  onClick={() => setMenuOpen(false)}
                >
                  My ID
                </Link>
              )}
              <Link
                to="/profile"
                className="navbar-link"
                onClick={() => setMenuOpen(false)}
              >
                My Profile
                {isAdmin && <span className="admin-nav-badge">Admin</span>}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin-panel"
                  className="navbar-link navbar-link-admin"
                  onClick={() => setMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="navbar-button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="navbar-link"
                onClick={() => setMenuOpen(false)}
              >
                User Login
              </Link>
              <Link
                to="/admin-login"
                className="navbar-link navbar-link-admin"
                onClick={() => setMenuOpen(false)}
              >
                Admin Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
