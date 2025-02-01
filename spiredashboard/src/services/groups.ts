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

export interface Group {
  id?: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id?: string;
  groupId: string;
  userId: string;
  role: 'athlete' | 'coach';
  joinedAt: Date;
}

export interface GroupActivity {
  id?: string;
  groupId: string;
  type: 'exercise' | 'breathProtocol' | 'breathTest' | 'habit' | 'task' | 'guidedSession' | 'section';
  activityId: string;
  title: string;
  description?: string;
  scheduledDateTime: Date;
  timeOfDay: string;
  settings?: {
    rounds?: number;
    sets?: number;
    timeLimit?: number;
    workInterval?: number;
    restInterval?: number;
  };
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
  status: 'scheduled' | 'completed' | 'incomplete';
  activities?: GroupActivity[]; // For sections that contain multiple activities
}

// Create a new group
export const createGroup = async (group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> => {
  try {
    const groupsRef = collection(db, 'groups');
    const docRef = await addDoc(groupsRef, {
      ...group,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      ...group,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

// Get a group by ID
export const getGroup = async (groupId: string): Promise<Group | null> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      return null;
    }

    const data = groupDoc.data();
    return {
      id: groupDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Group;
  } catch (error) {
    console.error('Error getting group:', error);
    throw error;
  }
};

// Get all groups for a user
export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    // First get all group memberships for the user
    const membersRef = collection(db, 'groupMembers');
    const memberQuery = query(membersRef, where('userId', '==', userId));
    const memberSnapshot = await getDocs(memberQuery);
    
    // Get all group IDs the user is a member of
    const groupIds = memberSnapshot.docs.map(doc => doc.data().groupId);
    
    // If user is not in any groups, return empty array
    if (groupIds.length === 0) {
      return [];
    }
    
    // Get all groups the user is a member of
    const groupsRef = collection(db, 'groups');
    const groupsSnapshot = await getDocs(query(groupsRef, where('__name__', 'in', groupIds)));
    
    return groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Group[];
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
};

// Add member to group
export const addGroupMember = async (groupId: string, userId: string, role: 'athlete' | 'coach'): Promise<void> => {
  try {
    const membersRef = collection(db, 'groupMembers');
    await addDoc(membersRef, {
      groupId,
      userId,
      role,
      joinedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding group member:', error);
    throw error;
  }
};

// Remove member from group
export const removeGroupMember = async (groupId: string, userId: string): Promise<void> => {
  try {
    const membersRef = collection(db, 'groupMembers');
    const q = query(membersRef, 
      where('groupId', '==', groupId),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      await deleteDoc(doc(db, 'groupMembers', snapshot.docs[0].id));
    }
  } catch (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
};

// Schedule activity for group
export const scheduleGroupActivity = async (
  groupId: string,
  activity: Omit<GroupActivity, 'id' | 'groupId' | 'status'>
): Promise<void> => {
  try {
    const group = await getGroup(groupId);
    if (!group) throw new Error('Group not found');

    // Get all group members
    const membersRef = collection(db, 'groupMembers');
    const membersQuery = query(membersRef, where('groupId', '==', groupId));
    const membersSnapshot = await getDocs(membersQuery);
    const members = membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GroupMember[];

    const batch = writeBatch(db);

    // Create the group activity record
    const groupActivityRef = collection(db, 'groupActivities');
    const groupActivityDoc = await addDoc(groupActivityRef, {
      ...activity,
      groupId,
      status: 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Schedule the activity for each group member
    for (const member of members) {
      if (member.role === 'athlete') {
        if (activity.type === 'section') {
          // Schedule section and its activities
          const scheduledSection = {
            userId: member.userId,
            type: 'section',
            title: activity.title,
            description: activity.description,
            scheduledDateTime: activity.scheduledDateTime,
            timeOfDay: activity.timeOfDay,
            settings: activity.settings,
            status: 'scheduled',
            metrics: {
              timeOfDay: activity.timeOfDay,
              completed: false
            },
            activities: activity.activities,
            isParent: true,
            groupActivityId: groupActivityDoc.id,
            createdBy: group.createdBy,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          await addDoc(collection(db, 'scheduledExercises'), scheduledSection);
        } else {
          // Schedule individual activity
          await scheduleExercise(
            member.userId,
            activity.activityId,
            activity.scheduledDateTime,
            {
              timeOfDay: activity.timeOfDay,
              metrics: activity.metrics,
              groupActivityId: groupActivityDoc.id
            }
          );
        }
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Error scheduling group activity:', error);
    throw error;
  }
};

// Get group activities
export const getGroupActivities = async (
  groupId: string, 
  startDate: Date, 
  endDate: Date
): Promise<GroupActivity[]> => {
  try {
    const activitiesRef = collection(db, 'groupActivities');
    const q = query(
      activitiesRef,
      where('groupId', '==', groupId),
      where('scheduledDateTime', '>=', Timestamp.fromDate(startDate)),
      where('scheduledDateTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('scheduledDateTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledDateTime: doc.data().scheduledDateTime.toDate()
    })) as GroupActivity[];
  } catch (error) {
    console.error('Error getting group activities:', error);
    throw error;
  }
};

// Update group activity status
export const updateGroupActivityStatus = async (
  activityId: string, 
  status: 'scheduled' | 'completed' | 'incomplete'
): Promise<void> => {
  try {
    const activityRef = doc(db, 'groupActivities', activityId);
    await updateDoc(activityRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating activity status:', error);
    throw error;
  }
}; 