import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Initialize default breath tests if they don't exist
export const initializeBreathTests = async () => {
  try {
    const defaultTests = [
      {
        id: 'exhale-test',
        title: 'Exhale Test',
        category: 'Assessment',
        description: 'Measure your exhale control and capacity',
        icon: 'cloud-outline',
        type: 'breathTest',
        instructions: 'Take a normal breath in, then exhale slowly and steadily for as long as possible.'
      },
      {
        id: 'co2-walking-test',
        title: 'CO2 Walking Test',
        category: 'Assessment',
        description: 'Test your CO2 tolerance while walking',
        icon: 'walk-outline',
        type: 'breathTest',
        instructions: 'Take a normal breath, exhale normally, then hold your breath while walking. Count your steps until you need to breathe.'
      },
      {
        id: 'bolt-test',
        title: 'BOLT Test',
        category: 'Assessment',
        description: 'Body Oxygen Level Test - Measure your CO2 tolerance',
        icon: 'timer-outline',
        type: 'breathTest',
        instructions: 'Take a normal breath in and out through your nose, then hold your breath. Time how long until you feel the first urge to breathe.'
      },
      {
        id: 'tap-test',
        title: 'Tap Test',
        category: 'Assessment',
        description: 'Measure your central nervous system readiness and fatigue level',
        icon: 'finger-print-outline',
        type: 'tapTest',
        instructions: 'Tap the screen as many times as you can in 10 seconds to assess your neuromuscular readiness.'
      },
      {
        id: 'max-breath-hold',
        title: 'Max Breath Hold',
        category: 'Assessment',
        description: 'Measure your maximum breath hold capacity',
        icon: 'hourglass-outline',
        type: 'breathTest',
        instructions: 'Take a deep breath in to maximum capacity, then hold your breath for as long as possible.'
      }
    ];

    // Get all existing tests
    const breathingTestsRef = collection(db, 'breathingTests');
    const snapshot = await getDocs(breathingTestsRef);
    const existingTests = new Map(snapshot.docs.map(doc => [doc.id, doc.data()]));

    // Add or update each test
    for (const test of defaultTests) {
      const testRef = doc(db, 'breathingTests', test.id);
      if (!existingTests.has(test.id)) {
        await setDoc(testRef, test);
      }
    }

    return true;
  } catch (error) {
    console.error('Error initializing breath tests:', error);
    throw error;
  }
};

// Get all breathing tests
export const getBreathingTests = async () => {
  try {
    const breathingTestsRef = collection(db, 'breathingTests');
    const snapshot = await getDocs(breathingTestsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting breathing tests:', error);
    throw error;
  }
};

// Get a specific breathing test by ID
export const getBreathingTestById = async (testId) => {
  try {
    const testRef = doc(db, 'breathingTests', testId);
    const testDoc = await getDoc(testRef);
    
    if (!testDoc.exists()) {
      throw new Error('Breath test not found');
    }

    return {
      id: testDoc.id,
      ...testDoc.data()
    };
  } catch (error) {
    console.error('Error getting breath test:', error);
    throw error;
  }
}; 