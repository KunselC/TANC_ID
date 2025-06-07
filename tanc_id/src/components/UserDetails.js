import React from "react";
import "../styles/UserDetails.css";

const formatDateDMY = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "N/A";

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
            <td>
              {user.dateOfBirth ? formatDateDMY(user.dateOfBirth) : "N/A"}
            </td>
          </tr>
          <tr>
            <td>Gender:</td>
            <td>{capitalize(user.gender)}</td>
          </tr>
          <tr>
            <td>Member Since:</td>
            <td>
              {user.memberSince ? formatDateDMY(user.memberSince) : "N/A"}
            </td>
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
      {/* Show old name/address/email/photo history if available */}
      {user.nameChangeHistory && user.nameChangeHistory.length > 0 && (
        <div className="user-history">
          <h4>Previous Names</h4>
          <ul>
            {user.nameChangeHistory.map((entry, idx) => (
              <li key={idx}>
                {entry.firstName} {entry.lastName} (changed at{" "}
                {formatDateDMY(
                  entry.changedAt?.toDate
                    ? entry.changedAt.toDate()
                    : entry.changedAt
                )}
                )
              </li>
            ))}
          </ul>
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
