import React, { useState } from "react";
import { uploadToCloudinary } from "../cloudinary"; // Adjusted path

function Application() {
  const [formData, setFormData] = useState({
    name: "",
    photo: null,
  });
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    setStatus("Submitting...");
    try {
      if (formData.photo) {
        const photoRes = await uploadToCloudinary(formData.photo);
        console.log("Photo URL:", photoRes.secure_url);
        // Save form data + photo URL to Firebase or your DB
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
        <label>Name</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
