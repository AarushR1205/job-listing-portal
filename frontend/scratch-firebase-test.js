import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

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
    const email = `test${Date.now()}@test.com`;
    console.log("Creating user:", email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, "password123");
    const token = await userCredential.user.getIdToken();
    console.log("Got token");

    const res = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: "Test User",
        email: email,
        password: "password123",
        role: "jobseeker",
        phone: "1234567890",
        skills: ["React", "Node"],
        experience: "2 years",
        idToken: token
      })
    });
    
    const data = await res.json();
    console.log("Response:", res.status, data);
  } catch (err) {
    console.log("Error:", err.message);
  }
}

test();
