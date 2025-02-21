'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/solid';
import { addBreathProtocol, BreathProtocol, updateBreathProtocol } from '@/services/breathProtocols';

interface RMTFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editProtocol?: BreathProtocol | null;
}

interface RMTSettings {
  title: string;
  description: string;
  totalSets: number;
  repsPerSet: number;
  restBetweenSets: number;
  inhaleTime: number;
  inhaleHoldTime: number;
  exhaleTime: number;
  exhaleHoldTime: number;
  setConfigs: Array<{
    setNumber: number;
    breaths: string;
    inhaleResistance: number;
    exhaleResistance: number;
    inhaleTime?: number;
    inhaleHoldTime?: number;
    exhaleTime?: number;
    exhaleHoldTime?: number;
    restTime?: number;
  }>;
  [key: string]: string | number | any[]; // Index signature for dynamic access
}

export default function RMTForm({ isOpen, onClose, onSave, editProtocol }: RMTFormProps) {
  const [settings, setSettings] = useState<RMTSettings>({
    title: '',
    description: '',
    totalSets: 3,
    repsPerSet: 10,
    restBetweenSets: 60,
    inhaleTime: 4,
    inhaleHoldTime: 0,
    exhaleTime: 4,
    exhaleHoldTime: 0,
    setConfigs: []
  });

  useEffect(() => {
    if (editProtocol) {
      setSettings({
        title: editProtocol.title || '',
        description: editProtocol.description || '',
        totalSets: editProtocol.protocol?.totalSets || 3,
        repsPerSet: editProtocol.protocol?.repsPerSet || 10,
        restBetweenSets: editProtocol.protocol?.restBetweenSets || 60,
        inhaleTime: editProtocol.protocol?.inhaleTime || 4,
        inhaleHoldTime: editProtocol.protocol?.inhaleHoldTime || 0,
        exhaleTime: editProtocol.protocol?.exhaleTime || 4,
        exhaleHoldTime: editProtocol.protocol?.exhaleHoldTime || 0,
        setConfigs: editProtocol.protocol?.setConfigs || []
      });
    }
  }, [editProtocol]);

  useEffect(() => {
    // Update setConfigs when totalSets changes
    const newSetConfigs = Array.from({ length: settings.totalSets }, (_, i) => ({
      setNumber: i + 1,
      breaths: settings.repsPerSet.toString(),
      inhaleResistance: 0,
      exhaleResistance: 0,
      inhaleTime: settings.inhaleTime,
      inhaleHoldTime: settings.inhaleHoldTime,
      exhaleTime: settings.exhaleTime,
      exhaleHoldTime: settings.exhaleHoldTime,
      restTime: settings.restBetweenSets
    }));
    setSettings(prev => ({ ...prev, setConfigs: newSetConfigs }));
  }, [settings.totalSets]);

  const increment = (key: keyof RMTSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: key === 'restBetweenSets' ? (prev[key] as number) + 15 : (prev[key] as number) + 1
    }));
  };

  const decrement = (key: keyof RMTSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: key === 'restBetweenSets' 
        ? Math.max(0, (prev[key] as number) - 15)
        : Math.max(key.toString().includes('Hold') ? 0 : 1, (prev[key] as number) - 1)
    }));
  };

  const formatTimeMMSS = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    const protocol: Omit<BreathProtocol, 'id'> = {
      title: settings.title,
      description: settings.description,
      type: {
        name: 'RMT',
        ref: null
      },
      duration: formatTimeMMSS(settings.totalSets * (settings.repsPerSet * (settings.inhaleTime + settings.inhaleHoldTime + settings.exhaleTime + settings.exhaleHoldTime) + settings.restBetweenSets)),
      steps: [
        {
          order: 1,
          instruction: `${settings.totalSets} sets of ${settings.repsPerSet} breaths with ${formatTimeMMSS(settings.restBetweenSets)} rest between sets.`
        }
      ],
      benefits: [
        'Strengthens respiratory muscles',
        'Improves breathing efficiency',
        'Enhances exercise performance'
      ],
      protocol: {
        type: 'rmt' as const,
        totalSets: settings.totalSets,
        repsPerSet: settings.repsPerSet,
        restBetweenSets: settings.restBetweenSets,
        inhaleTime: settings.inhaleTime,
        inhaleHoldTime: settings.inhaleHoldTime,
        exhaleTime: settings.exhaleTime,
        exhaleHoldTime: settings.exhaleHoldTime,
        setConfigs: settings.setConfigs
      }
    };

    try {
      if (editProtocol) {
        await updateBreathProtocol(editProtocol.id, protocol);
      } else {
        await addBreathProtocol(protocol);
      }
      onSave();
    } catch (error) {
      console.error('Error saving RMT protocol:', error);
    }
  };

  const TimerControl = ({ 
    label, 
    value, 
    settingKey 
  }: { 
    label: string; 
    value: number; 
    settingKey: keyof RMTSettings;
  }) => (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => decrement(settingKey)}
          className="bg-gray-700/50 hover:bg-gray-600 text-white p-1.5 rounded-md transition-colors"
        >
          <MinusIcon className="w-3.5 h-3.5" />
        </button>
        <span className="text-white text-lg font-medium mx-2">
          {settingKey === 'restBetweenSets' ? formatTimeMMSS(value) : value}
        </span>
        <button
          onClick={() => increment(settingKey)}
          className="bg-gray-700/50 hover:bg-gray-600 text-white p-1.5 rounded-md transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-gray-900 rounded-xl shadow-2xl ring-1 ring-white/10 border border-gray-800/50 backdrop-blur-sm">
          <div className="relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <Dialog.Title className="text-lg font-bold text-white">
                Create RMT Protocol
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    PROTOCOL NAME
                  </label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-800/50 text-white rounded-lg px-3 py-2 text-sm"
                    placeholder="Enter protocol name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    DESCRIPTION
                  </label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-800/50 text-white rounded-lg px-3 py-2 min-h-[80px] text-sm"
                    placeholder="Describe the protocol"
                  />
                </div>

                {/* Set Configuration */}
                <div className="grid grid-cols-2 gap-3">
                  <TimerControl 
                    label="TOTAL SETS" 
                    value={settings.totalSets}
                    settingKey="totalSets"
                  />
                  <TimerControl 
                    label="REPS PER SET" 
                    value={settings.repsPerSet}
                    settingKey="repsPerSet"
                  />
                </div>

                {/* Timing Configuration */}
                <div className="grid grid-cols-2 gap-3">
                  <TimerControl 
                    label="INHALE TIME" 
                    value={settings.inhaleTime}
                    settingKey="inhaleTime"
                  />
                  <TimerControl 
                    label="INHALE HOLD" 
                    value={settings.inhaleHoldTime}
                    settingKey="inhaleHoldTime"
                  />
                  <TimerControl 
                    label="EXHALE TIME" 
                    value={settings.exhaleTime}
                    settingKey="exhaleTime"
                  />
                  <TimerControl 
                    label="EXHALE HOLD" 
                    value={settings.exhaleHoldTime}
                    settingKey="exhaleHoldTime"
                  />
                </div>

                <div>
                  <TimerControl 
                    label="REST BETWEEN SETS" 
                    value={settings.restBetweenSets}
                    settingKey="restBetweenSets"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 hover:from-yellow-400 hover:to-yellow-500 transition-all"
              >
                Save Protocol
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 