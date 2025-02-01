import { 
  collection, 
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface BreathProtocol {
  id: string;
  title: string;
  description: string;
  type: {
    name: string;
    ref: any;
  };
  duration: string;
  difficulty?: string;
  steps: {
    order: number;
    instruction: string;
    duration?: string;
  }[];
  benefits: string[];
  contraindications?: string[];
  pattern?: {
    inhaleTime: number;
    inhaleHoldTime: number;
    exhaleTime: number;
    exhaleHoldTime: number;
    rounds: number;
    restAfter: number;
  };
  tags?: string[];
}

export const getBreathProtocols = async (): Promise<BreathProtocol[]> => {
  try {
    const protocolsRef = collection(db, 'breathProtocols');
    const protocolsSnapshot = await getDocs(protocolsRef);
    const protocols = protocolsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BreathProtocol[];

    // Collect all unique references
    const refs = new Set<string>();
    protocols.forEach(protocol => {
      if (protocol.type?.ref?.path) refs.add(protocol.type.ref.path);
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

    // Merge reference data with protocols
    const enrichedProtocols = protocols.map(protocol => ({
      ...protocol,
      type: protocol.type?.ref?.path ? {
        ...protocol.type,
        ...refsMap.get(protocol.type.ref.path)
      } : protocol.type
    }));

    return enrichedProtocols;
  } catch (error) {
    console.error('Error fetching breath protocols:', error);
    throw error;
  }
};

export const addBreathProtocol = async (protocol: Omit<BreathProtocol, 'id'>) => {
  try {
    const protocolsRef = collection(db, 'breathProtocols');
    const docRef = await addDoc(protocolsRef, protocol);
    return docRef.id;
  } catch (error) {
    console.error('Error adding breath protocol:', error);
    throw error;
  }
};

export const deleteBreathProtocol = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'breathProtocols', id));
  } catch (error) {
    console.error('Error deleting breath protocol:', error);
    throw error;
  }
};

export const updateBreathProtocol = async (id: string, protocol: Omit<BreathProtocol, 'id'>) => {
  try {
    const protocolRef = doc(db, 'breathProtocols', id);
    await updateDoc(protocolRef, protocol);
  } catch (error) {
    console.error('Error updating breath protocol:', error);
    throw error;
  }
}; 