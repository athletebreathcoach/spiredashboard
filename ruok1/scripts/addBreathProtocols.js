import { db } from './firebaseAdmin.js';

export async function addBreathProtocols() {
  try {
    const protocols = [
      {
        title: "Recovery Breath",
        description: "A calming breath pattern with longer exhales to activate the parasympathetic nervous system. Great for stress relief and recovery.",
        type: "breathwork",
        category: "relaxation",
        animationType: "pulse",
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
        animationType: "wave",
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
      },
      {
        title: "Energy Boost",
        description: "An energizing breath pattern with rapid inhales and exhales. Great for increasing alertness and energy levels.",
        type: "breathwork",
        category: "energy",
        animationType: "spiral",
        duration: "3:00",
        pattern: {
          inhale: 2,
          inHold: 0,
          exhale: 2,
          exHold: 0
        },
        rounds: 30,
        benefits: [
          "Increases energy",
          "Improves alertness",
          "Enhances mental clarity"
        ],
        instructions: [
          "Sit up straight",
          "Inhale quickly through your nose",
          "Exhale quickly through your nose",
          "Maintain a rapid but controlled pace"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Deep Focus",
        description: "A concentrated breathing pattern with holds to enhance focus and mental clarity.",
        type: "breathwork",
        category: "focus",
        animationType: "pulse",
        duration: "4:00",
        pattern: {
          inhale: 4,
          inHold: 4,
          exhale: 4,
          exHold: 4
        },
        rounds: 15,
        benefits: [
          "Enhances concentration",
          "Improves mental clarity",
          "Reduces mind wandering"
        ],
        instructions: [
          "Find a quiet space",
          "Inhale for 4 counts",
          "Hold for 4 counts",
          "Exhale for 4 counts",
          "Hold for 4 counts"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Sleep Prep",
        description: "A gentle breathing pattern designed to help you wind down and prepare for sleep.",
        type: "breathwork",
        category: "sleep",
        animationType: "wave",
        duration: "6:00",
        pattern: {
          inhale: 4,
          inHold: 0,
          exhale: 8,
          exHold: 0
        },
        rounds: 20,
        benefits: [
          "Promotes relaxation",
          "Prepares body for sleep",
          "Reduces bedtime anxiety"
        ],
        instructions: [
          "Lie down comfortably",
          "Inhale gently for 4 counts",
          "Exhale slowly for 8 counts",
          "Keep your breath smooth and quiet"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Mountain Breath",
        description: "A grounding breath pattern that builds in intensity, like climbing a mountain. Perfect for building mental resilience.",
        type: "breathwork",
        category: "focus",
        animationType: "spiral",
        duration: "7:00",
        pattern: {
          inhale: 6,
          inHold: 2,
          exhale: 6,
          exHold: 2
        },
        rounds: 25,
        benefits: [
          "Builds mental resilience",
          "Improves focus",
          "Increases oxygen intake"
        ],
        instructions: [
          "Sit with a straight spine",
          "Inhale deeply as the circle expands and rotates",
          "Hold briefly at the peak",
          "Exhale fully as the circle contracts and rotates back",
          "Feel yourself becoming more grounded with each round"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Ocean Waves",
        description: "A flowing breath pattern that mimics the gentle rhythm of ocean waves. Ideal for deep relaxation and stress relief.",
        type: "breathwork",
        category: "relaxation",
        animationType: "wave",
        duration: "8:00",
        pattern: {
          inhale: 4,
          inHold: 1,
          exhale: 6,
          exHold: 1
        },
        rounds: 30,
        benefits: [
          "Deep relaxation",
          "Stress relief",
          "Emotional balance",
          "Better sleep preparation"
        ],
        instructions: [
          "Find a comfortable position",
          "Follow the wave-like motion",
          "Breathe in as the wave rises",
          "Breathe out as it falls",
          "Let your body sway gently with the rhythm"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Solar Energy",
        description: "An invigorating spiral breath pattern that builds energy like the rising sun. Great for morning practice.",
        type: "breathwork",
        category: "energy",
        animationType: "spiral",
        duration: "4:00",
        pattern: {
          inhale: 3,
          inHold: 1,
          exhale: 3,
          exHold: 1
        },
        rounds: 25,
        benefits: [
          "Morning energization",
          "Mental awakening",
          "Increased vitality"
        ],
        instructions: [
          "Practice on an empty stomach",
          "Sit up straight",
          "Sync your breath with the spinning motion",
          "Visualize drawing in golden light",
          "Feel energy building with each round"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Pulse Meditation",
        description: "A rhythmic breathing pattern that synchronizes with your heartbeat. Perfect for meditation and mindfulness.",
        type: "breathwork",
        category: "focus",
        animationType: "pulse",
        duration: "10:00",
        pattern: {
          inhale: 5,
          inHold: 0,
          exhale: 5,
          exHold: 2
        },
        rounds: 40,
        benefits: [
          "Deep meditation",
          "Heart-mind coherence",
          "Improved concentration",
          "Stress reduction"
        ],
        instructions: [
          "Sit in a meditation posture",
          "Place one hand on your heart",
          "Match your breath to the pulsing circle",
          "Feel your heartbeat synchronizing",
          "Let thoughts pass like clouds"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Twilight Waves",
        description: "A gentle wave-like breath pattern that eases you into sleep. Perfect for bedtime relaxation.",
        type: "breathwork",
        category: "sleep",
        animationType: "wave",
        duration: "12:00",
        pattern: {
          inhale: 4,
          inHold: 0,
          exhale: 7,
          exHold: 1
        },
        rounds: 35,
        benefits: [
          "Natural sleep aid",
          "Evening relaxation",
          "Anxiety reduction",
          "Better sleep quality"
        ],
        instructions: [
          "Lie down in bed",
          "Follow the gentle wave motion",
          "Keep your breath soft and quiet",
          "Let each exhale release tension",
          "Allow yourself to drift off naturally"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "DNA Spiral",
        description: "A unique spiral breathing pattern that alternates between energizing and calming. Great for balance and transformation.",
        type: "breathwork",
        category: "balance",
        animationType: "spiral",
        duration: "6:00",
        pattern: {
          inhale: 4,
          inHold: 2,
          exhale: 4,
          exHold: 2
        },
        rounds: 25,
        benefits: [
          "Energy balancing",
          "Mind-body integration",
          "Spiritual connection",
          "DNA activation"
        ],
        instructions: [
          "Sit cross-legged if possible",
          "Visualize a double helix as you breathe",
          "Inhale up one spiral",
          "Exhale down the other",
          "Feel the integration of opposites"
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Heart Pulse",
        description: "A heart-centered breathing practice that builds compassion and emotional resilience.",
        type: "breathwork",
        category: "relaxation",
        animationType: "pulse",
        duration: "9:00",
        pattern: {
          inhale: 5,
          inHold: 3,
          exhale: 7,
          exHold: 0
        },
        rounds: 30,
        benefits: [
          "Emotional healing",
          "Heart opening",
          "Compassion development",
          "Stress release"
        ],
        instructions: [
          "Sit comfortably with a tall spine",
          "Place both hands on your heart",
          "Breathe deeply into your heart space",
          "Feel the pulse expanding love",
          "Send compassion with each exhale"
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

// Add this at the bottom of the file to execute the function
addBreathProtocols().then(() => {
  console.log('All protocols added successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
}); 