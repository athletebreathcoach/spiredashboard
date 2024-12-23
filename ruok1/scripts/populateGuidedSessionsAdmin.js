import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../config/serviceAccountKey.json'), 'utf8')
);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const guidedSessions = [
  {
    title: 'Morning Energy Boost',
    description: 'Start your day with an energizing guided workout session',
    duration: '20 min',
    videoUrl: 'https://example.com/videos/morning-energy-boost',
    type: 'Energy',
    intensity: 'Medium',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    title: 'Recovery Flow',
    description: 'Gentle movement and breathing for post-workout recovery',
    duration: '15 min',
    videoUrl: 'https://example.com/videos/recovery-flow',
    type: 'Recovery',
    intensity: 'Low',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    title: 'Power HIIT',
    description: 'High-intensity interval training with guided instruction',
    duration: '30 min',
    videoUrl: 'https://example.com/videos/power-hiit',
    type: 'HIIT',
    intensity: 'High',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    title: 'Mindful Movement',
    description: 'Combine mindfulness with gentle exercise',
    duration: '25 min',
    videoUrl: 'https://example.com/videos/mindful-movement',
    type: 'Mind-Body',
    intensity: 'Low',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

const populateGuidedSessions = async () => {
  try {
    const batch = db.batch();
    const guidedSessionsRef = db.collection('guidedSessions');
    
    for (const session of guidedSessions) {
      const docRef = guidedSessionsRef.doc();
      batch.set(docRef, session);
      console.log(`Prepared guided session: ${session.title}`);
    }
    
    await batch.commit();
    console.log('Successfully populated guided sessions');
  } catch (error) {
    console.error('Error populating guided sessions:', error);
    throw error;
  }
};

// Run the population
populateGuidedSessions().then(() => {
  console.log('Completed populating guided sessions');
  process.exit(0);
}).catch((error) => {
  console.error('Failed to populate guided sessions:', error);
  process.exit(1);
}); 