// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "./config/firebaseConfig";

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore DB
const db = getFirestore(app);
// Storage
const storage = getStorage(app);
// Auth
const auth = getAuth(app);

export { db, auth, storage };
