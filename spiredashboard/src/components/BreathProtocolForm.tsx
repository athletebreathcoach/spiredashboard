'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import SinglePatternForm from './protocols/SinglePatternForm';
import RMTForm from './protocols/RMTForm';
import ApneaTableForm from './protocols/ApneaTableForm';
import { BreathProtocol } from '@/services/breathProtocols';

const protocolTypes = [
  {
    id: 'single-pattern',
    name: 'Single Pattern',
    description: 'Basic breathing patterns with fixed inhale/exhale timings',
    icon: '🫁'
  },
  {
    id: 'rmt',
    name: 'RMT',
    description: 'Respiratory Muscle Training for strengthening breathing muscles',
    icon: '💪'
  },
  {
    id: 'apnea-table',
    name: 'Apnea Tables',
    description: 'For breath hold training (CO2 and O2 tables)',
    icon: '⏱️'
  }
];

interface BreathProtocolFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editProtocol?: BreathProtocol | null;
}

export default function BreathProtocolForm({ isOpen, onClose, onSave, editProtocol }: BreathProtocolFormProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeForm, setShowTypeForm] = useState(false);

  useEffect(() => {
    if (editProtocol) {
      // Safely handle older protocol formats by checking if type exists and has a name
      const typeName = editProtocol.type?.name?.toLowerCase() || '';
      const typeId = typeName.replace(/\s+/g, '-');
      setSelectedType(typeId);
      setShowTypeForm(true); // Immediately show form when editing
    }
  }, [editProtocol]);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleContinue = () => {
    if (selectedType) {
      setShowTypeForm(true);
    }
  };

  const handleFormClose = () => {
    setShowTypeForm(false);
    setSelectedType(null);
    onClose();
  };

  // If editing or if type is selected and showTypeForm is true, show the specific form
  if ((editProtocol || (showTypeForm && selectedType))) {
    switch (selectedType) {
      case 'single-pattern':
        return (
          <SinglePatternForm
            isOpen={true}
            onClose={handleFormClose}
            onSave={onSave}
            editProtocol={editProtocol}
          />
        );
      case 'rmt':
        return (
          <RMTForm
            isOpen={true}
            onClose={handleFormClose}
            onSave={onSave}
            editProtocol={editProtocol}
          />
        );
      case 'apnea-table':
        return (
          <ApneaTableForm
            isOpen={true}
            onClose={handleFormClose}
            onSave={onSave}
            editProtocol={editProtocol}
          />
        );
      default:
        return null;
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-gray-900 rounded-xl shadow-xl">
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <Dialog.Title className="text-xl font-bold text-white">
                {editProtocol ? 'Edit' : 'Create New'} Breath Protocol
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Select Protocol Type
              </h3>
              <p className="text-gray-400 mb-6">
                Choose the type of breathing protocol you want to create
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {protocolTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedType === type.id
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-700 hover:border-yellow-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{type.icon}</span>
                      <h4 className="font-semibold text-white">
                        {type.name}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-400">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedType}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedType
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 hover:from-yellow-400 hover:to-yellow-500'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 