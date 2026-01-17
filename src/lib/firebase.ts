// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDi_5iRepKybWqajhsx2wO9ag0yfWOvPF8",
  authDomain: "saleslive-4u.firebaseapp.com",
  projectId: "saleslive-4u",
  storageBucket: "saleslive-4u.firebasestorage.app",
  messagingSenderId: "951629566693",
  appId: "1:951629566693:web:15aeb36f1ad16986a6fa0c",
  measurementId: "G-QVWT0N5Q2C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);