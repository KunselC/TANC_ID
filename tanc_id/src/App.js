import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Application from "./pages/Application";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import IDView from "./pages/IDView";
import Profile from "./pages/Profile";
import Confirmation from "./pages/Confirmation";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/App.css";
import "./styles/Footer.css";

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  const WARNING_BEFORE = 5 * 60 * 1000; // Show warning 5 minutes before timeout

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Force token refresh if needed
          await getIdToken(user, true);
          setUser(user);

          // Check if the user is an admin
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          const adminStatus = adminDoc.exists();
          setIsAdmin(adminStatus);

          // Store admin status in localStorage for persistence
          if (adminStatus) {
            localStorage.setItem("isAdmin", "true");
          } else {
            localStorage.removeItem("isAdmin");
          }
        } catch (error) {
          console.error("Authentication error:", error);
          setUser(null);
          setIsAdmin(false);
          localStorage.removeItem("isAdmin");
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        localStorage.removeItem("isAdmin");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Session timeout effect
  useEffect(() => {
    if (user) {
      // Set session timeout
      const timeoutId = setTimeout(() => {
        setShowTimeoutWarning(true);
      }, SESSION_DURATION - WARNING_BEFORE);

      setSessionTimeout(timeoutId);

      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        setSessionTimeout(null);
      }
      setShowTimeoutWarning(false);
    }
  }, [user]);

  // Function to extend session
  const extendSession = async () => {
    if (user) {
      try {
        // Force token refresh
        await getIdToken(user, true);

        // Clear existing timeout
        if (sessionTimeout) {
          clearTimeout(sessionTimeout);
        }

        // Set new timeout
        const newTimeoutId = setTimeout(() => {
          setShowTimeoutWarning(true);
        }, SESSION_DURATION - WARNING_BEFORE);

        setSessionTimeout(newTimeoutId);
        setShowTimeoutWarning(false);
      } catch (error) {
        console.error("Error extending session:", error);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Initializing TANC ID System..." />;
  }

  // Check both state and localStorage for admin status
  const hasAdminAccess = isAdmin || localStorage.getItem("isAdmin") === "true";

  return (
    <div className="app">
      <ErrorBoundary>
        <Router>
          <NavBar user={user} isAdmin={hasAdminAccess} />
          <main className="main-content">
            <div className="tibetan-border"></div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/application" element={<Application />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route
                path="/admin-panel"
                element={
                  hasAdminAccess ? (
                    <AdminPanel />
                  ) : (
                    <Navigate to="/admin-login" />
                  )
                }
              />
              <Route
                path="/my-id"
                element={user ? <IDView /> : <Navigate to="/login" />}
              />
              <Route
                path="/profile"
                element={user ? <Profile /> : <Navigate to="/login" />}
              />
              <Route path="/confirmation" element={<Confirmation />} />
            </Routes>
          </main>
          <footer className="footer">
            <div className="tibetan-pattern"></div>
            <div className="footer-content">
              <p>
                © {new Date().getFullYear()} Tibetan Association of Northern
                California
              </p>
            </div>
          </footer>
        </Router>
      </ErrorBoundary>

      {showTimeoutWarning && (
        <div className="session-warning">
          <div className="session-warning-content">
            <h3>Your session is about to expire</h3>
            <p>You will be logged out in 5 minutes due to inactivity.</p>
            <button onClick={extendSession} className="session-extend-button">
              Keep Me Signed In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
