import { 
  collection, 
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface BreathTest {
  id: string;
  title: string;
  description: string;
  type: {
    name: string;
    ref: any;
  };
  duration: string;
  difficulty?: string;
  instructions: string[];
  metrics: {
    name: string;
    unit: string;
    description: string;
  }[];
  normalRanges?: {
    metric: string;
    min: number;
    max: number;
    unit: string;
  }[];
}

export const getBreathTests = async (): Promise<BreathTest[]> => {
  try {
    const testsRef = collection(db, 'breathingTests');
    const testsSnapshot = await getDocs(testsRef);
    const tests = testsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BreathTest[];

    // Collect all unique references
    const refs = new Set<string>();
    tests.forEach(test => {
      if (test.type?.ref?.path) refs.add(test.type.ref.path);
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

    // Merge reference data with tests
    const enrichedTests = tests.map(test => ({
      ...test,
      type: test.type?.ref?.path ? {
        ...test.type,
        ...refsMap.get(test.type.ref.path)
      } : test.type
    }));

    return enrichedTests;
  } catch (error) {
    console.error('Error fetching breath tests:', error);
    throw error;
  }
}; 