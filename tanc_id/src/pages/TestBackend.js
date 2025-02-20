import React, { useState } from "react";
import { uploadToCloudinary } from "../cloudinary";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function TestBackend({ user }) {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    setStatus("Uploading...");
    try {
      if (file) {
        const response = await uploadToCloudinary(file);
        setImageUrl(response.secure_url);
        setStatus("Upload successful!");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setStatus("Error uploading image.");
    }
  };

  const handleSave = async () => {
    if (!user) {
      setStatus("User not authenticated.");
      return;
    }

    setStatus("Saving to Firestore...");
    try {
      await addDoc(collection(db, "testCollection"), {
        userId: user.uid,
        name: name,
        imageUrl: imageUrl,
      });
      setStatus("Data saved to Firestore!");
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      setStatus("Error saving to Firestore.");
    }
  };

  return (
    <div>
      <h2>Test Backend</h2>
      <div>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label>Photo:</label>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      </div>
      <button onClick={handleUpload}>Upload to Cloudinary</button>
      {imageUrl && (
        <div>
          <h3>Uploaded Image:</h3>
          <img src={imageUrl} alt="Uploaded" width="200" />
        </div>
      )}
      <button onClick={handleSave}>Save to Firestore</button>
      {status && <p>{status}</p>}
    </div>
  );
}

export default TestBackend;
