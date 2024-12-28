import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
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

export const scheduleSection = async ({ userId, sectionId, scheduledDate }) => {
  try {
    const section = await getSectionById(sectionId);
    if (!section) throw new Error('Section not found');

    const scheduledActivitiesRef = collection(db, 'scheduledActivities');
    const activities = section.activities.map(activity => ({
      userId,
      activityId: activity.id,
      activityType: activity.type,
      scheduledDate,
      config: activity.config,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }));

    // Schedule all activities in parallel
    await Promise.all(
      activities.map(activity => addDoc(scheduledActivitiesRef, activity))
    );

    return true;
  } catch (error) {
    console.error('Error scheduling section:', error);
    throw error;
  }
}; 