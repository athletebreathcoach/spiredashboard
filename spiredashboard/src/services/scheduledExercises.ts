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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface ScheduledExercise {
  id?: string;
  exerciseId: string;
  userId: string;
  exerciseTitle: string;
  exerciseType: string;
  videoId?: string;
  scheduledDateTime: Date;
  status: 'scheduled' | 'completed' | 'incomplete';
  metrics: {
    timeOfDay: string;
    completed?: boolean;
    sets?: Array<{
      reps?: number;
      weight?: number;
      rest?: string;
    }>;
    eachSide?: boolean;
    notes?: string;
    [key: string]: any;
  };
  clientComments: string;
  coachNotes: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: string;
}

// Schedule a new exercise
export const scheduleExercise = async (
  userId: string,
  exerciseId: string,
  scheduledDateTime: Date,
  options: {
    timeOfDay?: string;
    metrics?: any;
    [key: string]: any;
  } = {}
): Promise<ScheduledExercise> => {
  try {
    // Get the exercise details first
    const exerciseRef = doc(db, 'exercises', exerciseId);
    const exerciseDoc = await getDoc(exerciseRef);
    
    if (!exerciseDoc.exists()) {
      throw new Error('Exercise not found');
    }

    const exercise = exerciseDoc.data();
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    const { timeOfDay, metrics, ...restOptions } = options;
    
    const scheduledExercise: ScheduledExercise = {
      exerciseId,
      userId,
      exerciseTitle: exercise.title,
      exerciseType: exercise.type?.name || 'exercise',
      videoId: exercise.videoId,
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        ...(metrics || {}),
        timeOfDay: timeOfDay?.toLowerCase() || 'anytime',
      },
      clientComments: '',
      coachNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      ...restOptions
    };

    const docRef = await addDoc(scheduledExerciseRef, {
      ...scheduledExercise,
      scheduledDateTime: Timestamp.fromDate(scheduledDateTime),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { 
      id: docRef.id, 
      ...scheduledExercise 
    };
  } catch (error) {
    console.error('Error scheduling exercise:', error);
    throw error;
  }
};

// Get scheduled exercises for a date range
export const getScheduledExercises = async (
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<ScheduledExercise[]> => {
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
      ...doc.data(),
      scheduledDateTime: doc.data().scheduledDateTime.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as ScheduledExercise[];
  } catch (error) {
    console.error('Error getting scheduled exercises:', error);
    throw error;
  }
};

// Update exercise metrics
export const updateExerciseMetrics = async (
  exerciseId: string, 
  metrics: any
): Promise<void> => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', exerciseId);
    await updateDoc(exerciseRef, { 
      metrics,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating exercise metrics:', error);
    throw error;
  }
};

// Update exercise status
export const updateExerciseStatus = async (
  exerciseId: string, 
  status: 'scheduled' | 'completed' | 'incomplete'
): Promise<void> => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', exerciseId);
    await updateDoc(exerciseRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating exercise status:', error);
    throw error;
  }
}; 