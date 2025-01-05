/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.processScheduledMessages = functions.pubsub
  .schedule('*/10 * * * *')  // Run every 10 minutes
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const db = admin.firestore();

    try {
      // Get all pending messages that should be sent now
      const snapshot = await db
        .collection('scheduledMessages')
        .where('status', '==', 'pending')
        .where('scheduledFor', '<=', now)
        .get();

      if (snapshot.empty) {
        console.log('No messages to send');
        return null;
      }

      const batch = db.batch();

      for (const doc of snapshot.docs) {
        const message = doc.data();
        const { chatId, senderId, text, image } = message;

        // Add the message to the chat
        const messageRef = db.collection('chats').doc(chatId).collection('messages').doc();
        batch.set(messageRef, {
          senderId,
          text,
          image,
          timestamp: now,
        });

        // Mark the scheduled message as sent
        batch.update(doc.ref, {
          status: 'sent',
          sentAt: now,
        });
      }

      await batch.commit();
      console.log(`Processed ${snapshot.size} scheduled messages`);
      return null;
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
      return null;
    }
  });
