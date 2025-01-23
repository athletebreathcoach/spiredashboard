'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      if (!user) return;

      try {
        const coachRef = doc(db, 'coaches', user.uid);
        const coachDoc = await getDoc(coachRef);
        
        if (!coachDoc.exists()) {
          setLoading(false);
          return;
        }

        const clientIds = coachDoc.data()?.clients || [];

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
        setClients(validClients);
        setLoading(false);
      } catch (err) {
        console.error('Error loading clients:', err);
        setLoading(false);
      }
    };

    loadClients();
  }, [user]);

  // Load active chats
  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const chatPreviews = await Promise.all(
          snapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            const clientId = chatData.participants.find((id: string) => id !== user.uid);
            
            const clientDoc = await getDoc(doc(db, 'users', clientId));
            const clientData = clientDoc.data();

            const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
            const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
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

        setChats(chatPreviews);
      } catch (err) {
        console.error('Error fetching chats:', err);
      }
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Client List Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-700">
        <div className="py-4 pr-4">
          <h2 className="text-xl font-bold text-white mb-4 pl-4">Messages</h2>
          <div className="space-y-2">
            {chats.map((chat) => (
              <Link
                key={chat.userId}
                href={`/chat/${chat.userId}`}
                className={`block p-3 transition-all ${
                  pathname === `/chat/${chat.userId}`
                    ? 'bg-gray-800 border-l-4 border-yellow-500'
                    : 'hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="w-10 h-10 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">
                        {chat.name}
                      </p>
                      {chat.lastMessageTime && (
                        <span className="text-xs text-gray-400">
                          {chat.lastMessageTime.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-xs text-gray-400 truncate">{chat.lastMessage}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {!loading && chats.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">No active chats</p>
              </div>
            )}
          </div>

          {/* All Clients Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">All Clients</h3>
            <div className="space-y-2">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/chat/${client.id}`}
                  className={`block p-3 rounded-lg transition-all ${
                    pathname === `/chat/${client.id}`
                      ? 'bg-gray-800 border-l-4 border-yellow-500'
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {client.firstName && client.lastName
                          ? `${client.firstName} ${client.lastName}`
                          : client.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        Start a conversation
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
} 