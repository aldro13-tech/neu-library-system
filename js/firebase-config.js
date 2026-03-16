// ============================================================
// firebase-config.js
// Firebase initialization and shared Firestore/Auth references
// Replace the firebaseConfig object with your own project keys
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─── REPLACE WITH YOUR FIREBASE PROJECT CONFIG ───────────────
const firebaseConfig = {
  apiKey: "AIzaSyAWrGp03rY2Mm5l5m18G7mZKVHr3s7a-9Y",
  authDomain: "neu-library-system-b2592.firebaseapp.com",
  projectId: "neu-library-system-b2592",
  storageBucket: "neu-library-system-b2592.firebasestorage.app",
  messagingSenderId: "537139142467",
  appId: "1:537139142467:web:862589098f3b6e4b8799f6"
};
// ─────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Enforce only @neu.edu.ph accounts
googleProvider.setCustomParameters({ hd: "neu.edu.ph" });

const ALLOWED_DOMAIN = "@neu.edu.ph";
const ADMIN_EMAILS = [
  "aldronathaniel.altar@neu.edu.ph",
  "jcesperanza@neu.edu.ph"
]; // Add admin emails here

export {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  orderBy,
  Timestamp,
  serverTimestamp,
  ALLOWED_DOMAIN,
  ADMIN_EMAILS,
};
