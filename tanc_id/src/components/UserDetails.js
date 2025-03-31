import React from "react";
import "../styles/UserDetails.css";

function UserDetails({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="user-details">
      <h3>User Details</h3>
      <table>
        <tbody>
          <tr>
            <td>First Name:</td>
            <td>{user.firstName}</td>
          </tr>
          <tr>
            <td>Middle Name:</td>
            <td>{user.middleName || "N/A"}</td>
          </tr>
          <tr>
            <td>Last Name:</td>
            <td>{user.lastName}</td>
          </tr>
          <tr>
            <td>Date of Birth:</td>
            <td>{user.dateOfBirth}</td>
          </tr>
          <tr>
            <td>Gender:</td>
            <td>{user.gender}</td>
          </tr>
          <tr>
            <td>Member Since:</td>
            <td>{user.memberSince}</td>
          </tr>
          <tr>
            <td>Email Address:</td>
            <td>{user.emailAddress}</td>
          </tr>
          <tr>
            <td>Home Address:</td>
            <td>{user.homeAddress}</td>
          </tr>
          {user.wantId !== undefined && (
            <tr>
              <td>Want ID:</td>
              <td>{user.wantId ? "Yes" : "No"}</td>
            </tr>
          )}
        </tbody>
      </table>
      {user.photoUrl && (
        <div className="user-photo">
          <img src={user.photoUrl} alt="User" width="200" />
        </div>
      )}
      {onClose && (
        <button onClick={onClose} className="close-btn">
          Close
        </button>
      )}
    </div>
  );
}

export default UserDetails;
