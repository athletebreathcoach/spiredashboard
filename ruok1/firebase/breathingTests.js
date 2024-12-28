import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const getBreathingTests = async () => {
  try {
    const breathingTestsRef = collection(db, 'breathingTests');
    const snapshot = await getDocs(breathingTestsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting breathing tests:', error);
    throw error;
  }
}; 