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
    
    // Destructure supersetId and other options
    const { timeOfDay, metrics, supersetId, ...restOptions } = options;
    
    const scheduledExercise = {
      exerciseId,
      userId,
      exerciseTitle: exercise.title,
      exerciseType: exercise.type,
      scheduledDateTime,
      status: 'scheduled',
      metrics: {
        ...(metrics || {}),
        timeOfDay: timeOfDay || 'anytime',
      },
      // Add supersetId if it exists
      ...(supersetId && { supersetId }),
      clientComments: '',
      coachNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      ...restOptions
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

// Unschedule an exercise (remove it from calendar)
export const deleteScheduledExercise = async (exerciseId) => {
  try {
    const exerciseRef = doc(db, 'scheduledExercises', exerciseId);
    
    // First, check if this is a section
    const exerciseDoc = await getDoc(exerciseRef);
    if (!exerciseDoc.exists()) {
      throw new Error('Exercise not found');
    }

    const exerciseData = exerciseDoc.data();
    
    // If it's a section, unschedule all related exercises
    if (exerciseData.type === 'section' || exerciseData.isParent) {
      const exercisesRef = collection(db, 'scheduledExercises');
      const q = query(exercisesRef, where('sectionId', '==', exerciseId));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      
      // Unschedule the section itself
      batch.update(exerciseRef, {
        scheduledDateTime: null,
        'metrics.timeOfDay': null
      });

      // Unschedule all related exercises
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          scheduledDateTime: null,
          'metrics.timeOfDay': null
        });
      });
      
      await batch.commit();
    } else {
      // For regular exercises, just unschedule the single document
      await updateDoc(exerciseRef, {
        scheduledDateTime: null,
        'metrics.timeOfDay': null
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error unscheduling exercise:', error);
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
    console.log('Scheduling breath protocol with dates:', {
      inputDate: scheduledDateTime,
      inputDateISO: scheduledDateTime.toISOString(),
    });

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
    
    // Use the date as-is since we've already set it correctly in BreathGuide
    const date = scheduledDateTime;
    
    console.log('Using provided date:', {
      date: date,
      dateISO: date.toISOString(),
      dateLocale: date.toLocaleString(),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    });

    const scheduledProtocol = {
      protocolId,
      userId,
      exerciseTitle: protocol.title,
      type: 'breathProtocol',
      scheduledDateTime: date,
      status: 'scheduled',
      metrics: {
        completed: false,
        duration: protocol.duration || '5:00',
        rounds: protocol.rounds || 10,
        timeOfDay: options.metrics?.timeOfDay || 'Anytime',
      },
      protocol: {
        ...protocol,
        pattern,
      },
      clientComments: '',
      coachNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      ...options
    };

    console.log('Final scheduled protocol date:', {
      scheduledDateTime: scheduledProtocol.scheduledDateTime,
      scheduledDateTimeISO: scheduledProtocol.scheduledDateTime.toISOString(),
      timeOfDay: scheduledProtocol.metrics.timeOfDay,
      year: scheduledProtocol.scheduledDateTime.getFullYear(),
      month: scheduledProtocol.scheduledDateTime.getMonth() + 1,
      day: scheduledProtocol.scheduledDateTime.getDate()
    });

    const docRef = await addDoc(scheduledExerciseRef, scheduledProtocol);
    return { id: docRef.id, ...scheduledProtocol };
  } catch (error) {
    console.error('Error scheduling breath protocol:', error);
    throw error;
  }
};

// Schedule a breath test
export const scheduleBreathTest = async (userId, testId, scheduledDateTime, options = {}) => {
  try {
    console.log('Scheduling breath test with dates:', {
      inputDate: scheduledDateTime,
      inputDateISO: scheduledDateTime.toISOString(),
    });

    const testRef = doc(db, 'breathingTests', testId);
    const testDoc = await getDoc(testRef);
    
    if (!testDoc.exists()) {
      throw new Error('Breath test not found');
    }

    const test = testDoc.data();
    const scheduledExerciseRef = collection(db, 'scheduledExercises');
    
    // Use the date as-is since we'll set it correctly in the UI
    const date = scheduledDateTime;
    
    console.log('Using provided date:', {
      date: date,
      dateISO: date.toISOString(),
      dateLocale: date.toLocaleString(),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    });

    const scheduledTest = {
      testId,
      userId,
      exerciseTitle: test.title,
      type: 'breathTest',
      scheduledDateTime: date,
      status: 'scheduled',
      metrics: {
        completed: false,
        timeOfDay: options.metrics?.timeOfDay || 'Anytime',
      },
      test: {
        ...test,
      },
      clientComments: '',
      coachNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      ...options
    };

    console.log('Final scheduled test date:', {
      scheduledDateTime: scheduledTest.scheduledDateTime,
      scheduledDateTimeISO: scheduledTest.scheduledDateTime.toISOString(),
      timeOfDay: scheduledTest.metrics.timeOfDay,
      year: scheduledTest.scheduledDateTime.getFullYear(),
      month: scheduledTest.scheduledDateTime.getMonth() + 1,
      day: scheduledTest.scheduledDateTime.getDate()
    });

    const docRef = await addDoc(scheduledExerciseRef, scheduledTest);
    return { id: docRef.id, ...scheduledTest };
  } catch (error) {
    console.error('Error scheduling breath test:', error);
    throw error;
  }
};

// Schedule a section
export const scheduleSection = async (userId, section, scheduledDateTime, timeOfDay) => {
  try {
    const batch = writeBatch(db);

    // Create a new section document
    const sectionRef = doc(collection(db, 'scheduledExercises'));
    const sectionId = sectionRef.id;

    // Prepare the section data
    const scheduledSection = {
      id: sectionId,
      userId,
      title: section.title,
      description: section.description || '',
      type: 'section',
      isParent: true,
      sectionType: section.type || 'standard',
      scheduledDateTime: scheduledDateTime,
      metrics: {
        timeOfDay: timeOfDay || 'anytime',
        completed: false
      },
      settings: section.settings || {},
      templateId: section.templateId || section.id,
      createdAt: serverTimestamp()
    };

    // Set the section document
    batch.set(sectionRef, scheduledSection);

    // Schedule each activity in the section
    if (section.activities && Array.isArray(section.activities)) {
      section.activities.forEach((activity, index) => {
        const activityRef = doc(collection(db, 'scheduledExercises'));
        const activityData = {
          id: activityRef.id,
          userId,
          title: activity.title,
          description: activity.description || '',
          type: activity.type || 'exercise',
          sectionId: sectionId,
          sectionTitle: section.title,
          scheduledDateTime: scheduledDateTime,
          order: activity.order || index,  // Preserve existing order or use index
          metrics: {
            ...(activity.metrics || {}),
            timeOfDay: timeOfDay || 'anytime',
            completed: false
          },
          templateId: activity.id,
          createdAt: serverTimestamp()
        };
        batch.set(activityRef, activityData);
      });
    }

    // Commit all the changes
    await batch.commit();

    console.log('Final scheduled section:', {
      id: sectionId,
      scheduledDateTime: scheduledSection.scheduledDateTime,
      scheduledDateTimeISO: scheduledSection.scheduledDateTime.toISOString(),
      timeOfDay: scheduledSection.metrics.timeOfDay,
      type: scheduledSection.sectionType,
      activitiesCount: section.activities?.length || 0
    });

    return { 
      id: sectionId,
      ...scheduledSection,
      activities: section.activities?.map((activity, index) => ({
        ...activity,
        order: activity.order || index  // Ensure order is included in returned data
      })) || []
    };
  } catch (error) {
    console.error('Error scheduling section:', error);
    throw error;
  }
};

// Update section progress
export const updateSectionProgress = async (sectionId, exerciseUpdates, sectionMetrics = {}) => {
  try {
    const sectionRef = doc(db, 'scheduledExercises', sectionId);
    const sectionDoc = await getDoc(sectionRef);
    
    if (!sectionDoc.exists()) {
      throw new Error('Section not found');
    }

    const section = sectionDoc.data();
    
    // Update individual exercise metrics
    const updatedExercises = section.exercises.map(exercise => {
      const update = exerciseUpdates[exercise.id];
      if (update) {
        return {
          ...exercise,
          metrics: {
            ...exercise.metrics,
            ...update
          }
        };
      }
      return exercise;
    });

    // Update section
    await updateDoc(sectionRef, {
      exercises: updatedExercises,
      ...(sectionMetrics && {
        sectionMetrics: {
          ...section.sectionMetrics,
          ...sectionMetrics
        }
      }),
      updatedAt: serverTimestamp(),
      // Check if all exercises are completed
      status: updatedExercises.every(ex => ex.metrics.completed) ? 'completed' : 'in_progress'
    });

    return true;
  } catch (error) {
    console.error('Error updating section progress:', error);
    throw error;
  }
};

// Get section with exercises
export const getScheduledSection = async (sectionId) => {
  try {
    const sectionRef = doc(db, 'scheduledExercises', sectionId);
    const sectionDoc = await getDoc(sectionRef);
    
    if (!sectionDoc.exists()) {
      throw new Error('Section not found');
    }

    return {
      id: sectionDoc.id,
      ...sectionDoc.data()
    };
  } catch (error) {
    console.error('Error getting scheduled section:', error);
    throw error;
  }
};

// Add helper function to get superset exercises
export const getSupersetExercises = async (userId, supersetId) => {
  try {
    const q = query(
      collection(db, 'scheduledExercises'),
      where('userId', '==', userId),
      where('supersetId', '==', supersetId),
      orderBy('supersetId', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting superset exercises:', error);
    throw error;
  }
};

// Add helper function to get all exercises in a superset group
export const getSupersetGroup = async (userId, supersetLetter) => {
  try {
    const q = query(
      collection(db, 'scheduledExercises'),
      where('userId', '==', userId),
      where('supersetId', '>=', `${supersetLetter}1`),
      where('supersetId', '<=', `${supersetLetter}9`),
      orderBy('supersetId', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting superset group:', error);
    throw error;
  }
};

// Update metrics for all exercises in a superset
export const updateSupersetMetrics = async (userId, supersetLetter, metricsUpdate) => {
  try {
    const exercises = await getSupersetGroup(userId, supersetLetter);
    const batch = writeBatch(db);
    
    exercises.forEach(exercise => {
      const exerciseRef = doc(db, 'scheduledExercises', exercise.id);
      batch.update(exerciseRef, { 
        metrics: {
          ...exercise.metrics,
          ...metricsUpdate
        },
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error updating superset metrics:', error);
    throw error;
  }
};

// Update section metrics when logging
export const updateSectionMetrics = async (scheduledSectionId, metrics) => {
  try {
    const sectionRef = doc(db, 'scheduledExercises', scheduledSectionId);
    
    await updateDoc(sectionRef, {
      metrics: {
        ...metrics,
        completed: true
      },
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error updating section metrics:', error);
    throw error;
  }
};