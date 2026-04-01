import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDXrUOb4HslNxY9MtZnVFbx-hnMExENRCk",
  authDomain: "mindcheck-469a6.firebaseapp.com",
  projectId: "mindcheck-469a6",
  storageBucket: "mindcheck-469a6.firebasestorage.app",
  messagingSenderId: "810182458744",
  appId: "1:810182458744:web:8190e03caecab2c5941c8d",
  measurementId: "G-WQ21BRT3Z4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
