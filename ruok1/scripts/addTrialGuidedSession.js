import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxjAcWUE0J4qMJqDCgVqxqPkJ-z_Ys0Vc",
  authDomain: "ruok-8c88d.firebaseapp.com",
  projectId: "ruok-8c88d",
  storageBucket: "ruok-8c88d.appspot.com",
  messagingSenderId: "1031311255327",
  appId: "1:1031311255327:web:2c5bb7ea632c2f4a8c5f3a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const trialSession = {
  title: "Box Breathing Technique - Navy SEAL Teaches How To Calm Down Fast!",
  description: "A guided box breathing session that teaches you how to calm down quickly using a technique practiced by Navy SEALs. Perfect for stress relief, anxiety reduction, and improving focus.",
  duration: "10",
  type: "Stress Relief",
  intensity: "Medium",
  videoUrl: "https://www.youtube.com/watch?v=DbDoBzGY3vo",
  createdAt: new Date(),
};

export const addTrialGuidedSession = async () => {
  try {
    const guidedSessionsRef = collection(db, 'guidedSessions');
    const docRef = await addDoc(guidedSessionsRef, trialSession);
    console.log('Trial guided session added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding trial guided session:', error);
    throw error;
  }
}; 