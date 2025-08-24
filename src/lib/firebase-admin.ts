// This file is no longer needed with the new approach of storing image data URIs in Firestore.
// I am keeping it in case we need server-side admin operations in the future, but it's currently unused.
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Note: When running in Firebase App Hosting, credentials are automatically discovered.
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
}

const db = admin.firestore();

export { db };
