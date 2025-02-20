import React from "react";

function IDView() {
  // Placeholder for user's name and photo
  const userName = "User's Full Name"; // Replace with actual user data
  const userPhotoUrl = "https://via.placeholder.com/150"; // Replace with actual Cloudinary URL

  return (
    <div>
      <h2>Your ID</h2>
      <p>Name: {userName}</p>
      <img src={userPhotoUrl} alt="User" />
    </div>
  );
}

export default IDView;
