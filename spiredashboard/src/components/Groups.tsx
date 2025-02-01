import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  description?: string;
  coachId: string;
  memberCount: number;
  createdAt: Date;
}

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      if (!user) return;

      try {
        const groupsQuery = query(
          collection(db, 'groups'),
          where('coachId', '==', user.uid)
        );
        
        const groupsSnapshot = await getDocs(groupsQuery);
        const groupsData = groupsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Group[];

        setGroups(groupsData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading groups:', err);
        setError('Failed to load groups');
        setLoading(false);
      }
    };

    loadGroups();
  }, [user]);

  if (loading) {
    return (
      <div className="text-white">Loading groups...</div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">{error}</div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/groups/new"
        className="block bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 hover:bg-yellow-500/20 transition-all"
      >
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <PlusIcon className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-white">
              Create New Group
            </p>
            <p className="text-gray-400">
              Start a new training group
            </p>
          </div>
        </div>
      </Link>

      {groups.map((group) => (
        <Link
          key={group.id}
          href={`/groups/${group.id}`}
          className="block bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <UserGroupIcon className="w-12 h-12 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-white truncate">
                {group.name}
              </p>
              {group.description && (
                <p className="text-gray-400 truncate">
                  {group.description}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {group.memberCount} members
              </p>
            </div>
          </div>
        </Link>
      ))}

      {groups.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No groups yet</p>
        </div>
      )}
    </div>
  );
} 