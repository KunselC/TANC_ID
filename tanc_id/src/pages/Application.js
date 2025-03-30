import React, { useState } from "react";
import { uploadToCloudinary } from "../cloudinary";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

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
    headShot: null, // Use a more specific name for the photo field
    wantId: false,
    email: "",
    password: "",
  });

  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    setStatus("Submitting...");
    try {
      // Upload green book photo to Cloudinary
      let greenBookUrl = "";
      if (formData.greenBook) {
        const greenBookRes = await uploadToCloudinary(formData.greenBook);
        greenBookUrl = greenBookRes.secure_url;
        console.log("Green Book URL:", greenBookUrl);
      }

      // Upload headshot photo to Cloudinary
      let headShotUrl = "";
      if (formData.headShot) {
        const headShotRes = await uploadToCloudinary(formData.headShot);

        headShotUrl = headShotRes.secure_url;
        console.log("Head Shot URL:", headShotUrl);
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Save application data to Firestore
      await addDoc(collection(db, "applications"), {
        userId: user.uid,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        memberSince: formData.memberSince,
        emailAddress: formData.email,
        homeAddress: formData.homeAddress,
        greenBookUrl: greenBookUrl,
        headShotUrl: headShotUrl,
        wantId: formData.wantId,
        email: formData.email,
        approved: false,
      });

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
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
        />
      </div>
      <div>
        <label>Middle Name</label>
        <input
          value={formData.middleName}
          onChange={(e) =>
            setFormData({ ...formData, middleName: e.target.value })
          }
        />
      </div>
      <div>
        <label>Last Name</label>
        <input
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
        />
      </div>
      <div>
        <label>Date of Birth</label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) =>
            setFormData({ ...formData, dateOfBirth: e.target.value })
          }
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
          onChange={(e) =>
            setFormData({ ...formData, memberSince: e.target.value })
          }
        />
      </div>
      <div>
        <label>Email Address</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div>
        <label>Home Address</label>
        <input
          value={formData.homeAddress}
          onChange={(e) =>
            setFormData({ ...formData, homeAddress: e.target.value })
          }
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
        <label>Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
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
        <p>Please upload only PNG or JPG image files.</p>
      </div>
      <div>
        <label>Do you want an ID?</label>
        <input
          type="checkbox"
          checked={formData.wantId}
          onChange={(e) =>
            setFormData({ ...formData, wantId: e.target.checked })
          }
        />
      </div>
      <button onClick={handleSubmit}>Submit</button>
      {status && <p>{status}</p>}
      <p>
        The membership fee is $100 for five years, and an additional of $5 is
        charged for a physical ID Card.
      </p>
    </div>
  );
}

export default Application;
