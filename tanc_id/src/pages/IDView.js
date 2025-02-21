import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import UserDetails from "../components/UserDetails";

function IDView() {
  const [userData, setUserData] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setStatus("No user is logged in.");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        setStatus("You need to wait for approval before seeing your ID.");
        return;
      }

      const userData = userDoc.data();
      if (userData.isAdmin) {
        setStatus("Please log in as a user to view your ID.");
        return;
      }

      setUserData(userData);
      setStatus("");
    };

    fetchUserData();
  }, []);

  if (status) {
    return <p>{status}</p>;
  }

  return (
    <div>
      <h2>Your ID</h2>
      <UserDetails user={userData} onClose={() => navigate("/")} />
    </div>
  );
}

export default IDView;
