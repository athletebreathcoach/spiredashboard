'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
}

interface ClientInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function ChatConversation() {
  const { user } = useAuth();
  const { clientId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load client info
  useEffect(() => {
    const loadClientInfo = async () => {
      if (!clientId) return;
      
      try {
        const clientDoc = await getDoc(doc(db, 'users', clientId as string));
        if (clientDoc.exists()) {
          setClientInfo(clientDoc.data() as ClientInfo);
        }
      } catch (error) {
        console.error('Error loading client info:', error);
      }
    };

    loadClientInfo();
  }, [clientId]);

  // Load and listen to messages
  useEffect(() => {
    if (!user || !clientId) return;

    const chatId = [user.uid, clientId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as Message[];

      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, clientId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clientId || !newMessage.trim()) return;

    const chatId = [user.uid, clientId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(chatRef, 'messages');

    try {
      // Ensure chat document exists with participants
      await setDoc(chatRef, {
        participants: [user.uid, clientId],
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Add the message
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 pb-4 border-b border-gray-700 bg-gray-900">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {clientInfo?.firstName && clientInfo?.lastName
              ? `${clientInfo.firstName} ${clientInfo.lastName}`
              : clientInfo?.email || 'Client'}
          </h2>
          <p className="text-gray-400">Chat conversation</p>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 min-h-0">
        <div className="space-y-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.senderId === user?.uid
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-gray-700 text-white'
                }`}
              >
                <p>{message.text}</p>
                <span className="text-xs opacity-75 mt-1 block">
                  {message.timestamp?.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Fixed */}
      <div className="flex-shrink-0 border-t border-gray-700 p-6">
        <form onSubmit={sendMessage} className="flex items-center space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-yellow-500 text-gray-900 p-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
} 