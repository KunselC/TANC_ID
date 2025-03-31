import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Application from "./pages/Application";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import IDView from "./pages/IDView";
import "./styles/App.css";
import "./styles/Footer.css";

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Check if the user is an admin
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        setIsAdmin(adminDoc.exists());
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="app">
      <Router>
        <NavBar user={user} />
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
                isAdmin ? <AdminPanel /> : <Navigate to="/admin-login" />
              }
            />
            <Route path="/my-id" element={<IDView />} />
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
    </div>
  );
}

export default App;
