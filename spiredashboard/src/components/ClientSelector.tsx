'use client';

import { useState, useEffect } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';

interface Client {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface ClientSelectorProps {
  onClientSelect: (client: Client | null) => void;
  selectedClientId?: string;
}

export default function ClientSelector({ onClientSelect, selectedClientId }: ClientSelectorProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, [user]);

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

      // Set initial selected client
      if (selectedClientId) {
        if (selectedClientId === user.uid) {
          setSelectedClient({ id: user.uid, firstName: 'My', lastName: 'Training' });
        } else {
          const client = validClients.find(c => c.id === selectedClientId);
          setSelectedClient(client || null);
        }
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (client: Client | null) => {
    setSelectedClient(client);
    onClientSelect(client);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 hover:border-yellow-500/50 transition-all w-full"
      >
        <UserCircleIcon className="w-6 h-6 text-gray-400" />
        <span className="text-white">
          {selectedClient
            ? selectedClient.firstName && selectedClient.lastName
              ? `${selectedClient.firstName} ${selectedClient.lastName}`
              : selectedClient.email
            : 'Select Client'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          {/* My Training Option */}
          <button
            onClick={() => handleSelect({ id: user!.uid, firstName: 'My', lastName: 'Training' })}
            className={`flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 w-full transition-colors ${
              selectedClient?.id === user?.uid ? 'bg-gray-700' : ''
            }`}
          >
            <UserCircleIcon className="w-6 h-6 text-yellow-500" />
            <span className="text-white">My Training</span>
          </button>

          <div className="border-t border-gray-700 my-2"></div>

          {/* Client List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-gray-400">Loading clients...</div>
            ) : clients.length > 0 ? (
              clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className={`flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 w-full transition-colors ${
                    selectedClient?.id === client.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <UserCircleIcon className="w-6 h-6 text-gray-400" />
                  <span className="text-white">
                    {client.firstName && client.lastName
                      ? `${client.firstName} ${client.lastName}`
                      : client.email}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-400">No clients found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 