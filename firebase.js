import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyBMKLw4hI-iO5xd7fJvQ6JXEoHJaojJwhM",
    authDomain: "crazy-1a978.firebaseapp.com",
    projectId: "crazy-1a978", 
    storageBucket: "crazy-1a978.firebasestorage.app",
    messagingSenderId: "239489043141",
    appId: "1:239489043141:web:94f827b704ae5c9f033eac",
    measurementId: "G-5D99D532YR"
  };
const app = initializeApp(firebaseConfig); 
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);