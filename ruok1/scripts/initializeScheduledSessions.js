import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc } from 'firebase/firestore';

// Firebase config from your config/firebase.js
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
const db = getFirestore(app);

export const initializeScheduledSessions = async () => {
  try {
    // Create a dummy document to initialize the collection
    const scheduledSessionsRef = collection(db, 'scheduledSessions');
    const dummyDoc = doc(scheduledSessionsRef, 'initialization');
    
    await setDoc(dummyDoc, {
      _initialization: true,
      createdAt: new Date(),
      note: 'This is a placeholder document to initialize the scheduledSessions collection.'
    });

    console.log('Successfully initialized scheduledSessions collection');
    
    // Delete the dummy document after initialization
    await deleteDoc(doc(db, 'scheduledSessions', 'initialization'));
    
    return true;
  } catch (error) {
    console.error('Error initializing scheduledSessions:', error);
    throw error;
  }
}; 