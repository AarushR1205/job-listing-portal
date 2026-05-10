import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Firebase configuration from frontend/.env
const firebaseConfig = {
  apiKey: "AIzaSyCLopg559CfCiGlVVK2NnIeF940nLoedEI",
  authDomain: "job-listing-portal-project.firebaseapp.com",
  projectId: "job-listing-portal-project",
  databaseURL: "https://job-listing-portal-project-default-rtdb.firebaseio.com",
  storageBucket: "job-listing-portal-project.firebasestorage.app",
  messagingSenderId: "940096554737",
  appId: "1:940096554737:web:a6ba9c5a9dc8f4920c4b50",
  measurementId: "G-NKZQCZK1GT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    const email = `employer@test.com`; // From our DB
    console.log("Logging in user:", email);
    const userCredential = await signInWithEmailAndPassword(auth, email, "password123");
    const token = await userCredential.user.getIdToken();
    console.log("Got token");

    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idToken: token
      })
    });
    
    const data = await res.json();
    console.log("Login Response:", res.status, data);

    const appsRes = await fetch('http://localhost:5001/api/jobs/employer/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("Analytics Response:", appsRes.status, await appsRes.json());
  } catch (err) {
    console.log("Error:", err.message);
  }
}

test();
