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
  serverTimestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { getHabitTaskById } from './habits';

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
export const updateExerciseMetrics = async (exerciseId, metrics) => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', exerciseId);
    await updateDoc(exerciseRef, { metrics });
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

// Delete a scheduled exercise
export const deleteScheduledExercise = async (exerciseId) => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', exerciseId);
    await deleteDoc(exerciseRef);
    return true;
  } catch (error) {
    console.error('Error deleting scheduled exercise:', error);
    throw error;
  }
};

// Schedule a habit
export const scheduleHabit = async (userId, habitId, scheduledDateTime, options = {}) => {
  try {
    const habit = await getHabitTaskById(habitId);
    
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    const scheduledHabit = {
      habitId: habitId,
      userId,
      exerciseTitle: habit.title,
      type: 'habit',
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        completed: false,
        streak: 0,
      },
      clientComments: '',
      coachNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      ...options
    };

    const docRef = await addDoc(scheduledExerciseRef, scheduledHabit);
    return { id: docRef.id, ...scheduledHabit };
  } catch (error) {
    console.error('Error scheduling habit:', error);
    throw error;
  }
};

// Schedule a task
export const scheduleTask = async (userId, taskId, scheduledDateTime, options = {}) => {
  try {
    const task = await getHabitTaskById(taskId);
    
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    const scheduledTask = {
      taskId: taskId,
      userId,
      exerciseTitle: task.title,
      type: 'task',
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        completed: false,
        priority: task.priority || 'medium',
      },
      clientComments: '',
      coachNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      ...options
    };

    const docRef = await addDoc(scheduledExerciseRef, scheduledTask);
    return { id: docRef.id, ...scheduledTask };
  } catch (error) {
    console.error('Error scheduling task:', error);
    throw error;
  }
};

// Update habit completion status
export const updateHabitStatus = async (scheduledExerciseId, completed) => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', scheduledExerciseId);
    
    await updateDoc(exerciseRef, {
      'metrics.completed': completed,
      status: completed ? 'completed' : 'scheduled',
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating habit status:', error);
    throw error;
  }
};

// Update task completion status
export const updateTaskStatus = async (scheduledExerciseId, completed) => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', scheduledExerciseId);
    
    await updateDoc(exerciseRef, {
      'metrics.completed': completed,
      status: completed ? 'completed' : 'scheduled',
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

// Schedule a breath protocol
export const scheduleBreathProtocol = async (userId, protocolId, scheduledDateTime, options = {}) => {
  try {
    const protocolRef = doc(db, 'breathProtocols', protocolId);
    const protocolDoc = await getDoc(protocolRef);
    
    if (!protocolDoc.exists()) {
      throw new Error('Breath protocol not found');
    }

    const protocol = protocolDoc.data();
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    const scheduledProtocol = {
      protocolId,
      userId,
      exerciseTitle: protocol.title,
      type: 'breathProtocol',
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        completed: false,
        duration: protocol.duration || null,
        rounds: protocol.rounds || null,
        breathHold: protocol.breathHold || null,
        recovery: protocol.recovery || null,
        timeOfDay: '',
      },
      protocol: {
        ...protocol,  // Include all protocol data for auto-population
      },
      clientComments: '',
      coachNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      ...options
    };

    const docRef = await addDoc(scheduledExerciseRef, scheduledProtocol);
    return { id: docRef.id, ...scheduledProtocol };
  } catch (error) {
    console.error('Error scheduling breath protocol:', error);
    throw error;
  }
};

export const scheduleSection = async (userId, section, date, timeOfDay) => {
  try {
    const batch = writeBatch(db);
    const scheduledExercisesRef = collection(db, 'scheduledExercises');

    console.log('Scheduling section:', section);

    // Iterate through each activity group (exercises, habitstasks, guidedSessions)
    for (const activityGroup of section.activities) {
      // Each activity group has an items array
      if (!activityGroup.items) {
        console.error('Activity group missing items:', activityGroup);
        continue;
      }

      for (const item of activityGroup.items) {
        if (!item.title) {
          console.error('Item missing title:', item);
          continue;
        }

        const scheduledExercise = {
          userId,
          scheduledDateTime: date,
          type: item.type,
          exerciseTitle: item.title,
          description: item.description || '',
          status: 'scheduled',
          metrics: {
            completed: false,
            timeOfDay: timeOfDay || 'Unscheduled',
            ...(item.metrics || {})
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId,
          sectionId: section.id,
          sectionTitle: section.title,
          activityId: item.id // Store the original activity ID
        };

        // Only add data field if it exists
        if (item.data) {
          scheduledExercise.data = item.data;
        }

        const newDocRef = doc(scheduledExercisesRef);
        batch.set(newDocRef, scheduledExercise);
      }
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error scheduling section:', error);
    throw error;
  }
};