import { collection, getDocs, addDoc, query, where, writeBatch, doc, serverTimestamp, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
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

export const createSection = async ({ userId, title, description, activities, createdBy }) => {
  try {
    const sectionsRef = collection(db, 'sections');
    const docRef = await addDoc(sectionsRef, {
      userId,
      title,
      description,
      activities,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
      assignedBy: createdBy,
      assignedAt: new Date().toISOString(),
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating section:', error);
    throw error;
  }
};

export const updateSection = async (sectionId, { title, description, activities, updatedBy }) => {
  try {
    const sectionRef = doc(db, 'sections', sectionId);
    await updateDoc(sectionRef, {
      title,
      description,
      activities,
      updatedAt: new Date().toISOString(),
      updatedBy
    });
    return true;
  } catch (error) {
    console.error('Error updating section:', error);
    throw error;
  }
};

export const assignSectionToClient = async (sectionId, clientId, coachId) => {
  try {
    const sectionRef = doc(db, 'sections', sectionId);
    const sectionDoc = await getDoc(sectionRef);
    
    if (!sectionDoc.exists()) {
      throw new Error('Section not found');
    }

    const sectionData = sectionDoc.data();
    
    const clientSectionRef = await addDoc(collection(db, 'sections'), {
      ...sectionData,
      userId: clientId,
      createdBy: coachId,
      assignedBy: coachId,
      assignedAt: new Date().toISOString(),
      templateId: sectionId,
      status: 'active',
      updatedAt: new Date().toISOString()
    });

    return clientSectionRef.id;
  } catch (error) {
    console.error('Error assigning section to client:', error);
    throw error;
  }
};

export const scheduleSection = async (userId, section, date, timeOfDay) => {
  try {
    const batch = writeBatch(db);
    const scheduledExercisesRef = collection(db, 'scheduledExercises');

    // First, create the section entry
    const sectionEntry = {
      userId,
      scheduledDateTime: date,
      type: 'section',
      exerciseTitle: section.title,
      title: section.title,
      description: section.description || '',
      status: 'scheduled',
      metrics: {
        completed: false,
        timeOfDay: timeOfDay || 'Unscheduled',
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: section.createdBy || userId,
      assignedBy: section.assignedBy,
      sectionId: section.id,
      isSection: true,
      isParent: true // Mark this as the parent section
    };

    const sectionDocRef = doc(scheduledExercisesRef);
    batch.set(sectionDocRef, sectionEntry);

    // Then, create entries for each activity in the section
    for (const activityGroup of section.activities) {
      if (!activityGroup.items) continue;

      // Keep track of superset groups
      const supersetGroups = new Map();

      for (const item of activityGroup.items) {
        if (!item.title) continue;

        // Create the base exercise document
        const scheduledExercise = {
          userId,
          scheduledDateTime: date,
          type: item.type || 'exercise',
          exerciseTitle: item.title,
          title: item.title,
          description: item.description || '',
          status: 'scheduled',
          metrics: {
            ...(item.metrics || {}),
            completed: false,
            timeOfDay: timeOfDay || 'Unscheduled'
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId,
          sectionId: sectionDocRef.id, // Use the new section doc ID
          parentSectionId: section.id, // Keep original section ID for reference
          sectionTitle: section.title,
          activityId: item.id
        };

        // Only add exerciseId if it exists
        if (item.exerciseId) {
          scheduledExercise.exerciseId = item.exerciseId;
        }

        // Only add superset info if it exists
        if (item.supersetIndex !== undefined && item.supersetIndex !== null) {
          scheduledExercise.supersetIndex = item.supersetIndex;
        }
        if (item.supersetWith !== undefined && item.supersetWith !== null) {
          scheduledExercise.supersetWith = item.supersetWith;
        }

        const newDocRef = doc(scheduledExercisesRef);
        batch.set(newDocRef, scheduledExercise);

        // Track this exercise if it's part of a superset
        if (item.supersetWith !== null && item.supersetWith !== undefined) {
          if (!supersetGroups.has(item.supersetWith)) {
            supersetGroups.set(item.supersetWith, []);
          }
          supersetGroups.get(item.supersetWith).push(newDocRef.id);
        }
      }
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error scheduling section:', error);
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