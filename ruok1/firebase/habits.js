import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

// Get all available habits
export const getHabits = async () => {
  try {
    const habitsRef = collection(db, 'habitstasks');
    const q = query(
      habitsRef,
      where('type', '==', 'habit'),
      orderBy('title')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting habits:', error);
    throw error;
  }
};

// Get all available tasks
export const getTasks = async () => {
  try {
    const tasksRef = collection(db, 'habitstasks');
    const q = query(
      tasksRef,
      where('type', '==', 'task'),
      orderBy('title')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

// Get a specific habit or task by ID
export const getHabitTaskById = async (itemId) => {
  try {
    const doc = await getDoc(doc(db, 'habitstasks', itemId));
    if (!doc.exists()) {
      throw new Error('Item not found');
    }
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting habit/task:', error);
    throw error;
  }
};

// Get habits by category
export const getHabitsByCategory = async (categoryId) => {
  try {
    const itemsRef = collection(db, 'habitstasks');
    const q = query(
      itemsRef,
      where('type', '==', 'habit'),
      where('categoryId', '==', categoryId),
      orderBy('title')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting habits by category:', error);
    throw error;
  }
};

// Get tasks by category
export const getTasksByCategory = async (categoryId) => {
  try {
    const itemsRef = collection(db, 'habitstasks');
    const q = query(
      itemsRef,
      where('type', '==', 'task'),
      where('categoryId', '==', categoryId),
      orderBy('title')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting tasks by category:', error);
    throw error;
  }
}; 