import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBdM1ekAzFA8vcMcMn_vAj3BudNd_Cze4o",
  authDomain: "ruok-8c88d.firebaseapp.com",
  projectId: "ruok-8c88d",
  storageBucket: "ruok-8c88d.firebasestorage.app",
  messagingSenderId: "851077051440",
  appId: "1:851077051440:web:00eaddb4a935ebbddb29f5",
  measurementId: "G-T7G705PB3H"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app); 