'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/solid';
import { addBreathProtocol, BreathProtocol, updateBreathProtocol } from '@/services/breathProtocols';

interface SinglePatternFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editProtocol?: BreathProtocol | null;
}

interface PatternSettings {
  title: string;
  description: string;
  inhaleTime: number;
  inhaleHoldTime: number;
  exhaleTime: number;
  exhaleHoldTime: number;
  rounds: number;
  restAfter: number;
  tags: string[];
  benefits: string[];
  [key: string]: string | number | string[]; // Index signature for dynamic access
}

export default function SinglePatternForm({ isOpen, onClose, onSave, editProtocol }: SinglePatternFormProps) {
  const [settings, setSettings] = useState<PatternSettings>({
    title: '',
    description: '',
    inhaleTime: 4,
    inhaleHoldTime: 0,
    exhaleTime: 4,
    exhaleHoldTime: 0,
    rounds: 3,
    restAfter: 0,
    tags: [],
    benefits: [],
  });

  useEffect(() => {
    if (editProtocol) {
      setSettings({
        title: editProtocol.title || '',
        description: editProtocol.description || '',
        inhaleTime: editProtocol.pattern?.inhaleTime || 4,
        inhaleHoldTime: editProtocol.pattern?.inhaleHoldTime || 0,
        exhaleTime: editProtocol.pattern?.exhaleTime || 4,
        exhaleHoldTime: editProtocol.pattern?.exhaleHoldTime || 0,
        rounds: editProtocol.pattern?.rounds || 3,
        restAfter: editProtocol.pattern?.restAfter || 0,
        tags: editProtocol.tags || [],
        benefits: editProtocol.benefits || [],
      });
    }
  }, [editProtocol]);

  const increment = (key: keyof PatternSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: key === 'restAfter' ? (prev[key] as number) + 30 : (prev[key] as number) + 1
    }));
  };

  const decrement = (key: keyof PatternSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: key === 'restAfter' 
        ? Math.max(0, (prev[key] as number) - 30)
        : Math.max(key.toString().includes('Hold') ? 0 : 1, (prev[key] as number) - 1)
    }));
  };

  const formatTimeMMSS = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalTime = () => {
    const cycleTime = settings.inhaleTime + settings.inhaleHoldTime + 
                     settings.exhaleTime + settings.exhaleHoldTime;
    return (cycleTime * settings.rounds) + settings.restAfter;
  };

  const handleSave = async () => {
    const protocol = {
      title: settings.title,
      description: settings.description,
      type: {
        name: 'Single Pattern',
        ref: null
      },
      duration: formatTimeMMSS(getTotalTime()),
      steps: [
        {
          order: 1,
          instruction: `Inhale for ${settings.inhaleTime} seconds${settings.inhaleHoldTime > 0 ? `, hold for ${settings.inhaleHoldTime} seconds` : ''}, exhale for ${settings.exhaleTime} seconds${settings.exhaleHoldTime > 0 ? `, hold for ${settings.exhaleHoldTime} seconds` : ''}. Repeat for ${settings.rounds} rounds.`
        }
      ],
      benefits: [
        'Improves breath awareness',
        'Reduces stress and anxiety',
        'Enhances focus and concentration'
      ],
      pattern: {
        inhaleTime: settings.inhaleTime,
        inhaleHoldTime: settings.inhaleHoldTime,
        exhaleTime: settings.exhaleTime,
        exhaleHoldTime: settings.exhaleHoldTime,
        rounds: settings.rounds,
        restAfter: settings.restAfter
      },
      tags: settings.tags
    };

    try {
      if (editProtocol) {
        // Update existing protocol
        await updateBreathProtocol(editProtocol.id, protocol);
      } else {
        // Create new protocol
        await addBreathProtocol(protocol);
      }
      onSave();
    } catch (error) {
      console.error('Error saving protocol:', error);
      // TODO: Add error handling UI
    }
  };

  const TimerControl = ({ 
    label, 
    value, 
    settingKey 
  }: { 
    label: string; 
    value: number; 
    settingKey: keyof PatternSettings;
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
          {settingKey === 'restAfter' ? formatTimeMMSS(value) : value}
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
                Create Single Pattern Protocol
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

                {/* Timer Controls */}
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

                <div className="grid grid-cols-2 gap-3">
                  <TimerControl 
                    label="ROUNDS" 
                    value={settings.rounds}
                    settingKey="rounds"
                  />
                  <TimerControl 
                    label="REST AFTER" 
                    value={settings.restAfter}
                    settingKey="restAfter"
                  />
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">Total Time</div>
                  <div className="text-xl font-medium text-white">
                    {formatTimeMMSS(getTotalTime())}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 hover:from-yellow-400 hover:to-yellow-500 transition-all"
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