const { db } = require('./firebaseAdmin');

const exampleSections = [
  {
    title: "Morning Recovery",
    description: "A morning routine focused on recovery and breathing exercises",
    activities: [
      {
        type: "breathProtocol",
        items: []
      },
      {
        type: "exercise",
        items: []
      }
    ],
    createdAt: new Date().toISOString(),
    createdBy: "system"
  },
  {
    title: "Evening Wind Down",
    description: "Evening routine to help you relax and prepare for sleep",
    activities: [
      {
        type: "breathProtocol",
        items: []
      },
      {
        type: "guidedSession",
        items: []
      },
      {
        type: "habitTask",
        items: []
      }
    ],
    createdAt: new Date().toISOString(),
    createdBy: "system"
  },
  {
    title: "Performance Testing",
    description: "A collection of tests to measure your performance",
    activities: [
      {
        type: "breathingTest",
        items: []
      },
      {
        type: "exercise",
        items: []
      }
    ],
    createdAt: new Date().toISOString(),
    createdBy: "system"
  }
];

async function populateSections() {
  try {
    const batch = db.batch();
    const sectionsRef = db.collection('sections');

    for (const section of exampleSections) {
      const docRef = sectionsRef.doc();
      batch.set(docRef, section);
    }

    await batch.commit();
    console.log('Successfully populated sections collection');
  } catch (error) {
    console.error('Error populating sections:', error);
  }
}

// Run the population
populateSections(); 