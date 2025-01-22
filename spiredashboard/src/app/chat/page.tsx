'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface Client {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface ChatPreview {
  userId: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}

export default function Chat() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      if (!user) return;

      try {
        console.log('Loading clients for coach:', user.uid);
        const coachRef = doc(db, 'coaches', user.uid);
        const coachDoc = await getDoc(coachRef);
        
        if (!coachDoc.exists()) {
          setError('Coach document not found');
          setLoading(false);
          return;
        }

        const clientIds = coachDoc.data()?.clients || [];
        console.log('Found client IDs:', clientIds);

        const clientData = await Promise.all(
          clientIds.map(async (clientId: string) => {
            const userRef = doc(db, 'users', clientId);
            const clientDoc = await getDoc(userRef);
            if (clientDoc.exists()) {
              const data = clientDoc.data();
              return {
                id: clientId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
              };
            }
            return null;
          })
        );

        const validClients = clientData.filter((client): client is Client => client !== null);
        console.log('Loaded clients:', validClients);
        setClients(validClients);
        setLoading(false);
      } catch (err) {
        console.error('Error loading clients:', err);
        setError('Failed to load clients');
        setLoading(false);
      }
    };

    loadClients();
  }, [user]);

  // Load active chats
  useEffect(() => {
    if (!user) return;

    console.log('Loading chats for coach:', user.uid);

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        console.log('Found chats:', snapshot.size);

        const chatPreviews = await Promise.all(
          snapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            console.log('Chat data:', chatData);

            // Get the client's ID (the participant that isn't the coach)
            const clientId = chatData.participants.find((id: string) => id !== user.uid);
            
            // Get the client's user document
            const clientDoc = await getDoc(doc(db, 'users', clientId));
            const clientData = clientDoc.data();
            console.log('Client data:', clientData);

            // Get the last message from the messages subcollection
            const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
            const messagesQuery = query(messagesRef, where('timestamp', '>', new Date(0)), orderBy('timestamp', 'desc'), limit(1));
            const lastMessageSnap = await getDocs(messagesQuery);
            const lastMessage = lastMessageSnap.docs[0]?.data();
            
            return {
              userId: clientId,
              name: clientData?.firstName && clientData?.lastName 
                ? `${clientData.firstName} ${clientData.lastName}`
                : clientData?.email || 'Client',
              lastMessage: lastMessage?.text || 'No messages yet',
              lastMessageTime: lastMessage?.timestamp?.toDate() || new Date(),
              unreadCount: chatData.unreadCount?.[user.uid] || 0,
            };
          })
        );

        console.log('Processed chat previews:', chatPreviews);
        setChats(chatPreviews);
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Failed to load chats');
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
          Chat
        </h1>
        <p className="text-lg text-gray-300">
          Chat with your clients
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8">
        {/* Active Chats Section */}
        {chats.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Active Conversations</h2>
            <div className="space-y-4">
              {chats.map((chat) => (
                <Link
                  key={chat.userId}
                  href={`/chat/${chat.userId}`}
                  className="block bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <UserCircleIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold text-white truncate">
                          {chat.name}
                        </p>
                        {chat.lastMessageTime && (
                          <span className="text-sm text-gray-400">
                            {chat.lastMessageTime.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-gray-400 truncate">{chat.lastMessage}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Clients Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">All Clients</h2>
          <div className="space-y-4">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/chat/${client.id}`}
                className="block bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-white truncate">
                      {client.firstName && client.lastName
                        ? `${client.firstName} ${client.lastName}`
                        : client.email}
                    </p>
                    <p className="text-gray-400 truncate">
                      Click to start chatting
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {clients.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No clients yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 