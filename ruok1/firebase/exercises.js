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
    // Get all exercises
    const exercisesRef = collection(db, 'exercises');
    const exercisesSnapshot = await getDocs(exercisesRef);
    const exercises = exercisesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Collect all unique references
    const refs = new Set();
    exercises.forEach(exercise => {
      refs.add(exercise.type.ref.path);
      refs.add(exercise.primaryMuscleGroup.ref.path);
      Object.values(exercise.equipment).forEach(equip => {
        refs.add(equip.ref.path);
      });
    });

    // Fetch all references in parallel
    const refsData = await Promise.all(
      Array.from(refs).map(async refPath => {
        const docRef = doc(db, refPath);
        const docSnap = await getDoc(docRef);
        return {
          path: refPath,
          data: docSnap.data()
        };
      })
    );

    // Create a map of reference data
    const refsMap = new Map(
      refsData.map(({ path, data }) => [path, data])
    );

    // Merge reference data with exercises
    return exercises.map(exercise => {
      const typePath = exercise.type.ref.path;
      const muscleGroupPath = exercise.primaryMuscleGroup.ref.path;

      const enrichedExercise = {
        ...exercise,
        type: {
          ...exercise.type,
          ...refsMap.get(typePath)
        },
        primaryMuscleGroup: {
          ...exercise.primaryMuscleGroup,
          ...refsMap.get(muscleGroupPath)
        },
        equipment: {}
      };

      // Enrich equipment data
      Object.entries(exercise.equipment).forEach(([key, value]) => {
        const equipPath = value.ref.path;
        enrichedExercise.equipment[key] = {
          ...value,
          ...refsMap.get(equipPath)
        };
      });

      return enrichedExercise;
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
}; 