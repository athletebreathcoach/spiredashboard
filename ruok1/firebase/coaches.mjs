import { db } from '../config/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Create a new coach document
export const createCoach = async (userId, email) => {
  try {
    // First check if user exists
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User does not exist');
    }

    // Create coach document
    await setDoc(doc(db, 'coaches', userId), {
      email,
      createdAt: new Date().toISOString(),
      clients: [], // Array of client user IDs
      status: 'active'
    });

    return true;
  } catch (error) {
    console.error('Error creating coach:', error);
    throw error;
  }
};

// Get coach by email
export const getCoachByEmail = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }

    const userId = querySnapshot.docs[0].id;
    const coachDoc = await getDoc(doc(db, 'coaches', userId));
    
    if (!coachDoc.exists()) {
      return null;
    }

    return {
      id: userId,
      ...coachDoc.data()
    };
  } catch (error) {
    console.error('Error getting coach:', error);
    throw error;
  }
};

// Check if user is a coach
export const isUserCoach = async (userId) => {
  try {
    const coachDoc = await getDoc(doc(db, 'coaches', userId));
    return coachDoc.exists();
  } catch (error) {
    console.error('Error checking coach status:', error);
    throw error;
  }
}; 