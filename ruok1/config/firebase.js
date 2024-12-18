import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
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

// Initialize Auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db }; 