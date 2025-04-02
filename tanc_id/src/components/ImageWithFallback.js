import React, { useState } from "react";
import "../styles/ImageFallback.css";

function ImageWithFallback({ src, alt, className, width }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="image-container">
      {isLoading && <div className="image-loading">Loading...</div>}
      {hasError ? (
        <div className="image-error">Image failed to load</div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          width={width}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          style={{ display: isLoading ? "none" : "block" }}
        />
      )}
    </div>
  );
}

export default ImageWithFallback;
