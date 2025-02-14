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
import { scheduleExercise } from './scheduledExercises';

export interface ProgramWeek {
  weekNumber: number;
  days: {
    [key: number]: { // 0-6 for days of week
      sections: ProgramSection[];
      activities: ProgramActivity[];
    }
  };
}

export interface ProgramSection {
  id: string;
  title: string;
  type: 'standard' | 'forTime' | 'amrap' | 'chipper' | 'intervals';
  description?: string;
  timeOfDay: string;
  order: number;
  settings?: {
    rounds?: number;
    sets?: number;
    timeLimit?: number;
    workInterval?: number;
    restInterval?: number;
  };
  activities: ProgramActivity[];
}

export interface ProgramActivity {
  id: string;
  type: 'exercise' | 'breathProtocol' | 'breathTest' | 'habit' | 'task' | 'guidedSession';
  activityId: string;
  title: string;
  timeOfDay: string;
  order: number;
  metrics: {
    sets?: Array<{
      reps?: number;
      weight?: number;
      rest?: string;
    }>;
    eachSide?: boolean;
    notes?: string;
    [key: string]: any;
  };
}

export interface Program {
  id?: string;
  title: string;
  description: string;
  type: 'preset' | 'group';
  duration: number; // in weeks
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  weeks: ProgramWeek[];
}

// Create a new program
export const createProgram = async (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const programsRef = collection(db, 'programs');
    const docRef = await addDoc(programsRef, {
      ...program,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating program:', error);
    throw error;
  }
};

// Get a program by ID
export const getProgram = async (programId: string): Promise<Program | null> => {
  try {
    const programRef = doc(db, 'programs', programId);
    const programDoc = await getDoc(programRef);
    
    if (!programDoc.exists()) {
      return null;
    }

    const data = programDoc.data();
    return {
      id: programDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Program;
  } catch (error) {
    console.error('Error getting program:', error);
    throw error;
  }
};

// Get all programs
export const getAllPrograms = async (): Promise<Program[]> => {
  try {
    const programsRef = collection(db, 'programs');
    const q = query(programsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Program[];
  } catch (error) {
    console.error('Error getting programs:', error);
    throw error;
  }
};

// Assign a program to a user
export const assignProgramToUser = async (
  programId: string, 
  userId: string, 
  startDate: Date
): Promise<void> => {
  try {
    const program = await getProgram(programId);
    if (!program) throw new Error('Program not found');

    const batch = writeBatch(db);
    
    // Create program assignment record
    const assignmentRef = collection(db, 'programAssignments');
    const assignmentDoc = await addDoc(assignmentRef, {
      programId,
      userId,
      startDate: Timestamp.fromDate(startDate),
      status: 'active',
      progress: {
        currentWeek: 1,
        completedActivities: []
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Schedule all activities from the program
    for (const week of program.weeks) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + (week.weekNumber - 1) * 7);

      for (const [dayNum, day] of Object.entries(week.days)) {
        const activityDate = new Date(weekStartDate);
        activityDate.setDate(activityDate.getDate() + parseInt(dayNum));

        // Schedule sections
        for (const section of day.sections) {
          // Create a section in scheduledExercises
          const scheduledSection = {
            userId,
            type: 'section',
            title: section.title,
            description: section.description,
            scheduledDateTime: activityDate,
            timeOfDay: section.timeOfDay,
            settings: section.settings,
            status: 'scheduled',
            metrics: {
              timeOfDay: section.timeOfDay,
              completed: false
            },
            activities: section.activities,
            isParent: true,
            programAssignmentId: assignmentDoc.id,
            createdBy: program.createdBy,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          await addDoc(collection(db, 'scheduledExercises'), scheduledSection);
        }

        // Schedule individual activities
        for (const activity of day.activities) {
          await scheduleExercise(
            userId,
            activity.activityId,
            activityDate,
            {
              timeOfDay: activity.timeOfDay,
              metrics: activity.metrics,
              programAssignmentId: assignmentDoc.id
            }
          );
        }
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Error assigning program:', error);
    throw error;
  }
};

// Update program assignment progress
export const updateProgramProgress = async (
  assignmentId: string, 
  updates: any
): Promise<void> => {
  try {
    const assignmentRef = doc(db, 'programAssignments', assignmentId);
    await updateDoc(assignmentRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating program progress:', error);
    throw error;
  }
};

export const updateProgram = async (id: string, updates: Partial<Omit<Program, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const programRef = doc(db, 'programs', id);
    await updateDoc(programRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating program:', error);
    throw error;
  }
}; 