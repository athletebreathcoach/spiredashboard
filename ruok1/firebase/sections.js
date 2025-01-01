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

// Add this helper function to generate superset IDs
const generateSupersetId = (activities) => {
  const existingSets = new Set(activities
    .filter(a => a.supersetId)
    .map(a => a.supersetId.charAt(0)));
  
  let letter = 'A';
  while (existingSets.has(letter)) {
    letter = String.fromCharCode(letter.charCodeAt(0) + 1);
  }
  
  const activitiesInSet = activities
    .filter(a => a.supersetId?.startsWith(letter))
    .length;
  
  return `${letter}${activitiesInSet + 1}`;
};

export const createSection = async (sectionData) => {
  try {
    const { activities, ...sectionInfo } = sectionData;
    
    // Process activities to include proper superset IDs
    const processedActivities = activities.map((activityGroup) => {
      // Track current superset letter for this group
      let currentSupersetLetter = 'A';
      let currentSupersetCount = 0;
      
      const processedItems = activityGroup.items.map((item) => {
        const processed = { ...item };
        
        // Handle superset ID generation
        if (item.supersetWith !== null && item.supersetWith !== undefined) {
          if (currentSupersetCount === 0) {
            // Start a new superset group
            currentSupersetCount = 1;
            processed.supersetId = `${currentSupersetLetter}${currentSupersetCount}`;
          } else {
            // Continue current superset group
            currentSupersetCount++;
            processed.supersetId = `${currentSupersetLetter}${currentSupersetCount}`;
          }
          // Remove old superset fields
          delete processed.supersetWith;
          delete processed.supersetIndex;
        } else {
          // Not part of a superset, reset counters and move to next letter
          if (currentSupersetCount > 0) {
            currentSupersetLetter = String.fromCharCode(currentSupersetLetter.charCodeAt(0) + 1);
            currentSupersetCount = 0;
          }
          // Ensure no superset fields exist
          delete processed.supersetId;
          delete processed.supersetWith;
          delete processed.supersetIndex;
        }
        
        return processed;
      });
      
      return {
        ...activityGroup,
        items: processedItems
      };
    });

    const sectionsRef = collection(db, 'sections');
    const docRef = await addDoc(sectionsRef, {
      userId: sectionInfo.userId,
      title: sectionInfo.title,
      description: sectionInfo.description,
      activities: processedActivities,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: sectionInfo.createdBy,
      assignedBy: sectionInfo.createdBy,
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
      isParent: true
    };

    const sectionDocRef = doc(scheduledExercisesRef);
    batch.set(sectionDocRef, sectionEntry);

    // Process activities to maintain superset relationships
    for (const activityGroup of section.activities) {
      if (!activityGroup.items) continue;

      // Track current superset letter
      let currentSupersetLetter = 'A';
      let currentSupersetCount = 0;

      for (const item of activityGroup.items) {
        if (!item.title) continue;

        // Handle superset ID generation
        let supersetId = null;
        if (item.supersetId) {
          // If item already has a supersetId, use it
          supersetId = item.supersetId;
        } else if (item.supersetWith !== null && item.supersetWith !== undefined) {
          // If this is a new superset relationship
          if (currentSupersetCount === 0) {
            // Start a new superset group
            currentSupersetCount = 1;
            supersetId = `${currentSupersetLetter}${currentSupersetCount}`;
          } else {
            // Continue current superset group
            currentSupersetCount++;
            supersetId = `${currentSupersetLetter}${currentSupersetCount}`;
          }
        } else {
          // Not part of a superset, reset counters and move to next letter
          if (currentSupersetCount > 0) {
            currentSupersetLetter = String.fromCharCode(currentSupersetLetter.charCodeAt(0) + 1);
            currentSupersetCount = 0;
          }
        }

        // Create the scheduled exercise
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
          sectionId: sectionDocRef.id,
          parentSectionId: section.id,
          sectionTitle: section.title,
          activityId: item.id,
          ...(item.exerciseId && { exerciseId: item.exerciseId }),
          ...(supersetId && { supersetId }) // Add supersetId if it exists
        };

        const newDocRef = doc(scheduledExercisesRef);
        batch.set(newDocRef, scheduledExercise);
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