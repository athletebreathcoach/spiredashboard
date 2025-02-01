import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Session {
  id?: string;
  title: string;
  description: string;
  type: 'session';
  items: (Exercise | BreathProtocol | BreathTest | HabitTask | GuidedSession | Section)[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  exerciseId: string;
  title: string;
  type: 'exercise';
  description?: string;
  metrics: {
    sets: Array<{
      reps: string | number;
      weight: string | number;
      rest: string;
    }>;
    eachSide: boolean;
    notes: string;
    completed?: boolean;
    timeOfDay?: string;
  };
}

export interface Section {
  id: string;
  title: string;
  type: 'section';
  description?: string;
  sectionType: 'standard' | 'forTime' | 'amrap' | 'chipper' | 'intervals';
  activities: Exercise[];
  settings?: {
    rounds?: number;
    timeLimit?: number;
    workInterval?: number;
    restInterval?: number;
  };
  metrics: {
    timeOfDay?: string;
    completed?: boolean;
  };
}

export interface BreathProtocol {
  id: string;
  title: string;
  type: 'breathProtocol';
  description?: string;
  protocol: {
    type: 'standard' | 'rmt' | 'apnea-table';
    pattern?: {
      inhale: number;
      inHold: number;
      exhale: number;
      exHold: number;
    };
    rounds?: number;
    duration?: string;
    defaultSettings?: {
      totalSets: number;
      repsPerSet: number;
      restBetweenSets: number;
      inhaleTime: number;
      inhaleHoldTime: number;
      exhaleTime: number;
      exhaleHoldTime: number;
      setConfigs: any[];
    };
    tableType?: 'co2' | 'o2';
    apneaTime?: number;
    restStartTime?: number;
    restDecrement?: number;
    cooldownTime?: number;
  };
  metrics: {
    timeOfDay?: string;
    completed?: boolean;
  };
}

export interface BreathTest {
  id: string;
  testId: string;
  title: string;
  type: 'breathTest';
  description?: string;
  metrics: {
    timeOfDay?: string;
    completed?: boolean;
  };
}

export interface HabitTask {
  id: string;
  habitId?: string;
  taskId?: string;
  title: string;
  type: 'habit' | 'task';
  description?: string;
  metrics: {
    timeOfDay?: string;
    completed?: boolean;
    streak?: number;
    priority?: string;
  };
  videoId?: string;
  videoUrl?: string;
}

export interface GuidedSession {
  id: string;
  sessionId: string;
  title: string;
  type: 'guidedSession';
  description?: string;
  duration: number;
  intensity?: string;
  videoUrl?: string;
  sessionType: string;
  metrics: {
    timeOfDay?: string;
    completed?: boolean;
  };
}

// Create a new session
export const createSession = async (session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session> => {
  try {
    const sessionsRef = collection(db, 'sessions');
    const docRef = await addDoc(sessionsRef, {
      ...session,
      type: 'session',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      ...session,
      type: 'session',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// Get a session by ID
export const getSession = async (sessionId: string): Promise<Session | null> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      return null;
    }

    const data = sessionDoc.data();
    return {
      id: sessionDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Session;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};

// Get all sessions
export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(sessionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Session[];
  } catch (error) {
    console.error('Error getting sessions:', error);
    throw error;
  }
};

// Schedule a session for a user
export const scheduleSession = async (
  userId: string,
  session: Session,
  scheduledDate: Date,
  timeOfDay: string,
  options?: {
    programAssignmentId?: string;
    groupActivityId?: string;
  }
): Promise<void> => {
  try {
    const scheduledSessionRef = collection(db, 'scheduledSessions');
    await addDoc(scheduledSessionRef, {
      userId,
      sessionId: session.id,
      title: session.title,
      description: session.description,
      type: 'session',
      scheduledDateTime: Timestamp.fromDate(scheduledDate),
      timeOfDay,
      status: 'scheduled',
      items: session.items.map(item => ({
        ...item,
        status: 'scheduled',
        metrics: {
          ...item.metrics,
          timeOfDay,
          completed: false
        }
      })),
      metrics: {
        timeOfDay,
        completed: false
      },
      programAssignmentId: options?.programAssignmentId,
      groupActivityId: options?.groupActivityId,
      createdBy: session.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error scheduling session:', error);
    throw error;
  }
};

// Get scheduled sessions for a user
export const getScheduledSessions = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> => {
  try {
    const scheduledSessionsRef = collection(db, 'scheduledSessions');
    const q = query(
      scheduledSessionsRef,
      where('userId', '==', userId),
      where('scheduledDateTime', '>=', Timestamp.fromDate(startDate)),
      where('scheduledDateTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('scheduledDateTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledDateTime: doc.data().scheduledDateTime.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      progress: {
        total: doc.data().items.length,
        completed: doc.data().items.filter((item: { metrics?: { completed?: boolean } }) => 
          item.metrics?.completed
        ).length
      }
    }));
  } catch (error) {
    console.error('Error getting scheduled sessions:', error);
    throw error;
  }
};

// Update session completion status
export const updateSessionStatus = async (
  sessionId: string,
  status: 'scheduled' | 'completed' | 'incomplete',
  completedItems?: Array<{
    itemId: string;
    metrics: {
      completed: boolean;
      completedAt?: Date;
      [key: string]: any;
    };
  }>
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'scheduledSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data();
    let updatedItems = sessionData.items;

    if (completedItems?.length) {
      updatedItems = updatedItems.map((item: any) => {
        const completedItem = completedItems.find(ci => ci.itemId === item.id);
        if (completedItem) {
          return {
            ...item,
            status: 'completed',
            metrics: {
              ...item.metrics,
              ...completedItem.metrics,
              completed: true,
              completedAt: serverTimestamp()
            }
          };
        }
        return item;
      });
    }

    await updateDoc(sessionRef, {
      status,
      items: updatedItems,
      metrics: {
        ...sessionData.metrics,
        completed: status === 'completed',
        completedAt: status === 'completed' ? serverTimestamp() : null
      },
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
}; 
