# TANC ID System

A digital ID system for the Tibetan Association of Northern California.

## Setup Instructions

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file in the root directory with the following variables:
   REACT_APP_FIREBASE_API_KEY=your_api_key REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com REACT_APP_FIREBASE_PROJECT_ID=your_project_id REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id REACT_APP_FIREBASE_APP_ID=your_app_id REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
4. Run the app with `npm start` after using cd (change directory) into project folder (tanc_id)

## Troubleshooting

### Image Upload Errors

If you encounter issues with image uploads:

- Ensure your Cloudinary credentials are correct in the `.env` file
- Check that your upload preset is configured properly in the Cloudinary console
- Verify that the image size is under 5MB
- Try a different image format (JPG or PNG)

### Database Connection Issues

- Make sure your Firebase credentials in the `.env` file are correct
- Check Firebase console to ensure your project is active
- Verify that Firestore is enabled in your Firebase project
- Check the browser console for specific error messages

### Login Problems

- Ensure Firebase Authentication is enabled for Email/Password in your Firebase console
- Try resetting your password
- Check if there are any Firebase Authentication rules blocking access

## Available Scripts

In the project folder, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.
