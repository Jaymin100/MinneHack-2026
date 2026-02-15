import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6dJYQmIiwp594Uqig9aMsh52Aza8RWvg",
  authDomain: "minnehack2026-heartsync.firebaseapp.com",
  projectId: "minnehack2026-heartsync",
  storageBucket: "minnehack2026-heartsync.firebasestorage.app",
  messagingSenderId: "244781072374",
  appId: "1:244781072374:web:6244a592f69036abab11d7",
  measurementId: "G-4N9EWTP7N4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
