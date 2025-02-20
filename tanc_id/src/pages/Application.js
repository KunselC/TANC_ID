import React, { useState } from "react";
import { uploadToCloudinary } from "../cloudinary"; // Adjusted path

function Application() {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    memberSince: "",
    emailAddress: "",
    homeAddress: "",
    greenBook: null,
    headShot: null,
    wantId: false,
  });

  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    setStatus("Submitting...");
    try {
      if (formData.greenBook) {
        const greenBookRes = await uploadToCloudinary(formData.greenBook);
        console.log("Green Book URL:", greenBookRes.secure_url);
      }
      if (formData.headShot) {
        const headShotRes = await uploadToCloudinary(formData.headShot);
        console.log("Head Shot URL:", headShotRes.secure_url);
      }
      setStatus("Application submitted!");
    } catch (err) {
      console.error(err);
      setStatus("Error submitting application.");
    }
  };

  return (
    <div>
      <h2>Application</h2>
      <div>
        <label>First Name</label>
        <input
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        />
      </div>
      <div>
        <label>Middle Name</label>
        <input
          value={formData.middleName}
          onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
        />
      </div>
      <div>
        <label>Last Name</label>
        <input
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        />
      </div>
      <div>
        <label>Date of Birth</label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
        />
      </div>
      <div>
        <label>Gender</label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
        >
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label>Member Since</label>
        <input
          type="date"
          value={formData.memberSince}
          onChange={(e) => setFormData({ ...formData, memberSince: e.target.value })}
        />
      </div>
      <div>
        <label>Email Address</label>
        <input
          type="email"
          value={formData.emailAddress}
          onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
        />
      </div>
      <div>
        <label>Home Address</label>
        <input
          value={formData.homeAddress}
          onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
        />
      </div>
      <div>
        <label>Green Book Photo</label>
        <input
          type="file"
          onChange={(e) =>
            setFormData({ ...formData, greenBook: e.target.files[0] })
          }
        />
      </div>
      <div>
        <label>Head Shot Photo</label>
        <input
          type="file"
          onChange={(e) =>
            setFormData({ ...formData, headShot: e.target.files[0] })
          }
        />
      </div>
      <div>
        <label>Do you want an ID?</label>
        <input
          type="checkbox"
          checked={formData.wantId}
          onChange={(e) => setFormData({ ...formData, wantId: e.target.checked })}
        />
      </div>
      <button onClick={handleSubmit}>Submit</button>
      {status && <p>{status}</p>}
    </div>
  );
}

export default Application;

