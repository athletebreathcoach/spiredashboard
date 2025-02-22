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
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface BaseScheduledExercise {
  id?: string;
  exerciseId: string;
  userId: string;
  exerciseTitle: string;
  type: 'habit' | 'task' | 'exercise' | 'breathProtocol' | 'education' | 'note' | 'guidedSession';
  scheduledDateTime: Date;
  status: 'scheduled' | 'completed';
  metrics: {
    completed: boolean;
    streak: number;
    timeOfDay: string;
    [key: string]: any;
  };
  clientComments: string;
  coachNotes: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  [key: string]: any;
}

export interface ScheduledExercise extends Omit<BaseScheduledExercise, 'metrics'> {
  metrics: {
    completed: boolean;
    streak?: number;
    timeOfDay: string;
    [key: string]: any;
  };
}

// Schedule a new exercise
export const scheduleExercise = async (
  userId: string,
  exerciseId: string,
  scheduledDateTime: Date,
  options: {
    timeOfDay?: string;
    metrics?: any;
    type?: string;
    [key: string]: any;
  } = {}
): Promise<ScheduledExercise> => {
  try {
    // Handle education type differently
    if (options.type === 'education') {
      const educationRef = doc(db, 'education', 'content', 'documents', exerciseId);
      const educationDoc = await getDoc(educationRef);
      
      if (!educationDoc.exists()) {
        throw new Error('Education document not found');
      }

      const education = educationDoc.data();
      const scheduledExerciseRef = collection(db, 'scheduledExercises');
      
      // Ensure we have a valid title
      const title = options.exerciseTitle || education?.title || 'Untitled';
      
      // First spread options, then override specific fields to ensure they're not overwritten
      const scheduledEducation: ScheduledExercise = {
        ...options,
        exerciseId,
        userId,
        exerciseTitle: title,
        title: title, // Add title field as well for compatibility
        exerciseType: 'education',
        type: 'education', // Add type field for compatibility
        scheduledDateTime,
        status: 'scheduled',
        metrics: {
          timeOfDay: (options.timeOfDay || 'anytime').toLowerCase(),
          completed: false,
          logged: false,
          content: education.content || '',
          documentId: exerciseId,
          linkPreviews: education.linkPreviews || [],
          title: title, // Add title to metrics as well
          ...(options.metrics || {})
        },
        clientComments: '',
        coachNotes: options.coachNotes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        // These fields are also included at the top level for backward compatibility
        content: education.content || '',
        documentId: exerciseId,
        linkPreviews: education.linkPreviews || []
      };

      const docRef = await addDoc(scheduledExerciseRef, {
        ...scheduledEducation,
        scheduledDateTime: Timestamp.fromDate(scheduledDateTime),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...scheduledEducation
      };
    }

    // Original exercise scheduling logic
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
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      metrics: {
        completed: doc.data().metrics?.completed || false,
        streak: doc.data().metrics?.streak || 0,
        timeOfDay: doc.data().metrics?.timeOfDay || 'anytime',
        ...(doc.data().metrics || {})
      }
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

// Schedule a habit
export const scheduleHabit = async (
  userId: string,
  habitId: string,
  scheduledDateTime: Date,
  options: {
    timeOfDay?: string;
    metrics?: any;
    [key: string]: any;
  } = {}
): Promise<ScheduledExercise> => {
  try {
    const habitRef = doc(db, 'habitstasks', habitId);
    const habitDoc = await getDoc(habitRef);
    
    if (!habitDoc.exists()) {
      throw new Error('Habit not found');
    }

    const habit = habitDoc.data();
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    const scheduledHabit: Omit<ScheduledExercise, 'id'> = {
      exerciseId: habitId,
      userId,
      exerciseTitle: habit.title || 'Untitled Habit',
      type: 'habit',
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        completed: false,
        streak: 0,
        timeOfDay: options.timeOfDay?.toLowerCase() || 'anytime',
        ...(options.metrics || {})
      },
      clientComments: '',
      coachNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    const docRef = await addDoc(scheduledExerciseRef, {
      ...scheduledHabit,
      scheduledDateTime: Timestamp.fromDate(scheduledDateTime),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const result: ScheduledExercise = {
      ...scheduledHabit,
      id: docRef.id
    };

    return result;
  } catch (error) {
    console.error('Error scheduling habit:', error);
    throw error;
  }
};

// Schedule a task
export const scheduleTask = async (
  userId: string,
  taskId: string,
  scheduledDateTime: Date,
  options: {
    timeOfDay?: string;
    metrics?: any;
    [key: string]: any;
  } = {}
): Promise<ScheduledExercise> => {
  try {
    const taskRef = doc(db, 'habitstasks', taskId);
    const taskDoc = await getDoc(taskRef);
    
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }

    const task = taskDoc.data();
    const taskTitle = typeof task.title === 'string' ? task.title : 
                     typeof task.name === 'string' ? task.name : 
                     'Untitled Task';
                     
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    // Create base scheduled task object
    const scheduledTask: Omit<ScheduledExercise, 'id'> = {
      exerciseId: taskId,
      userId,
      exerciseTitle: taskTitle,
      type: 'task',
      exerciseType: 'task',
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        completed: false,
        priority: task.priority || 'medium',
        timeOfDay: options.timeOfDay?.toLowerCase() || 'anytime',
        ...(options.metrics || {})
      },
      clientComments: '',
      coachNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    // Filter out any undefined values from options
    const cleanOptions = Object.fromEntries(
      Object.entries(options).filter(([_, value]) => value !== undefined)
    );

    // Create the final object to save to Firestore
    const firestoreDoc = {
      ...scheduledTask,
      ...cleanOptions,
      scheduledDateTime: Timestamp.fromDate(scheduledDateTime),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(scheduledExerciseRef, firestoreDoc);

    return {
      ...scheduledTask,
      ...cleanOptions,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error scheduling task:', error);
    throw error;
  }
};

// Schedule an apnea table
export const scheduleApneaTable = async (
  userId: string,
  scheduledDateTime: Date,
  options: {
    timeOfDay?: string;
    metrics?: {
      settings?: {
        tableName?: string;
        type?: 'co2' | 'o2';
        breathHolds?: number;
        apneaTime?: string;
        restStartTime?: string;
        restDecrement?: string;
        cooldownTime?: string;
      };
    };
    [key: string]: any;
  }
): Promise<ScheduledExercise> => {
  try {
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    const scheduledTable: ScheduledExercise = {
      exerciseId: 'apnea-table',
      userId,
      exerciseTitle: options.metrics?.settings?.tableName || 'Apnea Table',
      exerciseType: 'breathProtocol',
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        completed: false,
        timeOfDay: options.timeOfDay?.toLowerCase() || 'anytime',
        settings: {
          type: options.metrics?.settings?.type || 'co2',
          breathHolds: options.metrics?.settings?.breathHolds || 3,
          apneaTime: options.metrics?.settings?.apneaTime || '01:30',
          restStartTime: options.metrics?.settings?.restStartTime || '02:00',
          restDecrement: options.metrics?.settings?.restDecrement || '00:15',
          cooldownTime: options.metrics?.settings?.cooldownTime || '01:00'
        }
      },
      clientComments: '',
      coachNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    const docRef = await addDoc(scheduledExerciseRef, {
      ...scheduledTable,
      scheduledDateTime: Timestamp.fromDate(scheduledDateTime),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { 
      id: docRef.id, 
      ...scheduledTable 
    };
  } catch (error) {
    console.error('Error scheduling apnea table:', error);
    throw error;
  }
};

// Delete a scheduled exercise
export const deleteScheduledExercise = async (exerciseId: string): Promise<void> => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', exerciseId);
    
    // First, check if this is a section
    const exerciseDoc = await getDoc(exerciseRef);
    if (!exerciseDoc.exists()) {
      throw new Error('Exercise not found');
    }

    const exerciseData = exerciseDoc.data();
    
    // If it's a section, delete all related exercises
    if (exerciseData.type === 'section' || exerciseData.isParent) {
      const exercisesRef = collection(db, 'scheduledExercises');
      const q = query(exercisesRef, where('sectionId', '==', exerciseId));
      const snapshot = await getDocs(q);
      
      // Delete all related exercises
      await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
    }
    
    // Delete the main exercise document
    await deleteDoc(exerciseRef);
  } catch (error) {
    console.error('Error deleting scheduled exercise:', error);
    throw error;
  }
};

// Update habit status
export const updateHabitStatus = async (
  exerciseId: string,
  completed: boolean
): Promise<void> => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', exerciseId);
    
    await updateDoc(exerciseRef, {
      'metrics.completed': completed,
      status: completed ? 'completed' : 'scheduled',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating habit status:', error);
    throw error;
  }
};

// Update task status
export const updateTaskStatus = async (
  exerciseId: string,
  completed: boolean
): Promise<void> => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', exerciseId);
    
    await updateDoc(exerciseRef, {
      'metrics.completed': completed,
      status: completed ? 'completed' : 'scheduled',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

// Update exercise notes
export const updateExerciseNotes = async (
  exerciseId: string,
  updates: {
    clientComments?: string;
    coachNotes?: string;
  }
): Promise<void> => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', exerciseId);
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    if (updates.clientComments !== undefined) {
      updateData.clientComments = updates.clientComments;
    }
    if (updates.coachNotes !== undefined) {
      updateData.coachNotes = updates.coachNotes;
    }
    
    await updateDoc(exerciseRef, updateData);
  } catch (error) {
    console.error('Error updating exercise notes:', error);
    throw error;
  }
};

// Schedule a guided session
export const scheduleGuidedSession = async (
  userId: string,
  sessionId: string,
  scheduledDateTime: Date,
  timeOfDay: string = 'anytime'
): Promise<ScheduledExercise> => {
  try {
    const sessionRef = doc(db, 'guidedSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('Guided session not found');
    }

    const sessionData = sessionDoc.data();
    
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    const scheduledSession: ScheduledExercise = {
      exerciseId: sessionId,
      userId,
      exerciseTitle: sessionData.title,
      exerciseType: 'guidedSession',
      videoId: sessionData.videoUrl || '',
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        timeOfDay: timeOfDay.toLowerCase(),
        completed: false,
        logged: false,
        duration: sessionData.duration,
        intensity: sessionData.intensity
      },
      clientComments: '',
      coachNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    const docRef = await addDoc(scheduledExerciseRef, {
      ...scheduledSession,
      scheduledDateTime: Timestamp.fromDate(scheduledDateTime),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...scheduledSession
    };
  } catch (error) {
    console.error('Error scheduling guided session:', error);
    throw error;
  }
};

// Schedule a breath protocol
export const scheduleBreathProtocol = async (
  userId: string,
  protocolId: string,
  scheduledDateTime: Date,
  options: {
    metrics?: {
      timeOfDay?: string;
      settings?: any;
    };
    [key: string]: any;
  } = {}
): Promise<ScheduledExercise> => {
  try {
    const protocolRef = doc(db, 'breathProtocols', protocolId);
    const protocolDoc = await getDoc(protocolRef);
    
    if (!protocolDoc.exists()) {
      throw new Error('Breath protocol not found');
    }

    const protocol = protocolDoc.data();
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    // Ensure pattern fields are properly set with defaults if missing
    const pattern = {
      inhale: protocol.pattern?.inhale || 4,
      inHold: protocol.pattern?.inHold || 4,
      exhale: protocol.pattern?.exhale || 4,
      exHold: protocol.pattern?.exHold || 4,
    };
    
    const scheduledProtocol: ScheduledExercise = {
      exerciseId: protocolId,
      userId,
      exerciseTitle: protocol.title || 'Untitled Protocol',
      exerciseType: 'breathProtocol',
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        timeOfDay: options.metrics?.timeOfDay || 'anytime',
        completed: false,
        duration: protocol.duration || '5:00',
        rounds: protocol.rounds || 10,
        settings: options.metrics?.settings || {},
        pattern
      },
      clientComments: '',
      coachNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      ...options
    };

    const docRef = await addDoc(scheduledExerciseRef, {
      ...scheduledProtocol,
      scheduledDateTime: Timestamp.fromDate(scheduledDateTime),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...scheduledProtocol
    };
  } catch (error) {
    console.error('Error scheduling breath protocol:', error);
    throw error;
  }
};

// Schedule a note
export const scheduleNote = async (
  userId: string,
  scheduledDateTime: Date,
  options: {
    title: string;
    content: string;
    timeOfDay?: string;
    metrics?: any;
    [key: string]: any;
  }
): Promise<ScheduledExercise> => {
  try {
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    const scheduledNote: ScheduledExercise = {
      exerciseId: 'note',
      userId,
      exerciseTitle: options.title,
      exerciseType: 'note',
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        timeOfDay: options.timeOfDay?.toLowerCase() || 'anytime',
        completed: false,
        content: options.content,
        ...(options.metrics || {})
      },
      clientComments: '',
      coachNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      ...options
    };

    const docRef = await addDoc(scheduledExerciseRef, {
      ...scheduledNote,
      scheduledDateTime: Timestamp.fromDate(scheduledDateTime),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...scheduledNote
    };
  } catch (error) {
    console.error('Error scheduling note:', error);
    throw error;
  }
}; 