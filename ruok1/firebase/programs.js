import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

// Structure in Firestore:
// users/{userId}/programs/{programId}
//   - name
//   - description
//   - startDate
//   - endDate
//   - schedule: {
//       monday: [{exerciseId, sets, reps, etc}],
//       tuesday: [...],
//       etc.
//     }

export const createUserProgram = async (userId, programData) => {
  try {
    const programRef = collection(db, 'users', userId, 'programs');
    await addDoc(programRef, {
      ...programData,
      createdAt: serverTimestamp(),
      schedule: programData.schedule || {},
    });
  } catch (error) {
    console.error('Error creating program:', error);
    throw error;
  }
};

// Get today's scheduled exercises
export const getTodaysTraining = async (userId) => {
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
    const programsRef = collection(db, 'users', userId, 'programs');
    const snapshot = await getDocs(programsRef);
    
    let todaysExercises = [];
    snapshot.docs.forEach(doc => {
      const program = doc.data();
      if (program.schedule && program.schedule[today]) {
        todaysExercises = [...todaysExercises, ...program.schedule[today].map(exercise => ({
          ...exercise,
          programId: doc.id,
          programName: program.name
        }))];
      }
    });
    
    return todaysExercises;
  } catch (error) {
    console.error('Error getting today\'s training:', error);
    throw error;
  }
};

// Add exercise to program schedule
export const addExerciseToProgram = async (userId, programId, exerciseData, dayOfWeek) => {
  try {
    const programRef = doc(db, 'users', userId, 'programs', programId);
    const program = await getDoc(programRef);
    
    if (!program.exists()) throw new Error('Program not found');
    
    const schedule = program.data().schedule || {};
    schedule[dayOfWeek] = [...(schedule[dayOfWeek] || []), exerciseData];
    
    await updateDoc(programRef, { schedule });
  } catch (error) {
    console.error('Error adding exercise to program:', error);
    throw error;
  }
}; 