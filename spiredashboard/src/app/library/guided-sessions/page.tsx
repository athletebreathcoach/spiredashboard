'use client';

import { useEffect, useState, useMemo } from 'react';
import { getGuidedSessions, GuidedSession } from '@/services/guidedSessions';
import { useLibrary } from '@/context/LibraryContext';
import GuidedSessionForm from '@/components/GuidedSessionForm';

export default function GuidedSessions() {
  const [sessions, setSessions] = useState<GuidedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { searchQuery } = useLibrary();

  const fetchSessions = async () => {
    try {
      const data = await getGuidedSessions();
      console.log('Fetched guided sessions:', data);
      setSessions(data);
    } catch (err) {
      setError('Failed to load guided sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions;
    
    const query = searchQuery.toLowerCase();
    return sessions.filter(session => {
      const title = session.title.toLowerCase();
      const description = session.description.toLowerCase();
      const type = session.type?.name?.toLowerCase() || '';

      return (
        title.includes(query) ||
        description.includes(query) ||
        type.includes(query)
      );
    });
  }, [sessions, searchQuery]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading guided sessions...</div>
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Guided Sessions</h2>
          <p className="text-gray-400">
            {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'} found
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all"
        >
          Add Session
        </button>
      </div>

      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <div
            key={session.id}
            className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">
                {session.title}
              </h3>
            </div>
            <p className="text-gray-400 mb-3">{session.description}</p>
            
            <div className="flex flex-wrap gap-2">
              {session.type?.name && (
                <span className="text-sm text-blue-200 bg-blue-900/50 px-3 py-1 rounded-full border border-blue-700/50">
                  {session.type.name}
                </span>
              )}
              {session.duration && (
                <span className="text-sm text-orange-200 bg-orange-900/50 px-3 py-1 rounded-full border border-orange-700/50">
                  {session.duration}
                </span>
              )}
              {session.intensity && (
                <span className="text-sm text-green-200 bg-green-900/50 px-3 py-1 rounded-full border border-green-700/50">
                  {session.intensity}
                </span>
              )}
              {session.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="text-sm text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full border border-purple-700/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <GuidedSessionForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchSessions();
          }}
        />
      )}
    </div>
  );
} 