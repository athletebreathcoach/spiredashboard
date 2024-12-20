import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

// Structure in Firestore will be:
// users/{userId}/exerciseResults/{resultId}
// This allows coaches to query their clients' results

export const saveExerciseResult = async (userId, exerciseId, resultData) => {
  try {
    const resultRef = collection(db, 'users', userId, 'exerciseResults');
    await addDoc(resultRef, {
      exerciseId,
      ...resultData,
      completedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving exercise result:', error);
    throw error;
  }
};

// For coaches to get client results
export const getClientExerciseResults = async (clientId, exerciseId = null) => {
  try {
    const resultRef = collection(db, 'users', clientId, 'exerciseResults');
    let q = resultRef;
    
    if (exerciseId) {
      q = query(resultRef, where('exerciseId', '==', exerciseId));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting exercise results:', error);
    throw error;
  }
};

// For users to get their own results
export const getUserExerciseResults = async (userId, exerciseId = null) => {
  try {
    const resultRef = collection(db, 'users', userId, 'exerciseResults');
    let q = resultRef;
    
    if (exerciseId) {
      q = query(resultRef, where('exerciseId', '==', exerciseId));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting exercise results:', error);
    throw error;
  }
}; 