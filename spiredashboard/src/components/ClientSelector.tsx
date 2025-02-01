'use client';

import { useState, useEffect } from 'react';
import { UserCircleIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/config/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

interface Client {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isGroup?: boolean;
  memberCount?: number;
}

interface ClientSelectorProps {
  onClientSelect: (client: Client | null) => void;
  selectedClientId?: string;
}

export default function ClientSelector({ onClientSelect, selectedClientId }: ClientSelectorProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [groups, setGroups] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClientsAndGroups();
  }, [user]);

  const loadClientsAndGroups = async () => {
    if (!user) return;

    try {
      // Load clients
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
              isGroup: false,
            };
          }
          return null;
        })
      );

      const validClients = clientData.filter((client): client is Client => client !== null);
      setClients(validClients);

      // Load groups
      const groupsQuery = query(
        collection(db, 'groups'),
        where('coachId', '==', user.uid)
      );
      
      const groupsSnapshot = await getDocs(groupsQuery);
      const groupsData = groupsSnapshot.docs.map(doc => ({
        id: doc.id,
        firstName: doc.data().name,
        isGroup: true,
        memberCount: doc.data().memberCount || 0,
      })) as Client[];

      setGroups(groupsData);

      // Set initial selected client/group
      if (selectedClientId) {
        if (selectedClientId === user.uid) {
          setSelectedClient({ id: user.uid, firstName: 'My', lastName: 'Training' });
        } else {
          const client = validClients.find(c => c.id === selectedClientId);
          const group = groupsData.find(g => g.id === selectedClientId);
          setSelectedClient(client || group || null);
        }
      }
    } catch (error) {
      console.error('Error loading clients and groups:', error);
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
        {selectedClient?.isGroup ? (
          <UserGroupIcon className="w-6 h-6 text-yellow-500" />
        ) : (
          <UserCircleIcon className="w-6 h-6 text-gray-400" />
        )}
        <span className="text-white">
          {selectedClient
            ? selectedClient.isGroup
              ? `${selectedClient.firstName} (${selectedClient.memberCount} members)`
              : selectedClient.firstName && selectedClient.lastName
                ? `${selectedClient.firstName} ${selectedClient.lastName}`
                : selectedClient.email
            : 'Select Client or Group'}
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

          {/* Groups Section */}
          {groups.length > 0 && (
            <>
              <div className="border-t border-gray-700 my-2"></div>
              <div className="px-4 py-2">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Groups</h3>
              </div>
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleSelect(group)}
                  className={`flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 w-full transition-colors ${
                    selectedClient?.id === group.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <UserGroupIcon className="w-6 h-6 text-yellow-500" />
                  <div className="flex flex-col items-start">
                    <span className="text-white">{group.firstName}</span>
                    <span className="text-sm text-gray-400">{group.memberCount} members</span>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Clients Section */}
          {clients.length > 0 && (
            <>
              <div className="border-t border-gray-700 my-2"></div>
              <div className="px-4 py-2">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Clients</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-3 text-gray-400">Loading clients...</div>
                ) : (
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
                )}
              </div>
            </>
          )}

          {!loading && clients.length === 0 && groups.length === 0 && (
            <div className="px-4 py-3 text-gray-400">No clients or groups found</div>
          )}
        </div>
      )}
    </div>
  );
} 