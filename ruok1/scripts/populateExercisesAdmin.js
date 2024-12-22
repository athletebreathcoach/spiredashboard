const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const presetExercises = [
  // Cardio Exercises
  {
    title: 'Running',
    description: 'Cardiovascular endurance exercise',
    category: 'Cardio',
    icon: 'walk-outline',
    type: 'cardio',
    equipment: ['running shoes'],
    instructions: [
      '1. Start with proper warm-up',
      '2. Maintain good posture',
      '3. Land midfoot with each step',
      '4. Keep arms relaxed at 90 degrees',
      '5. Breathe rhythmically',
    ],
    tips: [
      'Start slow and build up pace',
      'Stay hydrated',
      'Listen to your body',
      'Cool down properly',
    ],
    tracking: {
      type: 'cardio',
      fields: [
        { name: 'distance', unit: 'miles', type: 'number' },
        { name: 'time', unit: 'minutes', type: 'time' },
        { name: 'pace', unit: 'min/mile', type: 'calculated' }
      ]
    }
  },

  // Strength Exercises
  {
    title: 'Bench Press',
    description: 'Compound upper body exercise',
    category: 'Strength',
    icon: 'barbell-outline',
    type: 'strength',
    equipment: ['bench', 'barbell', 'weights'],
    instructions: [
      '1. Lie on a flat bench with your feet flat on the floor',
      '2. Grip the barbell slightly wider than shoulder-width',
      '3. Unrack the bar and lower it to your mid-chest',
      '4. Keep your elbows at about a 45-degree angle to your body',
      '5. Touch the bar to your chest while maintaining control',
      '6. Press the bar back up to the starting position',
    ],
    tips: [
      'Keep your wrists straight',
      'Maintain a tight core throughout the movement',
      'Drive your feet into the ground for stability',
      'Keep your shoulder blades retracted',
    ],
    videoId: 'vcBig73ojF0',
    tracking: {
      type: 'strength',
      fields: [
        { name: 'weight', unit: 'lbs', type: 'number' },
        { name: 'sets', unit: null, type: 'number' },
        { name: 'reps', unit: null, type: 'number' },
        { name: 'rest', unit: 'seconds', type: 'time' }
      ]
    }
  },
  {
    title: 'Deadlift',
    description: 'Compound full body exercise',
    category: 'Strength',
    icon: 'barbell-outline',
    type: 'strength',
    equipment: ['barbell', 'weights'],
    instructions: [
      '1. Stand with feet hip-width apart',
      '2. Bend at hips and knees to grip the bar',
      '3. Keep back straight and chest up',
      '4. Lift bar by extending hips and knees',
      '5. Return to starting position with controlled movement',
    ],
    tips: [
      'Keep the bar close to your body',
      'Engage your lats before lifting',
      'Push through your heels',
      'Maintain neutral spine throughout',
    ],
    tracking: {
      type: 'strength',
      fields: [
        { name: 'weight', unit: 'lbs', type: 'number' },
        { name: 'sets', unit: null, type: 'number' },
        { name: 'reps', unit: null, type: 'number' },
        { name: 'rest', unit: 'seconds', type: 'time' }
      ]
    }
  },

  // Plyometric Exercises
  {
    title: 'Box Jump',
    description: 'Explosive lower body exercise',
    category: 'Plyometric',
    icon: 'trending-up-outline',
    type: 'plyometric',
    equipment: ['plyo box'],
    instructions: [
      '1. Stand facing the box with feet shoulder-width apart',
      '2. Bend into quarter squat position',
      '3. Swing arms and explode upward',
      '4. Land softly on box with both feet',
      '5. Step back down and repeat',
    ],
    tips: [
      'Land as quietly as possible',
      'Use arms for momentum',
      'Start with lower box height',
      'Keep core engaged throughout',
    ],
    tracking: {
      type: 'plyometric',
      fields: [
        { name: 'height', unit: 'inches', type: 'number' },
        { name: 'sets', unit: null, type: 'number' },
        { name: 'reps', unit: null, type: 'number' },
        { name: 'rest', unit: 'seconds', type: 'time' }
      ]
    }
  }
];

async function populateExercises() {
  try {
    const exercisesRef = db.collection('exercises');
    
    // Add each exercise to the collection
    for (const exercise of presetExercises) {
      await exercisesRef.add(exercise);
      console.log(`Added exercise: ${exercise.title}`);
    }
    
    console.log('Successfully populated exercises');
    process.exit(0);
  } catch (error) {
    console.error('Error populating exercises:', error);
    process.exit(1);
  }
}

populateExercises(); 