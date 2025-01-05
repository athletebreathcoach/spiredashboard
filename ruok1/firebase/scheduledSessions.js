import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { auth } from '../config/firebase';

export const scheduleSession = async (userId, session, scheduledDateTime, timeOfDay) => {
  try {
    console.log('Scheduling session with data:', {
      userId,
      session: JSON.stringify(session, null, 2),
      scheduledDateTime,
      timeOfDay
    });

    const scheduledSessionRef = collection(db, 'scheduledSessions');
    
    const scheduledSession = {
      userId,
      createdBy: auth.currentUser.uid,
      title: session.title,
      description: session.description || '',
      items: session.items.map(item => {
        if (item.type === 'section' || item.type === 'amrap' || item.type === 'forTime' || item.type === 'chipper' || item.type === 'intervals') {
          return {
            ...item,
            activities: item.activities.map(exercise => ({
              ...exercise,
              status: 'scheduled'
            }))
          };
        } else {
          return {
            ...item,
            status: 'scheduled'
          };
        }
      }),
      scheduledDateTime,
      timeOfDay,
      status: 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Formatted scheduled session:', JSON.stringify(scheduledSession, null, 2));

    const docRef = await addDoc(scheduledSessionRef, scheduledSession);
    const result = { id: docRef.id, ...scheduledSession };
    console.log('Successfully scheduled session:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error scheduling session:', error);
    throw error;
  }
};

export const getScheduledSessions = async (userId, startDate, endDate) => {
  try {
    console.log('Getting scheduled sessions:', {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const sessionsRef = collection(db, 'scheduledSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('scheduledDateTime', '>=', startDate),
      where('scheduledDateTime', '<=', endDate),
      orderBy('scheduledDateTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Found sessions:', {
      count: sessions.length,
      sessions
    });

    return sessions;
  } catch (error) {
    console.error('Error getting scheduled sessions:', error);
    throw error;
  }
};

export const updateScheduledSession = async (sessionId, updates) => {
  try {
    const sessionRef = doc(db, 'scheduledSessions', sessionId);
    await updateDoc(sessionRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating scheduled session:', error);
    throw error;
  }
};

export const getScheduledSessionById = async (sessionId) => {
  try {
    const sessionRef = doc(db, 'scheduledSessions', sessionId);
    const docSnap = await getDoc(sessionRef);
    
    if (!docSnap.exists()) {
      throw new Error('Scheduled session not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('Error getting scheduled session:', error);
    throw error;
  }
}; 