'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UserCircleIcon } from '@heroicons/react/24/solid';

interface GroupMember {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  coachId: string;
  memberCount: number;
  members?: string[];
}

interface Props {
  id: string;
}

export default function GroupDetailClient({ id }: Props) {
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableClients, setAvailableClients] = useState<GroupMember[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    const loadGroup = async () => {
      if (!user) return;

      try {
        const groupRef = doc(db, 'groups', id);
        const groupDoc = await getDoc(groupRef);
        
        if (!groupDoc.exists()) {
          setError('Group not found');
          setLoading(false);
          return;
        }

        const groupData = {
          id: groupDoc.id,
          ...groupDoc.data()
        } as Group;

        setGroup(groupData);

        // Load group members
        if (groupData.members && groupData.members.length > 0) {
          const memberDocs = await Promise.all(
            groupData.members.map(memberId => 
              getDoc(doc(db, 'users', memberId))
            )
          );

          const memberData = memberDocs
            .filter(doc => doc.exists())
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as GroupMember[];

          setMembers(memberData);
        }

        // Load available clients
        const coachRef = doc(db, 'coaches', user.uid);
        const coachDoc = await getDoc(coachRef);
        
        if (coachDoc.exists()) {
          const clientIds = coachDoc.data()?.clients || [];
          const clientDocs = await Promise.all(
            clientIds.map((clientId: string) => 
              getDoc(doc(db, 'users', clientId))
            )
          );

          const clientData = clientDocs
            .filter(doc => doc.exists())
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as GroupMember[];

          // Filter out clients who are already members
          setAvailableClients(
            clientData.filter(client => 
              !groupData.members?.includes(client.id)
            )
          );
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading group:', err);
        setError('Failed to load group');
        setLoading(false);
      }
    };

    loadGroup();
  }, [user, id]);

  const handleAddMember = async () => {
    if (!user || !group || !selectedClientId) return;

    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        members: arrayUnion(selectedClientId),
        memberCount: (group.memberCount || 0) + 1
      });

      // Refresh the page to show the new member
      window.location.reload();
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading group...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">{error || 'Group not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
          {group.name}
        </h1>
        {group.description && (
          <p className="text-lg text-gray-300 mb-4">
            {group.description}
          </p>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            Members ({members.length})
          </h2>

          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-white truncate">
                      {member.firstName && member.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : member.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <p className="text-gray-400">No members yet</p>
            )}
          </div>
        </div>

        {availableClients.length > 0 && (
          <div className="pt-6 border-t border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              Add Members
            </h2>
            <div className="flex space-x-2">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="flex-1 rounded-md bg-gray-800 border border-gray-700 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Select a client</option>
                {availableClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName && client.lastName
                      ? `${client.firstName} ${client.lastName}`
                      : client.email}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedClientId}
                className="px-4 py-2 rounded-lg font-medium bg-yellow-500 text-black hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Member
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 