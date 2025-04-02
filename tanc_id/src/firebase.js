import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Check if the environment variables are loaded
const checkConfig = () => {
  const missingVars = [];
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) missingVars.push(key);
  });

  if (missingVars.length > 0) {
    console.error(
      `Missing Firebase config variables: ${missingVars.join(", ")}`
    );
    console.error(
      "Current environment variables loaded:",
      Object.keys(process.env)
        .filter((key) => key.startsWith("REACT_APP_"))
        .map((key) => key)
    );

    console.warn(
      "Firebase may not function correctly due to missing configuration."
    );
  } else {
    console.log("Firebase configuration loaded successfully.");
  }
};

checkConfig();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence); // Set persistence mode
export { auth, db };
