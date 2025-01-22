import { 
  collection, 
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: {
    name: string;
    ref: any;
  };
  primaryMuscleGroup: {
    name: string;
    ref: any;
  };
  equipment: {
    [key: string]: {
      name: string;
      ref: any;
    };
  };
  duration?: string;
  difficulty?: string;
  title?: string; // Adding title field as it might be used instead of name
}

export const getExercises = async (): Promise<Exercise[]> => {
  try {
    // Get all exercises
    const exercisesRef = collection(db, 'exercises');
    const exercisesSnapshot = await getDocs(exercisesRef);
    const exercises = exercisesSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Exercise data:', { id: doc.id, ...data }); // Debug log
      return {
        id: doc.id,
        ...data,
        name: data.title || data.name // Use title as fallback for name
      };
    }) as Exercise[];

    // Collect all unique references
    const refs = new Set<string>();
    exercises.forEach(exercise => {
      if (exercise.type?.ref?.path) refs.add(exercise.type.ref.path);
      if (exercise.primaryMuscleGroup?.ref?.path) refs.add(exercise.primaryMuscleGroup.ref.path);
      if (exercise.equipment) {
        Object.values(exercise.equipment).forEach(equip => {
          if (equip?.ref?.path) refs.add(equip.ref.path);
        });
      }
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
    const enrichedExercises = exercises.map(exercise => {
      const enrichedExercise = {
        ...exercise,
        type: exercise.type?.ref?.path ? {
          ...exercise.type,
          ...refsMap.get(exercise.type.ref.path)
        } : exercise.type,
        primaryMuscleGroup: exercise.primaryMuscleGroup?.ref?.path ? {
          ...exercise.primaryMuscleGroup,
          ...refsMap.get(exercise.primaryMuscleGroup.ref.path)
        } : exercise.primaryMuscleGroup,
        equipment: {}
      };

      // Enrich equipment data
      if (exercise.equipment) {
        Object.entries(exercise.equipment).forEach(([key, value]) => {
          if (value?.ref?.path) {
            enrichedExercise.equipment[key] = {
              ...value,
              ...refsMap.get(value.ref.path)
            };
          } else {
            enrichedExercise.equipment[key] = value;
          }
        });
      }

      console.log('Enriched exercise:', enrichedExercise); // Debug log
      return enrichedExercise;
    });

    return enrichedExercises;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
}; 