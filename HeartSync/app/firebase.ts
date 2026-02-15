// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC6dJYQmIiwp594Uqig9aMsh52Aza8RWvg",
  authDomain: "minnehack2026-heartsync.firebaseapp.com",
  projectId: "minnehack2026-heartsync",
  storageBucket: "minnehack2026-heartsync.firebasestorage.app",
  messagingSenderId: "244781072374",
  appId: "1:244781072374:web:6244a592f69036abab11d7",
  measurementId: "G-4N9EWTP7N4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const db = getFirestore(app);


export const initAnalytics = async () => {
    if (typeof window !== "undefined") {
      const { getAnalytics } = await import("firebase/analytics");
      return getAnalytics(app);
    }
  };

// comments are copy and pasted from the firebase console