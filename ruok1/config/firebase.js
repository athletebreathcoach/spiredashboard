import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional: Add this to check if Firebase is properly initialized
if (!app) {
  console.error('Firebase not initialized!');
}

// Optional: Add this to check auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
  } else {
    console.log('User is signed out');
  }
}); 