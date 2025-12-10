import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// BURAYI KENDİ KODLARINLA DOLDURMALISIN
// (Firebase Console -> Project Settings -> General -> Your Apps kısmından alabilirsin)
const firebaseConfig = {
  apiKey: "AIzaSyAZYnxLuoZXJml9_P0bwPOqaBPoBJ8GZEA",
  authDomain: "halisaha-yeni.firebaseapp.com",
  projectId: "halisaha-yeni",
  storageBucket: "halisaha-yeni.firebasestorage.app",
  messagingSenderId: "845984284032",
  appId: "1:845984284032:web:a3b3cb789ffe6775c2d565"
};

// Firebase'i Başlat
const app = initializeApp(firebaseConfig);

// Auth servisini dışarı aktar (Diğer sayfalarda kullanmak için)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();