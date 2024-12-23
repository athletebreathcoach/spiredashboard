import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with service account
const serviceAccount = {
  "type": "service_account",
  "project_id": "ruok-8c88d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCdy97RHPqYdBiR\nT2Pwc9C3UslxvrzUPDwNBo6cUddx2wLrUUE7IB7QR8VjDDE9tTO1W7gsKKE7PIkQ\n7epFOOyWoYP/7KW8cp3ZJshq5FiOR0aUEK2yBeV9xj1CvO8JEnib87EVw3CbPHlS\n8RGNk25JSi80Z0r4AU7+PSlUrx56V0mJ5f+1YB0SwzAAg6NYVhWrnptWxSzXCK0c\nxPzrlnRsM0wjt5BNKeR84VMLkhVztnkz73zj49xEaBDivdul7kV6NPm3pi2wyasL\nMcyHx+KN6FC4PognP+QjzbB6UGFXz0Ztnctoy71hP6+u8tR3+b8EhQHzusuxTLLs\nRK7Nw+i3AgMBAAECggEABkM2F6SHyY8p/nJhLATcrrnpZstEIUQ2uemdtVSGMW2Y\nwxAZf6g5sNh4XAL63VEYuUTnnVELfRdc9UAMAS1OLnhAjeKtfTorS5f/ckaXwSXR\nBkVXL26OehxpCAIJlpmWEdJtH8j+6hpPUlxg7vZ/9Qatsu26ivc6VFrHDiZZFk/a\nhT2Pc0ZvFklW+CatIjI7NDx7ms+8kbwbgH4PsR7K6g3PcrLfseX4/BeRxE2Vxwrf\ndmKJQIIaUlQlFKf0Xm1FEVGRtNBrdVNRE1u2tHDOcuJjeB9KDNCRA3MpevTi0xtg\nQfeh5jG3Rr7idwkKcui3NrGNFPtDxHHuOAnsbtD+IQKBgQDcJlVk1lfzvSoF5WYl\nUG/qiZEURs9FwoCh6PkE8nWKAl3QWQ/bO4sqkOSqNRx05Nn2ktmMoNknGnsT2jPq\nNaSv39/3IlanYibuj38y/ENVn1nfNhhVsw73eHiTWAbThDf1q263owHiFz2b7WJe\nDX7TD1wl/XSFd+Pp8ssatzX1MQKBgQC3fiGdDX/PG3x/fUdLWu7KViZYk9CQBvsT\n5yrt6oOhmFEnGN7JK3CTuiFJekzfMTJJOQ1QH0dzq2fH53cLFvRNAbZydAfxnTMu\nyPshv4iYxexnONjq474t7C0pIURb7SlXH02zPG1KwfiCZGfdRgwVpiYG67WEjhVa\n12gDO+niZwKBgQDGB5V5B3ZGQjqy4w9nMVv61ZQzcR6x2axr+G1IDfG9GzPYXsTs\nqDsfJwcKNIxMei+2pZIb9fRgQGnGCdn5LBfgPLnyTGk2WAw9O8dnzZOkSZtGNhrd\nvBwSb8PGhsBdM+pCitslRPREtDMvN/HsOKeEo6R4Z+2Qwa+6mjQo6/UVgQKBgArI\n8xjUDksSBoNHzcT0F0z1O1PBfGS6xE8rKy7Itevtk/eEUrPoRbmpGwPCmHoV3irH\nm6y16fE2hecOB8UzGDDehOa9QypEXxnE3l3hcBnqqDZ49Ob5c9gnJZBhUC9HBUMF\np/988b+PHxgq5p/u2g77sQh/GjAsWbz5JDfscZbJAoGADuohvD0EACl16lfJGUIf\nYGy76/rVX2m9ZFBk6WGi6Gx6RcrMexXs21NkvLpNnqoH9R4/KCNkkMJL93lE5S0e\n/Hx37G2O41sbcVE06EPdwEzFTzeYeK6seq8FDwCHyzRkr2+Tvdeg2/Ye9asRfffe\nwroZqP0yQmRyBlzoueERS3s=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-gbx5g@ruok-8c88d.iam.gserviceaccount.com",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs/x509/firebase-adminsdk-gbx5g%40ruok-8c88d.iam.gserviceaccount.com"
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = getFirestore();

const exercisesData = [
  {
    id: 'bench-press',
    title: 'Bench Press',
    description: 'A compound exercise that primarily targets the chest muscles, with secondary emphasis on shoulders and triceps.',
    type: {
      ref: db.doc('exerciseTypes/strength'),
      id: 'strength'
    },
    primaryMuscleGroup: {
      ref: db.doc('muscleGroups/chest'),
      id: 'chest'
    },
    equipment: {
      barbell: {
        ref: db.doc('equipment/barbell'),
        id: 'barbell'
      },
      bench: {
        ref: db.doc('equipment/bench'),
        id: 'bench'
      }
    },
    instructions: [
      'Lie flat on the bench with your feet flat on the ground',
      'Grip the barbell slightly wider than shoulder width',
      'Unrack the bar and lower it to your chest with control',
      'Press the bar back up to the starting position',
      'Keep your wrists straight and elbows tucked at about 45 degrees'
    ],
    tips: [
      'Keep your core tight throughout the movement',
      'Drive your feet into the ground for stability',
      'Maintain a slight arch in your lower back'
    ],
    videoId: 'IODxDxX7oi4', // AthleanX bench press form guide
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'squat',
    title: 'Barbell Squat',
    description: 'The king of leg exercises, targeting quadriceps, hamstrings, and glutes while engaging the entire core.',
    type: {
      ref: db.doc('exerciseTypes/strength'),
      id: 'strength'
    },
    primaryMuscleGroup: {
      ref: db.doc('muscleGroups/legs'),
      id: 'legs'
    },
    equipment: {
      barbell: {
        ref: db.doc('equipment/barbell'),
        id: 'barbell'
      },
      squat_rack: {
        ref: db.doc('equipment/squat_rack'),
        id: 'squat_rack'
      }
    },
    instructions: [
      'Position the bar on your upper back, not your neck',
      'Stand with feet shoulder-width apart',
      'Break at the hips and knees simultaneously',
      'Lower until thighs are parallel to ground or slightly below',
      'Drive through your heels to return to starting position'
    ],
    tips: [
      'Keep your chest up throughout the movement',
      'Track your knees in line with your toes',
      'Maintain a neutral spine'
    ],
    videoId: 'ultWZbUMPL8', // Jeff Nippard squat guide
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'deadlift',
    title: 'Conventional Deadlift',
    description: 'A fundamental compound movement that builds total body strength, focusing on the posterior chain.',
    type: {
      ref: db.doc('exerciseTypes/strength'),
      id: 'strength'
    },
    primaryMuscleGroup: {
      ref: db.doc('muscleGroups/back'),
      id: 'back'
    },
    equipment: {
      barbell: {
        ref: db.doc('equipment/barbell'),
        id: 'barbell'
      }
    },
    instructions: [
      'Stand with feet hip-width apart, barbell over mid-foot',
      'Hinge at hips to grip the bar just outside your legs',
      'Keep your chest up and back straight',
      'Drive through your heels and stand up with the weight',
      'Return the weight to the ground with control'
    ],
    tips: [
      'Keep the bar close to your body throughout the movement',
      'Engage your lats before lifting',
      'Think about pushing the floor away rather than pulling the weight'
    ],
    videoId: 'r4MzxtBKyNE', // Alan Thrall deadlift tutorial
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'pull-up',
    title: 'Pull-Up',
    description: 'A challenging bodyweight exercise that builds upper body strength and muscle, particularly in the back and arms.',
    type: {
      ref: db.doc('exerciseTypes/strength'),
      id: 'strength'
    },
    primaryMuscleGroup: {
      ref: db.doc('muscleGroups/back'),
      id: 'back'
    },
    equipment: {
      pull_up_bar: {
        ref: db.doc('equipment/pull_up_bar'),
        id: 'pull_up_bar'
      }
    },
    instructions: [
      'Hang from the bar with hands slightly wider than shoulders',
      'Engage your core and squeeze your shoulder blades together',
      'Pull yourself up until your chin clears the bar',
      'Lower yourself with control to the starting position'
    ],
    tips: [
      'Avoid swinging or using momentum',
      'Keep your core tight throughout the movement',
      'Focus on pulling with your back, not your arms'
    ],
    videoId: 'eGo4IYlbE5g', // AthleanX perfect pull-up guide
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'overhead-press',
    title: 'Overhead Press',
    description: 'A fundamental pressing movement that develops shoulder strength and stability.',
    type: {
      ref: db.doc('exerciseTypes/strength'),
      id: 'strength'
    },
    primaryMuscleGroup: {
      ref: db.doc('muscleGroups/shoulders'),
      id: 'shoulders'
    },
    equipment: {
      barbell: {
        ref: db.doc('equipment/barbell'),
        id: 'barbell'
      }
    },
    instructions: [
      'Start with the bar at shoulder height',
      'Keep your core tight and glutes squeezed',
      'Press the bar overhead until arms are fully extended',
      'Lower the bar back to shoulder height with control'
    ],
    tips: [
      'Keep your forearms vertical throughout the press',
      'Avoid excessive back arch',
      'Think about pushing your head through at the top'
    ],
    videoId: '2yjwXTZQDDI', // Alan Thrall press tutorial
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

// Function to upload exercises
const uploadExercises = async () => {
  try {
    const batch = db.batch();
    
    for (const exercise of exercisesData) {
      const { id, ...exerciseData } = exercise;
      const exerciseRef = db.collection('exercises').doc(id);
      batch.set(exerciseRef, exerciseData);
    }
    
    await batch.commit();
    console.log('Successfully uploaded exercises');
  } catch (error) {
    console.error('Error uploading exercises:', error);
  }
};

uploadExercises(); 