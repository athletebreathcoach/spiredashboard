import { collection, getDocs, doc, getDoc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

// Get all guided sessions
export const getGuidedSessions = async () => {
  try {
    const guidedSessionsRef = collection(db, 'guidedSessions');
    const q = query(guidedSessionsRef, orderBy('title'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting guided sessions:', error);
    throw error;
  }
};

// Get a single guided session by ID
export const getGuidedSessionById = async (sessionId) => {
  try {
    const sessionRef = doc(db, 'guidedSessions', sessionId);
    const snapshot = await getDoc(sessionRef);
    
    if (!snapshot.exists()) {
      throw new Error('Guided session not found');
    }

    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  } catch (error) {
    console.error('Error getting guided session:', error);
    throw error;
  }
};

// Schedule a guided session using the scheduledExercises collection
export const scheduleGuidedSession = async (userId, sessionId, scheduledDate, timeOfDay) => {
  try {
    const sessionRef = doc(db, 'guidedSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('Guided session not found');
    }

    const sessionData = sessionDoc.data();
    
    const scheduledExercisesRef = collection(db, 'scheduledExercises');
    await addDoc(scheduledExercisesRef, {
      userId,
      type: 'guidedSession',
      sessionId,
      exerciseTitle: sessionData.title,
      title: sessionData.title,
      description: sessionData.description,
      duration: sessionData.duration,
      videoUrl: sessionData.videoUrl,
      intensity: sessionData.intensity,
      scheduledDateTime: scheduledDate,
      status: 'scheduled',
      metrics: {
        timeOfDay: timeOfDay || 'Anytime',
        completed: false,
        logged: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error scheduling guided session:', error);
    throw error;
  }
}; 