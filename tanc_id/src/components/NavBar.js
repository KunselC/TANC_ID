import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/NavBar.css";

function NavBar({ user }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img
            src="https://tanc.org/wp-content/uploads/2023/09/tanc-logo-1.png"
            alt="TANC Logo"
            className="navbar-logo"
          />
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
              <Link
                to="/my-id"
                className="navbar-link"
                onClick={() => setMenuOpen(false)}
              >
                My ID
              </Link>
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
            <Link
              to="/login"
              className="navbar-link"
              onClick={() => setMenuOpen(false)}
            >
              User Login
            </Link>
          )}

          <Link
            to="/admin-login"
            className="navbar-link"
            onClick={() => setMenuOpen(false)}
          >
            Admin Login
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
