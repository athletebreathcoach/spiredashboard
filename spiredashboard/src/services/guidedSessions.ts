import { 
  collection, 
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface GuidedSession {
  id: string;
  title: string;
  description: string;
  type: {
    name: string;
    ref: any;
  };
  duration: string;
  difficulty?: string;
  coach: {
    name: string;
    ref: any;
  };
  intensity: string;
  videoUrl: string;
  tags: string[];
  createdAt?: any;
}

export const getGuidedSessions = async (): Promise<GuidedSession[]> => {
  try {
    const sessionsRef = collection(db, 'guidedSessions');
    const sessionsSnapshot = await getDocs(sessionsRef);
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GuidedSession[];

    // Collect all unique references
    const refs = new Set<string>();
    sessions.forEach(session => {
      if (session.type?.ref?.path) refs.add(session.type.ref.path);
      if (session.coach?.ref?.path) refs.add(session.coach.ref.path);
    });

    // Fetch all references in parallel
    const refsData = await Promise.all(
      Array.from(refs).map(async refPath => {
        const docRef = doc(db, refPath);
        const docSnap = await getDoc(docRef);
        return {
          path: refPath,
          data: docSnap.data()
        };
      })
    );

    // Create a map of reference data
    const refsMap = new Map(
      refsData.map(({ path, data }) => [path, data])
    );

    // Merge reference data with sessions
    const enrichedSessions = sessions.map(session => ({
      ...session,
      type: session.type?.ref?.path ? {
        ...session.type,
        ...refsMap.get(session.type.ref.path)
      } : session.type,
      coach: session.coach?.ref?.path ? {
        ...session.coach,
        ...refsMap.get(session.coach.ref.path)
      } : session.coach
    }));

    return enrichedSessions;
  } catch (error) {
    console.error('Error fetching guided sessions:', error);
    throw error;
  }
}; 