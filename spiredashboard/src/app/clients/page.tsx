'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import Link from 'next/link';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import Groups from '@/components/Groups';

interface Client {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

type Tab = 'clients' | 'groups';

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('clients');

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

  const renderContent = () => {
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

    if (activeTab === 'groups') {
      return <Groups />;
    }

    return (
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
                  Click to chat
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
    );
  };

  return (
    <div className="h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
          {activeTab === 'clients' ? 'Clients' : 'Groups'}
        </h1>
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'clients'
                ? 'bg-yellow-500 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Clients
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'groups'
                ? 'bg-yellow-500 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Groups
          </button>
        </div>
        <p className="text-lg text-gray-300">
          {activeTab === 'clients' 
            ? 'Select a client to start chatting'
            : 'Manage your training groups'}
        </p>
      </div>

      {renderContent()}
    </div>
  );
} 