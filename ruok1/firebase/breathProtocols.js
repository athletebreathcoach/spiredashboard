import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const getBreathProtocols = async () => {
  try {
    const breathProtocolsRef = collection(db, 'breathProtocols');
    const snapshot = await getDocs(breathProtocolsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting breath protocols:', error);
    throw error;
  }
}; 