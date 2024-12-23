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

// Create a new scheduled exercise
export const scheduleExercise = async (userId, exerciseId, scheduledDateTime, options = {}) => {
  try {
    const exerciseRef = doc(db, 'exercises', exerciseId);
    const exerciseDoc = await getDoc(exerciseRef);
    
    if (!exerciseDoc.exists()) {
      throw new Error('Exercise not found');
    }

    const exercise = exerciseDoc.data();
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    const scheduledExercise = {
      exerciseId,
      userId,
      exerciseTitle: exercise.title,
      exerciseType: exercise.type,
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        reps: null,
        weights: null,
        sets: null,
        rir: null, // Reps In Reserve
        time: null,
        distance: null,
        calories: null,
        oneRmPercentage: null, // %1RM
      },
      clientComments: '',
      coachNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId, // Track who created this scheduled exercise (could be coach or user)
      ...options
    };

    const docRef = await addDoc(scheduledExerciseRef, scheduledExercise);
    return { id: docRef.id, ...scheduledExercise };
  } catch (error) {
    console.error('Error scheduling exercise:', error);
    throw error;
  }
};

// Update metrics for a scheduled exercise
export const updateExerciseMetrics = async (scheduledExerciseId, metrics) => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', scheduledExerciseId);
    
    await updateDoc(exerciseRef, {
      metrics: {
        ...metrics
      },
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating exercise metrics:', error);
    throw error;
  }
};

// Update status of a scheduled exercise
export const updateExerciseStatus = async (scheduledExerciseId, status) => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', scheduledExerciseId);
    
    await updateDoc(exerciseRef, {
      status,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating exercise status:', error);
    throw error;
  }
};

// Add or update comments/notes
export const updateExerciseNotes = async (scheduledExerciseId, { clientComments, coachNotes }) => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', scheduledExerciseId);
    const updates = {};
    
    if (clientComments !== undefined) updates.clientComments = clientComments;
    if (coachNotes !== undefined) updates.coachNotes = coachNotes;
    updates.updatedAt = serverTimestamp();
    
    await updateDoc(exerciseRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating exercise notes:', error);
    throw error;
  }
};

// Get scheduled exercises for a specific date range for a user
export const getScheduledExercises = async (userId, startDate, endDate) => {
  try {
    const exercisesRef = collection(db, 'scheduledExercises');
    const q = query(
      exercisesRef,
      where('userId', '==', userId),
      where('scheduledDateTime', '>=', startDate),
      where('scheduledDateTime', '<=', endDate),
      orderBy('scheduledDateTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting scheduled exercises:', error);
    throw error;
  }
};

// Get exercise history (completed exercises) for a user
export const getExerciseHistory = async (userId, exerciseId) => {
  try {
    const exercisesRef = collection(db, 'scheduledExercises');
    const q = query(
      exercisesRef,
      where('userId', '==', userId),
      where('exerciseId', '==', exerciseId),
      where('status', '==', 'completed'),
      orderBy('scheduledDateTime', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting exercise history:', error);
    throw error;
  }
};

// Get all metrics history for an exercise for a user
export const getExerciseMetricsHistory = async (userId, exerciseId) => {
  try {
    const exercisesRef = collection(db, 'scheduledExercises');
    const q = query(
      exercisesRef,
      where('userId', '==', userId),
      where('exerciseId', '==', exerciseId),
      where('status', '==', 'completed'),
      orderBy('scheduledDateTime', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      date: doc.data().scheduledDateTime,
      metrics: doc.data().metrics
    }));
  } catch (error) {
    console.error('Error getting exercise metrics history:', error);
    throw error;
  }
};

// Get all scheduled exercises for a coach's clients within a date range
export const getClientScheduledExercises = async (clientIds, startDate, endDate) => {
  try {
    const exercisesRef = collection(db, 'scheduledExercises');
    const q = query(
      exercisesRef,
      where('userId', 'in', clientIds),
      where('scheduledDateTime', '>=', startDate),
      where('scheduledDateTime', '<=', endDate),
      orderBy('scheduledDateTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting client scheduled exercises:', error);
    throw error;
  }
};