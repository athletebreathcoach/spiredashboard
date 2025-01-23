'use client';

import { useEffect, useState, useMemo } from 'react';
import { ClipboardDocumentCheckIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { getBreathProtocols, deleteBreathProtocol, BreathProtocol } from '@/services/breathProtocols';
import { useLibrary } from '@/context/LibraryContext';
import BreathProtocolForm from '@/components/BreathProtocolForm';

export default function BreathProtocols() {
  const [protocols, setProtocols] = useState<BreathProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [protocolToDelete, setProtocolToDelete] = useState<BreathProtocol | null>(null);
  const [protocolToEdit, setProtocolToEdit] = useState<BreathProtocol | null>(null);
  const { searchQuery } = useLibrary();

  const fetchProtocols = async () => {
    try {
      const data = await getBreathProtocols();
      setProtocols(data);
    } catch (err) {
      setError('Failed to load breath protocols');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, []);

  const handleSave = async () => {
    await fetchProtocols();
    setShowForm(false);
  };

  const handleDelete = async (protocol: BreathProtocol) => {
    setProtocolToDelete(protocol);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!protocolToDelete) return;

    try {
      await deleteBreathProtocol(protocolToDelete.id);
      setProtocols(prev => prev.filter(p => p.id !== protocolToDelete.id));
      setShowDeleteConfirm(false);
      setProtocolToDelete(null);
    } catch (error) {
      console.error('Error deleting protocol:', error);
      alert('Failed to delete protocol. Please try again.');
    }
  };

  const handleEdit = (protocol: BreathProtocol) => {
    setProtocolToEdit(protocol);
    setShowForm(true);
  };

  const filteredProtocols = useMemo(() => {
    if (!searchQuery) return protocols;
    
    const query = searchQuery.toLowerCase();
    return protocols.filter(protocol => {
      const title = protocol.title.toLowerCase();
      const description = protocol.description.toLowerCase();
      const type = protocol.type?.name?.toLowerCase() || '';
      const benefits = protocol.benefits?.join(' ').toLowerCase() || '';

      return (
        title.includes(query) ||
        description.includes(query) ||
        type.includes(query) ||
        benefits.includes(query)
      );
    });
  }, [protocols, searchQuery]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading breath protocols...</div>
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
          <h2 className="text-2xl font-bold text-white mb-2">Breath Protocols</h2>
          <p className="text-gray-400">
            {filteredProtocols.length} {filteredProtocols.length === 1 ? 'protocol' : 'protocols'} found
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all"
        >
          Add Protocol
        </button>
      </div>

      <div className="space-y-4">
        {filteredProtocols.map((protocol) => (
          <div
            key={protocol.id}
            className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">
                {protocol.title}
              </h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(protocol);
                    }}
                    className="text-gray-500 hover:text-yellow-500 transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(protocol);
                    }}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                {protocol.type?.name && (
                  <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                    {protocol.type.name}
                  </span>
                )}
                {protocol.duration && (
                  <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                    {protocol.duration}
                  </span>
                )}
                {protocol.difficulty && (
                  <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                    {protocol.difficulty}
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-400">{protocol.description}</p>
            
            {protocol.steps && protocol.steps.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white mb-2">Steps:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {protocol.steps.map((step, index) => (
                    <li key={index} className="text-gray-400">
                      {step.instruction}
                      {step.duration && (
                        <span className="text-gray-500 ml-2">({step.duration})</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {protocol.benefits && protocol.benefits.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white mb-2">Benefits:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {protocol.benefits.map((benefit, index) => (
                    <li key={index} className="text-gray-400">{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {protocol.contraindications && protocol.contraindications.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white mb-2">Contraindications:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {protocol.contraindications.map((contraindication, index) => (
                    <li key={index} className="text-gray-400">{contraindication}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <BreathProtocolForm 
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setProtocolToEdit(null);
        }}
        onSave={handleSave}
        editProtocol={protocolToEdit}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl p-8 max-w-md w-full border border-gray-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Delete Protocol</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{protocolToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProtocolToDelete(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 