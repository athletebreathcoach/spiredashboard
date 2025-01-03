import { collection, getDocs, addDoc, query, where, doc, serverTimestamp, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const getSections = async (userId, type = null) => {
  try {
    const sectionsRef = collection(db, 'sections');
    let q;
    
    if (type) {
      // If type is provided, filter by both userId and type
      q = query(sectionsRef, 
        where('userId', '==', userId),
        where('type', '==', type)
      );
    } else {
      // If no type provided, just filter by userId
      q = query(sectionsRef, where('userId', '==', userId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting sections:', error);
    throw error;
  }
};

export const createSection = async (sectionData) => {
  try {
    const { exercises, type, settings, ...sectionInfo } = sectionData;
    
    // Validate section type
    if (!['standard', 'forTime', 'amrap', 'chipper', 'intervals'].includes(type)) {
      throw new Error('Invalid section type');
    }

    // Process exercises to ensure they have required fields
    const processedExercises = exercises.map(exercise => ({
      id: exercise.id,
      title: exercise.title,
      description: exercise.description || '',
      metrics: {
        reps: exercise.metrics?.reps || null,
        weight: exercise.metrics?.weight || null,
        distance: exercise.metrics?.distance || null,
        duration: exercise.metrics?.duration || null,
        target: exercise.metrics?.target || null
      }
    }));

    const sectionsRef = collection(db, 'sections');
    const docRef = await addDoc(sectionsRef, {
      userId: sectionInfo.userId,
      title: sectionInfo.title,
      description: sectionInfo.description || '',
      type,
      settings: {
        rounds: settings?.rounds || null,
        timeLimit: settings?.timeLimit || null,
        workInterval: settings?.workInterval || null,
        restInterval: settings?.restInterval || null,
        sets: settings?.sets || null
      },
      exercises: processedExercises,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: sectionInfo.createdBy
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating section:', error);
    throw error;
  }
};

export const updateSection = async (sectionId, updateData) => {
  try {
    const { exercises, type, settings, ...sectionInfo } = updateData;
    const sectionRef = doc(db, 'sections', sectionId);

    const updates = {
      ...sectionInfo,
      updatedAt: serverTimestamp()
    };

    if (exercises) {
      updates.exercises = exercises.map(exercise => ({
        id: exercise.id,
        title: exercise.title,
        description: exercise.description || '',
        metrics: {
          reps: exercise.metrics?.reps || null,
          weight: exercise.metrics?.weight || null,
          distance: exercise.metrics?.distance || null,
          duration: exercise.metrics?.duration || null,
          target: exercise.metrics?.target || null
        }
      }));
    }

    if (type) {
      if (!['standard', 'forTime', 'amrap', 'chipper', 'intervals'].includes(type)) {
        throw new Error('Invalid section type');
      }
      updates.type = type;
    }

    if (settings) {
      updates.settings = {
        rounds: settings.rounds || null,
        timeLimit: settings.timeLimit || null,
        workInterval: settings.workInterval || null,
        restInterval: settings.restInterval || null,
        sets: settings.sets || null
      };
    }

    await updateDoc(sectionRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating section:', error);
    throw error;
  }
};

export const deleteSection = async (sectionId) => {
  try {
    const sectionRef = doc(db, 'sections', sectionId);
    await deleteDoc(sectionRef);
    return true;
  } catch (error) {
    console.error('Error deleting section:', error);
    throw error;
  }
}; 