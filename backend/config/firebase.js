import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let app;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.warn("No FIREBASE_SERVICE_ACCOUNT found in .env, attempting default initialization.");
    app = admin.initializeApp();
  }
} catch (error) {
  if (!/already exists/.test(error.message)) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export default admin;
