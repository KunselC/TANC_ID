import React, { useState } from "react";
import { uploadToCloudinary } from "../cloudinary";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

function Application() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    photo: null,
  });
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    setStatus("Submitting...");
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Upload photo to Cloudinary
      let photoUrl = "";
      if (formData.photo) {
        const photoRes = await uploadToCloudinary(formData.photo);
        photoUrl = photoRes.secure_url;
      }

      // Save application data to Firestore
      await addDoc(collection(db, "applications"), {
        userId: user.uid,
        name: formData.name,
        email: formData.email,
        photoUrl: photoUrl,
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
        <label>Name</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
        <label>Photo</label>
        <input
          type="file"
          onChange={(e) =>
            setFormData({ ...formData, photo: e.target.files[0] })
          }
        />
      </div>
      <button onClick={handleSubmit}>Submit</button>
      {status && <p>{status}</p>}
    </div>
  );
}

export default Application;
