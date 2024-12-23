const { db } = require('./firebaseAdmin');
const admin = require('firebase-admin');

const habitsTasks = [
  {
    title: "Ice Bath",
    type: "habit",
    categoryId: "recovery",
    description: "3-5 minutes in cold water (10-15°C/50-59°F). Focus on steady breathing.",
    frequency: "daily",
    metrics: {
      duration: "3-5 minutes",
      temperature: "10-15°C",
    },
    icon: "snow-outline"
  },
  {
    title: "Nasal Breathing All Day",
    type: "habit",
    categoryId: "breathing",
    description: "Practice breathing through your nose throughout the day. This helps filter air, improve oxygen uptake, and reduce stress.",
    frequency: "daily",
    metrics: {
      target: "All day awareness",
    },
    icon: "medical-outline"
  },
  {
    title: "Box Breathing",
    type: "habit",
    categoryId: "breathing",
    description: "4 seconds inhale, 4 seconds hold, 4 seconds exhale, 4 seconds hold. Repeat for 5 minutes.",
    frequency: "daily",
    metrics: {
      duration: "5 minutes",
      pattern: "4-4-4-4",
    },
    icon: "square-outline"
  },
  {
    title: "Contrast Shower",
    type: "habit",
    categoryId: "recovery",
    description: "Alternate between 20 seconds cold and 10 seconds hot water. End with cold. Total 3-5 minutes.",
    frequency: "daily",
    metrics: {
      duration: "3-5 minutes",
      pattern: "20s cold / 10s hot",
    },
    icon: "water-outline"
  },
  {
    title: "Morning Sunlight",
    type: "habit",
    categoryId: "wellness",
    description: "Get 10-30 minutes of morning sunlight exposure, ideally within first hour of waking.",
    frequency: "daily",
    metrics: {
      duration: "10-30 minutes",
      timing: "Within 1 hour of waking",
    },
    icon: "sunny-outline"
  },
  {
    title: "Recovery Journal",
    type: "task",
    categoryId: "wellness",
    description: "Log your recovery activities, sleep quality, and stress levels.",
    priority: "medium",
    metrics: {
      completed: false,
    },
    icon: "journal-outline"
  },
  {
    title: "HRV Measurement",
    type: "task",
    categoryId: "recovery",
    description: "Measure morning Heart Rate Variability upon waking.",
    priority: "high",
    metrics: {
      completed: false,
    },
    icon: "heart-outline"
  },
  {
    title: "Prepare Ice Bath",
    type: "task",
    categoryId: "recovery",
    description: "Fill tub with cold water and add ice to reach 10-15°C (50-59°F).",
    priority: "high",
    metrics: {
      completed: false,
      temperature: "10-15°C",
    },
    icon: "thermometer-outline"
  }
];

const populateHabitsTasks = async () => {
  try {
    const habitsTasksRef = db.collection('habitstasks');
    
    for (const item of habitsTasks) {
      const docRef = await habitsTasksRef.add({
        ...item,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Added ${item.type}: ${item.title}`);
    }
    
    console.log('Successfully populated habits and tasks');
  } catch (error) {
    console.error('Error populating habits and tasks:', error);
    throw error;
  }
};

module.exports = { populateHabitsTasks }; 