import { collection, getDocs, addDoc, query, where, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const getSections = async (userId) => {
  try {
    const sectionsRef = collection(db, 'sections');
    const q = query(sectionsRef, where('userId', '==', userId));
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

export const createSection = async ({ userId, title, description, activities }) => {
  try {
    const sectionsRef = collection(db, 'sections');
    const docRef = await addDoc(sectionsRef, {
      userId,
      title,
      description,
      activities,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating section:', error);
    throw error;
  }
};

export const scheduleSection = async (userId, section, date, timeOfDay) => {
  try {
    const batch = writeBatch(db);
    const scheduledExercisesRef = collection(db, 'scheduledExercises');

    // Create the main section entry
    const sectionEntry = {
      userId,
      scheduledDateTime: date,
      type: 'section',
      exerciseTitle: section.title,
      description: section.description || '',
      status: 'scheduled',
      metrics: {
        completed: false,
        timeOfDay: timeOfDay || 'Unscheduled',
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      sectionId: section.id,
      activities: section.activities,  // Store all activities in the section entry
      isSection: true  // Flag to identify this as a section entry
    };

    const sectionDocRef = doc(scheduledExercisesRef);
    batch.set(sectionDocRef, sectionEntry);

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error scheduling section:', error);
    throw error;
  }
}; 