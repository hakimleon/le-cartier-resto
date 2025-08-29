
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { config } from 'dotenv';

config(); // Force loading of environment variables

// Your web app's Firebase configuration
// IMPORTANT: This is a public-facing config object, and security is enforced via Firestore Security Rules.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCuO62Uf-dGglqlrC1yFjICQkYYbvvv3us",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "le-singulier-d4513.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "le-singulier-d4513",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "le-singulier-d4513.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "606165341069",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:606165341069:web:1d70d57e873261645963c4",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-RQM9MZCR5X"
};
// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const storage = getStorage(app);

// Helper to check if the config is valid
export const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;


export { app, db, storage, firebaseConfig };
