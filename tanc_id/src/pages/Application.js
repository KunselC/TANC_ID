import React, { useState } from "react";
import { uploadToCloudinary } from "../cloudinary";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
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
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.headShot) newErrors.headShot = "Head shot photo is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setStatus("Please correct the errors in the form.");
      setStatusType("error");
      return;
    }

    setIsLoading(true);
    setStatus("Submitting application...");
    setStatusType("info");

    try {
      // First check if we can access Firebase
      console.log("Testing Firebase connection...");
      try {
        const testCollection = collection(db, "applications");
        console.log("Firebase connection successful");
      } catch (firebaseErr) {
        console.error("Firebase connection test failed:", firebaseErr);
        throw new Error("Database connection failed. Please try again later.");
      }

      // Upload green book photo to Cloudinary
      let greenBookUrl = "";
      if (formData.greenBook) {
        setStatus("Uploading Green Book photo...");
        console.log("Starting Green Book upload");
        const greenBookRes = await uploadToCloudinary(formData.greenBook);
        greenBookUrl = greenBookRes.secure_url;
        console.log("Green Book uploaded successfully:", greenBookUrl);
      }

      // Upload headshot photo to Cloudinary
      let headShotUrl = "";
      if (formData.headShot) {
        setStatus("Uploading headshot photo...");
        console.log("Starting headshot upload");
        const headShotRes = await uploadToCloudinary(formData.headShot);
        headShotUrl = headShotRes.secure_url;
        console.log("Headshot uploaded successfully:", headShotUrl);
      }

      // Create user account
      setStatus("Creating user account...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      console.log("User created successfully with UID:", user.uid);

      // Save application data to Firestore
      setStatus("Saving application data...");
      const applicationData = {
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
        approved: false,
        createdAt: new Date().toISOString(),
      };

      console.log("Saving application data:", applicationData);
      await addDoc(collection(db, "applications"), applicationData);
      console.log("Application data saved successfully");

      // Navigate to confirmation page
      navigate("/confirmation", {
        state: {
          type: "application",
          name: formData.firstName,
          wantId: formData.wantId,
        },
      });
    } catch (err) {
      console.error("Application submission error:", err);
      setStatus("Error submitting application: " + err.message);
      setStatusType("error");
      setIsLoading(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.dateOfBirth)
        newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.memberSince)
        newErrors.memberSince = "Member since date is required";
      if (!formData.homeAddress)
        newErrors.homeAddress = "Home address is required";
    }

    if (step === 2) {
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.password && formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
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
              : ""
          }`}
        >
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
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
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
              onChange={(e) =>
                setFormData({ ...formData, memberSince: e.target.value })
              }
            />
            {errors.memberSince && (
              <p className="form-error">{errors.memberSince}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required">Home Address</label>
            <input
              className={`form-input ${errors.homeAddress ? "error" : ""}`}
              value={formData.homeAddress}
              onChange={(e) =>
                setFormData({ ...formData, homeAddress: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label required">Password</label>
            <input
              className={`form-input ${errors.password ? "error" : ""}`}
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <p className="form-hint">Must be at least 6 characters</p>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="form-group">
            <label className="form-label">Green Book Photo</label>
            <input
              className="form-file-input"
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) =>
                setFormData({ ...formData, greenBook: e.target.files[0] })
              }
            />
            <p className="form-hint">
              Please upload only PNG or JPG image files.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label required">Head Shot Photo</label>
            <input
              className="form-file-input"
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) =>
                setFormData({ ...formData, headShot: e.target.files[0] })
              }
            />
            <p className="form-hint">
              Please upload only PNG or JPG image files.
            </p>
            {errors.headShot && <p className="form-error">{errors.headShot}</p>}
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
                I want a physical ID card ($5 additional fee)
              </label>
            </div>
          </div>

          <div className="form-info">
            <p>
              The membership fee is $100 for five years, and an additional $5 is
              charged for a physical ID Card.
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
          >
            Previous
          </button>
        )}

        {step < totalSteps ? (
          <button
            type="button"
            onClick={goToNextStep}
            className="form-button form-next"
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
    </div>
  );
}

export default Application;
