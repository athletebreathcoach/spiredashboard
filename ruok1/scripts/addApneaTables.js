import { db } from './firebaseAdmin.js';

export async function addApneaTables() {
  try {
    const protocols = [
      {
        title: "CO2 Table",
        description: "A CO2 tolerance table with fixed breath holds and decreasing rest intervals. Great for improving CO2 tolerance and breath control.",
        type: "breathwork",
        category: "apnea",
        animationType: "pulse",
        duration: "15:00",
        pattern: {
          inhale: 0,
          inHold: 0,
          exhale: 0,
          exHold: 0
        },
        rounds: 8,
        benefits: [
          "Improves CO2 tolerance",
          "Enhances breath control",
          "Increases mental resilience"
        ],
        instructions: [
          "Start with a comfortable breath hold time",
          "Rest intervals decrease with each round",
          "Maintain a relaxed state throughout",
          "Stop if you feel excessive air hunger"
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        navigateTo: 'ApneaTableSetup',
        tableType: 'co2'
      },
      {
        title: "O2 Table",
        description: "An O2 depletion table with increasing breath holds and fixed rest intervals. Perfect for improving oxygen efficiency and hypoxic tolerance.",
        type: "breathwork",
        category: "apnea",
        animationType: "pulse",
        duration: "20:00",
        pattern: {
          inhale: 0,
          inHold: 0,
          exhale: 0,
          exHold: 0
        },
        rounds: 8,
        benefits: [
          "Improves oxygen efficiency",
          "Enhances hypoxic tolerance",
          "Builds mental strength"
        ],
        instructions: [
          "Start with 50-60% of max breath hold",
          "Hold times increase with each round",
          "Maintain consistent rest intervals",
          "Focus on relaxation between holds"
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        navigateTo: 'ApneaTableSetup',
        tableType: 'o2'
      }
    ];

    // First, remove any existing apnea protocols
    const snapshot = await db.collection('breathProtocols')
      .where('category', '==', 'apnea')
      .get();
    
    for (const doc of snapshot.docs) {
      await db.collection('breathProtocols').doc(doc.id).delete();
      console.log(`Deleted existing apnea protocol: ${doc.data().title}`);
    }

    // Then add the new protocols
    for (const protocol of protocols) {
      await db.collection('breathProtocols').add(protocol);
      console.log(`${protocol.title} protocol added successfully`);
    }

    console.log('Apnea tables added successfully');
  } catch (error) {
    console.error('Error adding apnea tables:', error);
  }
}

// Execute the function
addApneaTables().then(() => {
  console.log('All apnea tables added successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
}); 