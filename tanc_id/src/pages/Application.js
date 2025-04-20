import React, { useState } from "react";
import { uploadToCloudinary } from "../cloudinary";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import imageCompression from "browser-image-compression"; // Import compression library
import "../styles/Form.css";

function Application() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    memberSince: "",
    homeAddress: "",
    greenBook: null,
    headShot: null,
    wantId: false,
    email: "",
    password: "",
  });

  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusType, setStatusType] = useState("");
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.memberSince)
      newErrors.memberSince = "Member since date is required";
    if (!formData.homeAddress)
      newErrors.homeAddress = "Home address is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email address is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.headShot) newErrors.headShot = "Head shot photo is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setStatus(
        "Please correct the errors marked in the form before submitting."
      );
      setStatusType("error");
      const firstErrorField = Object.keys(errors)[0];
      if (
        [
          "firstName",
          "lastName",
          "dateOfBirth",
          "gender",
          "memberSince",
          "homeAddress",
        ].includes(firstErrorField)
      ) {
        setStep(1);
      } else if (["email", "password"].includes(firstErrorField)) {
        setStep(2);
      } else if (["headShot"].includes(firstErrorField)) {
        setStep(3);
      }
      return;
    }

    setIsLoading(true);
    setStatus("Submitting application...");
    setStatusType("info");

    try {
      let greenBookUrl = "";
      if (formData.greenBook) {
        setStatus("Uploading Green Book photo...");
        const greenBookRes = await uploadToCloudinary(formData.greenBook);
        greenBookUrl = greenBookRes.secure_url;
      }

      let headShotUrl = "";
      if (formData.headShot) {
        setStatus("Uploading headshot photo...");
        const headShotRes = await uploadToCloudinary(formData.headShot);
        headShotUrl = headShotRes.secure_url;
      } else {
        throw new Error("Headshot photo is missing.");
      }

      setStatus("Creating user account...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      setStatus("Saving application data...");
      const applicationData = {
        userId: user.uid,
        firstName: formData.firstName,
        middleName: formData.middleName || "",
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        memberSince: formData.memberSince,
        emailAddress: formData.email,
        homeAddress: formData.homeAddress,
        greenBookUrl: greenBookUrl,
        headShotUrl: headShotUrl,
        wantId: formData.wantId,
        status: "pending",
        submittedAt: Timestamp.now(),
        type: "new",
      };

      await addDoc(collection(db, "applications"), applicationData);

      navigate("/confirmation", {
        state: {
          type: "application",
          name: formData.firstName,
          wantId: formData.wantId,
        },
      });
    } catch (err) {
      console.error("Application submission error:", err);
      let userMessage = "Error submitting application: ";
      if (err.code === "auth/email-already-in-use") {
        userMessage +=
          "This email address is already associated with an account. Please log in or use a different email.";
        setStep(2);
        setErrors((prev) => ({ ...prev, email: "Email already in use" }));
      } else if (err.message.includes("Cloudinary")) {
        userMessage +=
          "There was an issue uploading your photo(s). Please check the file format and size, then try again.";
        setStep(3);
      } else if (err.message.includes("Database connection failed")) {
        userMessage = err.message;
      } else {
        userMessage += err.message;
      }
      setStatus(userMessage);
      setStatusType("error");
      setIsLoading(false);
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.dateOfBirth)
        newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.memberSince)
        newErrors.memberSince = "Member since date is required";
      if (!formData.homeAddress)
        newErrors.homeAddress = "Home address is required";
    } else if (currentStep === 2) {
      if (!formData.email) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Email address is invalid";
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
    } else if (currentStep === 3) {
      if (!formData.headShot)
        newErrors.headShot = "Head shot photo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setStatus("");
      setStatusType("");
    } else {
      setStatus("Please complete the required fields for this step.");
      setStatusType("error");
    }
  };

  const handleFileChange = async (e) => {
    // Make async
    const { name, files } = e.target;
    if (files.length > 0) {
      let file = files[0];
      if (!["image/png", "image/jpeg"].includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Invalid file type. Please use PNG or JPG.",
        }));
        setFormData((prev) => ({ ...prev, [name]: null })); // Clear invalid file
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors((prev) => ({
          ...prev,
          [name]: "File size exceeds 5MB limit.",
        }));
        setFormData((prev) => ({ ...prev, [name]: null })); // Clear invalid file
        return;
      }

      // Compress image before setting state
      const options = {
        maxSizeMB: 1, // Max size in MB
        maxWidthOrHeight: 1024, // Max width or height
        useWebWorker: true,
      };

      try {
        setStatus(`Compressing ${name}...`);
        setStatusType("info");
        const compressedFile = await imageCompression(file, options);
        setFormData((prev) => ({ ...prev, [name]: compressedFile }));
        setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on success
        setStatus(""); // Clear compression status
      } catch (error) {
        console.error("Image compression error:", error);
        setErrors((prev) => ({
          ...prev,
          [name]: "Error compressing image. Please try again.",
        }));
        setFormData((prev) => ({ ...prev, [name]: null })); // Clear on error
        setStatus(""); // Clear compression status
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Membership Application</h2>

      <div className="form-progress">
        {[...Array(totalSteps)].map((_, i) => (
          <div
            key={i}
            className={`progress-step ${step > i ? "completed" : ""} ${
              step === i + 1 ? "active" : ""
            }`}
            onClick={() => i + 1 < step && setStep(i + 1)}
            style={{ cursor: i + 1 < step ? "pointer" : "default" }}
          >
            <div className="step-number">{i + 1}</div>
            <div className="step-label">
              {i === 0
                ? "Personal Info"
                : i === 1
                ? "Account Setup"
                : "Documents"}
            </div>
          </div>
        ))}
      </div>

      {status && (
        <div
          className={`form-status ${
            statusType === "success"
              ? "form-status-success"
              : statusType === "error"
              ? "form-status-error"
              : "form-status-info"
          }`}
        >
          {isLoading && statusType === "info" ? (
            <LoadingSpinner size="inline" />
          ) : null}{" "}
          {status}
        </div>
      )}

      {step === 1 && (
        <>
          <div className="form-row">
            <div className="form-column">
              <div className="form-group">
                <label className="form-label required">First Name</label>
                <input
                  className={`form-input ${errors.firstName ? "error" : ""}`}
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (errors.firstName)
                      setErrors({ ...errors, firstName: undefined });
                  }}
                />
                {errors.firstName && (
                  <p className="form-error">{errors.firstName}</p>
                )}
              </div>
            </div>
            <div className="form-column">
              <div className="form-group">
                <label className="form-label required">Last Name</label>
                <input
                  className={`form-input ${errors.lastName ? "error" : ""}`}
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (errors.lastName)
                      setErrors({ ...errors, lastName: undefined });
                  }}
                />
                {errors.lastName && (
                  <p className="form-error">{errors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Middle Name</label>
            <input
              className="form-input"
              value={formData.middleName}
              onChange={(e) =>
                setFormData({ ...formData, middleName: e.target.value })
              }
            />
          </div>

          <div className="form-row">
            <div className="form-column">
              <div className="form-group">
                <label className="form-label required">Date of Birth</label>
                <input
                  className={`form-input ${errors.dateOfBirth ? "error" : ""}`}
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => {
                    setFormData({ ...formData, dateOfBirth: e.target.value });
                    if (errors.dateOfBirth)
                      setErrors({ ...errors, dateOfBirth: undefined });
                  }}
                />
                {errors.dateOfBirth && (
                  <p className="form-error">{errors.dateOfBirth}</p>
                )}
              </div>
            </div>
            <div className="form-column">
              <div className="form-group">
                <label className="form-label required">Gender</label>
                <select
                  className={`form-select ${errors.gender ? "error" : ""}`}
                  value={formData.gender}
                  onChange={(e) => {
                    setFormData({ ...formData, gender: e.target.value });
                    if (errors.gender)
                      setErrors({ ...errors, gender: undefined });
                  }}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="form-error">{errors.gender}</p>}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Member Since</label>
            <input
              className={`form-input ${errors.memberSince ? "error" : ""}`}
              type="date"
              value={formData.memberSince}
              onChange={(e) => {
                setFormData({ ...formData, memberSince: e.target.value });
                if (errors.memberSince)
                  setErrors({ ...errors, memberSince: undefined });
              }}
            />
            <p className="form-hint">Date you first became a TANC member.</p>
            {errors.memberSince && (
              <p className="form-error">{errors.memberSince}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required">Home Address</label>
            <input
              className={`form-input ${errors.homeAddress ? "error" : ""}`}
              value={formData.homeAddress}
              onChange={(e) => {
                setFormData({ ...formData, homeAddress: e.target.value });
                if (errors.homeAddress)
                  setErrors({ ...errors, homeAddress: undefined });
              }}
            />
            {errors.homeAddress && (
              <p className="form-error">{errors.homeAddress}</p>
            )}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="form-group">
            <label className="form-label required">Email Address</label>
            <input
              className={`form-input ${errors.email ? "error" : ""}`}
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
            />
            <p className="form-hint">This will be your login email.</p>
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label required">Password</label>
            <input
              className={`form-input ${errors.password ? "error" : ""}`}
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password)
                  setErrors({ ...errors, password: undefined });
              }}
            />
            <p className="form-hint">Must be at least 6 characters.</p>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="form-group">
            <label className="form-label">Green Book Photo (Optional)</label>
            <input
              name="greenBook"
              className="form-file-input"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
            />
            <p className="form-hint">
              Optional. Upload a clear photo of your Green Book page. PNG or JPG
              only.
            </p>
            {errors.greenBook && (
              <p className="form-error">{errors.greenBook}</p>
            )}
            {formData.greenBook && (
              <p className="form-hint file-selected">
                Selected: {formData.greenBook.name}
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required">Head Shot Photo</label>
            <input
              name="headShot"
              className={`form-file-input ${errors.headShot ? "error" : ""}`}
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
            />
            <p className="form-hint">
              Required. Upload a clear, recent headshot (like a passport photo).
              PNG or JPG only.
            </p>
            {errors.headShot && <p className="form-error">{errors.headShot}</p>}
            {formData.headShot && (
              <p className="form-hint file-selected">
                Selected: {formData.headShot.name}
              </p>
            )}
          </div>

          <div className="form-group">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="want-id"
                className="form-checkbox"
                checked={formData.wantId}
                onChange={(e) =>
                  setFormData({ ...formData, wantId: e.target.checked })
                }
              />
              <label htmlFor="want-id">
                I want a physical ID card (+$5 fee applies upon approval)
              </label>
            </div>
          </div>

          <div className="form-info">
            <p>Membership Fee: $100 for five years (payable upon approval).</p>
            <p>
              Physical ID Card Fee: $5 (optional, payable upon approval if
              requested).
            </p>
            <p>
              You will be contacted regarding payment options after your
              application is approved.
            </p>
          </div>
        </>
      )}

      <div className="form-navigation">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="form-button form-prev"
            disabled={isLoading}
          >
            Previous
          </button>
        )}

        {step < totalSteps ? (
          <button
            type="button"
            onClick={goToNextStep}
            className="form-button form-next"
            disabled={isLoading}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="form-submit"
          >
            {isLoading ? "Submitting..." : "Submit Application"}
          </button>
        )}
      </div>
      <div className="form-footer-link">
        Already applied or have an account? <Link to="/login">Login Here</Link>
      </div>
    </div>
  );
}

export default Application;
