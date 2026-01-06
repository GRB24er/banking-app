// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Hardcoded Firebase configuration - REPLACE THESE VALUES WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCmBBF3nYQBPPk1-Y91Yy9U0rKbiJ5dXiw",
  authDomain: "horizon-a9087.firebaseapp.com",
  projectId: "horizon-a9087",
  storageBucket: "horizon-a9087.firebasestorage.app",
  messagingSenderId: "151569457690",
  appId: "1:151569457690:web:2b829e8353f91b758ea7a3",
  measurementId: "G-T06BDR56WD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);

// Explicit exports
export { db, auth };