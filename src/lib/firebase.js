import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGORnZM7I2YKcjNUa5G1rYpcFfiQ-qi2I",
  authDomain: "cogial.firebaseapp.com",
  projectId: "cogial",
  storageBucket: "cogial.firebasestorage.app",
  messagingSenderId: "654361648688",
  appId: "1:654361648688:web:06b0298a87651f91a897f5",
  measurementId: "G-T8X7M2FLNK"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
