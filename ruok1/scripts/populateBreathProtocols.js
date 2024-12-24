const { db } = require('./firebaseAdmin');

async function populateBreathProtocols() {
  try {
    const triangleBreathing = {
      title: "Triangle Breathing",
      description: "A calming breath pattern that forms a triangle: inhale, exhale, and hold empty. Great for stress relief and mental clarity.",
      type: "breathwork",
      category: "relaxation",
      duration: "3:30",
      pattern: {
        inhale: 7,
        inHold: 0,
        exhale: 7,
        exHold: 7
      },
      rounds: 10,
      benefits: [
        "Reduces stress and anxiety",
        "Improves mental clarity",
        "Helps with emotional regulation"
      ],
      instructions: [
        "Find a comfortable seated position",
        "Inhale through your nose for 7 counts",
        "Exhale through your nose for 7 counts",
        "Hold empty for 7 counts",
        "Repeat for 10 rounds"
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('breathProtocols').add(triangleBreathing);
    console.log('Triangle breathing protocol added successfully');

  } catch (error) {
    console.error('Error populating breath protocols:', error);
  }
}

module.exports = { populateBreathProtocols }; 