import { db } from './firebaseAdmin.js';

export async function addBreathProtocols() {
  try {
    const protocols = [
      {
        title: "Recovery Breath",
        description: "A calming breath pattern with longer exhales to activate the parasympathetic nervous system. Great for stress relief and recovery.",
        type: "breathwork",
        category: "relaxation",
        duration: "5:00",
        pattern: {
          inhale: 4,
          inHold: 0,
          exhale: 6,
          exHold: 0
        },
        rounds: 20,
        benefits: [
          "Reduces stress and anxiety",
          "Promotes relaxation",
          "Helps with recovery"
        ],
        instructions: [
          "Find a comfortable seated position",
          "Inhale through your nose for 4 counts",
          "Exhale through your nose for 6 counts",
          "Repeat for the duration"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Balanced Breath",
        description: "A harmonious breath pattern with equal inhale and exhale. Perfect for finding balance and centering yourself.",
        type: "breathwork",
        category: "balance",
        duration: "5:00",
        pattern: {
          inhale: 5,
          inHold: 0,
          exhale: 5,
          exHold: 0
        },
        rounds: 20,
        benefits: [
          "Promotes mental balance",
          "Increases focus",
          "Reduces stress"
        ],
        instructions: [
          "Find a comfortable seated position",
          "Inhale through your nose for 5 counts",
          "Exhale through your nose for 5 counts",
          "Repeat for the duration"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const protocol of protocols) {
      await db.collection('breathProtocols').add(protocol);
      console.log(`${protocol.title} protocol added successfully`);
    }

  } catch (error) {
    console.error('Error adding breath protocols:', error);
  }
} 