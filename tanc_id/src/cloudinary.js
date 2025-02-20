// filepath: /Users/kunselchodak/Developer/TANC_ID/tanc_id/src/cloudinary.js
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
  );
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
  return await res.json();
}
