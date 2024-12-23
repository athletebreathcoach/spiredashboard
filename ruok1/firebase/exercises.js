import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';

// Get all preset exercises
export const getPresetExercises = async () => {
  try {
    const exercisesRef = collection(db, 'exercises');
    const snapshot = await getDocs(exercisesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting preset exercises:', error);
    throw error;
  }
};

// Get user's saved exercises
export const getUserSavedExercises = async (userId) => {
  try {
    const savedRef = collection(db, 'users', userId, 'savedExercises');
    const snapshot = await getDocs(savedRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting saved exercises:', error);
    throw error;
  }
};

// Save an exercise to user's saved collection
export const saveExercise = async (userId, exerciseId, source = 'preset') => {
  try {
    const savedRef = collection(db, 'users', userId, 'savedExercises');
    await addDoc(savedRef, {
      exerciseId,
      source,
      savedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving exercise:', error);
    throw error;
  }
};

// Remove exercise from saved collection
export const unsaveExercise = async (userId, savedId) => {
  try {
    const docRef = doc(db, 'users', userId, 'savedExercises', savedId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error removing saved exercise:', error);
    throw error;
  }
};

// Get all exercises with their references
export const getExercises = async () => {
  try {
    const exercisesRef = collection(db, 'exercises');
    const snapshot = await getDocs(exercisesRef);
    const exercises = [];
    
    for (const doc of snapshot.docs) {
      const exercise = {
        id: doc.id,
        ...doc.data()
      };
      
      // Get the referenced documents
      const typeDoc = await getDoc(exercise.type.ref);
      const muscleGroupDoc = await getDoc(exercise.primaryMuscleGroup.ref);
      
      // Add the referenced data
      exercise.type = {
        ...exercise.type,
        ...typeDoc.data()
      };
      exercise.primaryMuscleGroup = {
        ...exercise.primaryMuscleGroup,
        ...muscleGroupDoc.data()
      };
      
      // Add equipment data
      const equipmentData = {};
      for (const [key, value] of Object.entries(exercise.equipment)) {
        const equipDoc = await getDoc(value.ref);
        equipmentData[key] = {
          ...value,
          ...equipDoc.data()
        };
      }
      exercise.equipment = equipmentData;
      
      exercises.push(exercise);
    }
    
    return exercises;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
}; 