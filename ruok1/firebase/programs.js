import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp, 
  addDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';

// Rename to be more accurate
export const addExerciseToDate = async (userId, exercise, date) => {
  try {
    // Format date as YYYY-MM-DD using local time
    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('Date debugging:', {
      originalDate: date,
      localDate: localDate,
      formattedDate: dateString,
      dateComponents: { year, month, day }
    });
    
    const dateRef = doc(db, 'users', userId, 'training', dateString);

    // Create the exercise data
    const exerciseData = {
      id: exercise.id,
      title: exercise.title,
      type: exercise.category?.toLowerCase() || 'exercise',
      addedAt: new Date().toISOString(),
      tracking: exercise.tracking || null,
      icon: exercise.icon || null,
      completed: false
    };

    console.log('About to save exercise...');
    
    await setDoc(dateRef, {
      exercises: [exerciseData]
    });

    console.log('Exercise saved successfully!');

    const verification = await getDoc(dateRef);
    console.log('Verification read:', verification.exists(), verification.data());

    return exerciseData;
  } catch (error) {
    console.error('Detailed error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      userId: userId,
      date: dateString
    });
    throw error;
  }
};

// Update to get exercises for any date
export const getExercisesForDate = async (userId, date) => {
  try {
    // Format date as YYYY-MM-DD using local time
    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const dateRef = doc(db, 'users', userId, 'training', dateString);
    const snapshot = await getDoc(dateRef);

    if (!snapshot.exists()) {
      return [];
    }

    return snapshot.data().exercises || [];
  } catch (error) {
    console.error('Error getting exercises:', error);
    return [];
  }
}; 