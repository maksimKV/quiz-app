import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "quiz-app-9961f.firebaseapp.com",
  projectId: "quiz-app-9961f",
  storageBucket: "quiz-app-9961f.appspot.com",
  messagingSenderId: "588287629961",
  appId: "1:588287629961:web:1606c20ddc76a66029c458",
  measurementId: "G-5EWXYDYKJK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app)