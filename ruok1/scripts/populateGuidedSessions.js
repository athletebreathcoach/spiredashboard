import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const guidedSessions = [
  {
    title: 'Morning Energy Boost',
    description: 'Start your day with an energizing guided workout session',
    duration: '20 min',
    videoUrl: 'https://example.com/videos/morning-energy-boost',
    type: 'Energy',
    intensity: 'Medium',
    createdAt: new Date()
  },
  {
    title: 'Recovery Flow',
    description: 'Gentle movement and breathing for post-workout recovery',
    duration: '15 min',
    videoUrl: 'https://example.com/videos/recovery-flow',
    type: 'Recovery',
    intensity: 'Low',
    createdAt: new Date()
  },
  {
    title: 'Power HIIT',
    description: 'High-intensity interval training with guided instruction',
    duration: '30 min',
    videoUrl: 'https://example.com/videos/power-hiit',
    type: 'HIIT',
    intensity: 'High',
    createdAt: new Date()
  },
  {
    title: 'Mindful Movement',
    description: 'Combine mindfulness with gentle exercise',
    duration: '25 min',
    videoUrl: 'https://example.com/videos/mindful-movement',
    type: 'Mind-Body',
    intensity: 'Low',
    createdAt: new Date()
  }
];

export const populateGuidedSessions = async () => {
  try {
    const guidedSessionsRef = collection(db, 'guidedSessions');
    
    for (const session of guidedSessions) {
      await addDoc(guidedSessionsRef, session);
      console.log(`Added guided session: ${session.title}`);
    }
    
    console.log('Successfully populated guided sessions');
  } catch (error) {
    console.error('Error populating guided sessions:', error);
    throw error;
  }
}; 