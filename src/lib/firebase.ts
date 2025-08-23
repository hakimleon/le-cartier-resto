// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: This is a public-facing config object, and security is enforced via Firestore Security Rules.
const firebaseConfig = {
  apiKey: "AIzaSyCuO62Uf-dGglqlrC1yFjICQkYYbvvv3us",
  authDomain: "le-singulier-d4513.firebaseapp.com",
  projectId: "le-singulier-d4513",
  storageBucket: "le-singulier-d4513.firebasestorage.app",
  messagingSenderId: "606165341069",
  appId: "1:606165341069:web:1d70d57e873261645963c4",
  measurementId: "G-RQM9MZCR5X"
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

export { app, db };