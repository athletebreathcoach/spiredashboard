import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const createSession = async (sessionData) => {
  try {
    const sessionsRef = collection(db, 'sessions');
    const docRef = await addDoc(sessionsRef, sessionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const updateSession = async (sessionId, sessionData) => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, sessionData);
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
}; 