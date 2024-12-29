import { collection, getDocs, addDoc, query, where, writeBatch, doc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
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
      createdBy: section.createdBy || userId,
      assignedBy: section.assignedBy,
      sectionId: section.id,
      activities: section.activities,
      isSection: true
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