
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: This is a public-facing config object, and security is enforced via Firestore Security Rules.
const firebaseConfig = {
  projectId: "le-singulier-ai",
  appId: "1:160628171290:web:332eeec20941d04cf9a7a3",
  storageBucket: "le-singulier-ai.firebasestorage.app",
  apiKey: "AIzaSyB11kYlG3sbDZj0yEBncQ9n7PHYO4EyCmg",
  authDomain: "le-singulier-ai.firebaseapp.com",
  messagingSenderId: "160628171290"
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
