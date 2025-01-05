"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processScheduledMessages = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
exports.processScheduledMessages = functions.pubsub
    .schedule('*/10 * * * *')
    .onRun((context) => __awaiter(void 0, void 0, void 0, function* () {
    const now = admin.firestore.Timestamp.now();
    const db = admin.firestore();
    try {
        // Get all pending messages that should be sent now
        const snapshot = yield db
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
        yield batch.commit();
        console.log(`Processed ${snapshot.size} scheduled messages`);
        return null;
    }
    catch (error) {
        console.error('Error processing scheduled messages:', error);
        return null;
    }
}));
