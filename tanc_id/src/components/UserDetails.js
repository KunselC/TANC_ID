import React from "react";

function UserDetails({ user, onClose }) {
  return (
    <div>
      <h3>User Details</h3>
      <p>First Name: {user.firstName}</p>
      <p>Middle Name: {user.middleName}</p>
      <p>Last Name: {user.lastName}</p>
      <p>Date of Birth: {user.dateOfBirth}</p>
      <p>Gender: {user.gender}</p>
      <p>Member Since: {user.memberSince}</p>
      <p>Email Address: {user.emailAddress}</p>
      <p>Home Address: {user.homeAddress}</p>
      <img src={user.photoUrl} alt="User" width="200" />
      <p>Want ID: {user.wantId ? "Yes" : "No"}</p>
    </div>
  );
}

export default UserDetails;
