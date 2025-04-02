export async function uploadToCloudinary(file) {
  // Create a new FormData instance
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
  );

  // Add transformation parameters for optimization
  formData.append("quality", "auto");
  formData.append("fetch_format", "auto");

  // Compression for profile photos
  if (file.name?.includes("headShot") || file.name?.includes("profile")) {
    formData.append("width", "600"); // Resize to reasonable profile size
    formData.append("crop", "limit");
  } else {
    // General document optimization
    formData.append("width", "1200"); // Max width for documents
    formData.append("crop", "limit");
  }

  console.log(
    "Cloudinary upload - Using preset:",
    process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
  );
  console.log(
    "Cloudinary upload - Using cloud name:",
    process.env.REACT_APP_CLOUDINARY_CLOUD_NAME
  );

  // Validate file before upload
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File is too large. Maximum size is 5MB.");
  }

  const validTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPG and PNG are allowed.");
  }

  try {
    const uploadURL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`;
    console.log("Cloudinary upload - Attempting to upload to:", uploadURL);

    const res = await fetch(uploadURL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || "Unknown upload error";
      } catch (e) {
        errorMessage = `HTTP error ${res.status}: ${errorText}`;
      }
      throw new Error(`Upload failed: ${errorMessage}`);
    }

    const responseData = await res.json();
    return responseData;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image: " + error.message);
  }
}

// Helper function to resize images before uploading
export async function optimizeImageBeforeUpload(file, maxWidth = 1200) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // Only resize if the image is larger than maxWidth
        if (img.width <= maxWidth) {
          resolve(file);
          return;
        }

        const canvas = document.createElement("canvas");
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            // Create a new file with same name but optimized
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: new Date().getTime(),
            });

            resolve(optimizedFile);
          },
          file.type,
          0.8
        ); // 0.8 quality gives good compression while maintaining quality
      };
    };
  });
}
