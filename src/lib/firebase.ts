import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager,
    getFirestore
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCuiCgkvO4Yi8jSaiDzt2oXiigMJtMd0SM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mebau-926a7.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mebau-926a7",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mebau-926a7.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "725580837904",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:725580837904:web:a727ac47d02ea57ec78695",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-L2HEKZ29PZ"
};

// Khởi tạo Firebase App (Kiểm tra tránh khởi tạo lại nhiều lần trong Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Cấu hình Firestore với Offline Cache
let db;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
    });
} catch (e) {
    // Nếu môi trường server (SSR) hoặc đã khởi tạo
    db = getFirestore(app);
}

export { app, auth, db, googleProvider };
