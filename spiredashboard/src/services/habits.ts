import { 
  collection, 
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Habit {
  id: string;
  title: string;
  description: string;
  type: 'habit' | 'task';
  categoryId: string;
  frequency?: string;
  priority?: 'low' | 'medium' | 'high';
  metrics: {
    [key: string]: string | number | boolean;
  };
  icon: string;
  createdAt?: any;
  updatedAt?: any;
}

export const getHabits = async (): Promise<Habit[]> => {
  try {
    const habitsRef = collection(db, 'habitstasks');
    const habitsSnapshot = await getDocs(habitsRef);
    const habits = habitsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Habit[];

    return habits;
  } catch (error) {
    console.error('Error fetching habits:', error);
    throw error;
  }
}; 