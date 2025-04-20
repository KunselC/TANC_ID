import React, { useState, useEffect } from "react";
import "../styles/ImageFallback.css";
import tancLogo from "../assets/images/tanc-logo.jpg"; // Default fallback

// Function to construct Cloudinary URL with transformations
const getCloudinaryTransformedUrl = (src, transformations) => {
  if (!src || !src.includes("res.cloudinary.com") || !transformations) {
    return src; // Return original if not Cloudinary or no transformations needed
  }
  // Example src: https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/public_id.jpg
  // Target:    https://res.cloudinary.com/cloud_name/image/upload/{transformations}/v12345/folder/public_id.jpg
  const parts = src.split("/upload/");
  if (parts.length === 2) {
    return `${parts[0]}/upload/${transformations}/${parts[1]}`;
  }
  return src; // Return original if format is unexpected
};

function ImageWithFallback({
  src,
  alt,
  fallbackSrc = tancLogo,
  className = "",
  width, // Keep width/height for layout, but transformations control actual size
  height,
  transformations = "f_auto,q_auto", // Default transformations (auto format, auto quality)
  ...props // Pass other img props like style, loading="lazy"
}) {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    // Apply transformations if src is a Cloudinary URL
    const transformedSrc = getCloudinaryTransformedUrl(src, transformations);
    setCurrentSrc(transformedSrc);
  }, [src, transformations]); // Re-run if src or transformations change

  const handleError = () => {
    if (!error) {
      setError(true);
      setCurrentSrc(fallbackSrc); // Use the provided or default fallback
    }
  };

  // Use currentSrc (which might be transformed or fallback)
  const displaySrc = error ? fallbackSrc : currentSrc || fallbackSrc; // Show fallback immediately if src is initially null/empty

  // Add loading="lazy" by default if not overridden in props
  const imgProps = { loading: "lazy", ...props };

  return (
    <img
      src={displaySrc}
      alt={alt}
      onError={handleError}
      className={`image-fallback ${className} ${error ? "has-error" : ""}`}
      width={width} // Set width/height attributes for layout reservation
      height={height}
      {...imgProps} // Spread remaining props
    />
  );
}

export default ImageWithFallback;
