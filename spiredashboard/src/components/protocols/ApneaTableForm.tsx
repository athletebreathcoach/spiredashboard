'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/solid';
import { addBreathProtocol, BreathProtocol, updateBreathProtocol } from '@/services/breathProtocols';

interface ApneaTableFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editProtocol?: BreathProtocol | null;
}

interface ApneaTableSettings {
  title: string;
  description: string;
  tableType: 'co2' | 'o2';
  rounds: number;
  apneaTime: number;
  restStartTime: number;
  restDecrement: number;
  cooldownTime: number;
  [key: string]: string | number; // Index signature for dynamic access
}

export default function ApneaTableForm({ isOpen, onClose, onSave, editProtocol }: ApneaTableFormProps) {
  const [settings, setSettings] = useState<ApneaTableSettings>({
    title: '',
    description: '',
    tableType: 'co2',
    rounds: 8,
    apneaTime: 60,
    restStartTime: 120,
    restDecrement: 15,
    cooldownTime: 60
  });

  useEffect(() => {
    if (editProtocol) {
      setSettings({
        title: editProtocol.title || '',
        description: editProtocol.description || '',
        tableType: editProtocol.protocol?.tableType || 'co2',
        rounds: editProtocol.protocol?.rounds || 8,
        apneaTime: editProtocol.protocol?.apneaTime || 60,
        restStartTime: editProtocol.protocol?.restStartTime || 120,
        restDecrement: editProtocol.protocol?.restDecrement || 15,
        cooldownTime: editProtocol.protocol?.cooldownTime || 60
      });
    }
  }, [editProtocol]);

  const increment = (key: keyof ApneaTableSettings) => {
    if (key === 'tableType') return;
    
    setSettings(prev => ({
      ...prev,
      [key]: ['apneaTime', 'restStartTime', 'cooldownTime'].includes(key as string) 
        ? (prev[key] as number) + 15 
        : key === 'restDecrement' 
          ? (prev[key] as number) + 5
          : (prev[key] as number) + 1
    }));
  };

  const decrement = (key: keyof ApneaTableSettings) => {
    if (key === 'tableType') return;
    
    setSettings(prev => ({
      ...prev,
      [key]: ['apneaTime', 'restStartTime', 'cooldownTime'].includes(key as string)
        ? Math.max(15, (prev[key] as number) - 15)
        : key === 'restDecrement'
          ? Math.max(5, (prev[key] as number) - 5)
          : Math.max(1, (prev[key] as number) - 1)
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
        name: 'Apnea Table',
        ref: null
      },
      duration: formatTimeMMSS(settings.rounds * (settings.apneaTime + settings.restStartTime) + settings.cooldownTime),
      steps: [
        {
          order: 1,
          instruction: `${settings.rounds} rounds of ${formatTimeMMSS(settings.apneaTime)} breath holds with decreasing rest periods starting at ${formatTimeMMSS(settings.restStartTime)}.`
        }
      ],
      benefits: [
        'Improves breath hold capacity',
        'Enhances CO2 tolerance',
        'Increases oxygen efficiency'
      ],
      protocol: {
        type: 'apnea-table' as const,
        tableType: settings.tableType,
        rounds: settings.rounds,
        apneaTime: settings.apneaTime,
        restStartTime: settings.restStartTime,
        restDecrement: settings.restDecrement,
        cooldownTime: settings.cooldownTime
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
      console.error('Error saving apnea table:', error);
    }
  };

  const TimerControl = ({ 
    label, 
    value, 
    settingKey 
  }: { 
    label: string; 
    value: number | string; 
    settingKey: keyof ApneaTableSettings;
  }) => (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => decrement(settingKey)}
          disabled={settingKey === 'tableType'}
          className="bg-gray-700/50 hover:bg-gray-600 text-white p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MinusIcon className="w-3.5 h-3.5" />
        </button>
        <span className="text-white text-lg font-medium mx-2">
          {typeof value === 'number' ? formatTimeMMSS(value) : value}
        </span>
        <button
          onClick={() => increment(settingKey)}
          disabled={settingKey === 'tableType'}
          className="bg-gray-700/50 hover:bg-gray-600 text-white p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                Create Apnea Table
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
                    TABLE NAME
                  </label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-800/50 text-white rounded-lg px-3 py-2 text-sm"
                    placeholder="Enter table name"
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
                    placeholder="Describe the table"
                  />
                </div>

                {/* Table Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    TABLE TYPE
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, tableType: 'co2' }))}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        settings.tableType === 'co2'
                          ? 'bg-yellow-500 text-gray-900'
                          : 'bg-gray-800/50 text-gray-400 hover:text-white'
                      }`}
                    >
                      CO2 Table
                    </button>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, tableType: 'o2' }))}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        settings.tableType === 'o2'
                          ? 'bg-yellow-500 text-gray-900'
                          : 'bg-gray-800/50 text-gray-400 hover:text-white'
                      }`}
                    >
                      O2 Table
                    </button>
                  </div>
                </div>

                {/* Table Configuration */}
                <div className="grid grid-cols-2 gap-3">
                  <TimerControl 
                    label="ROUNDS" 
                    value={settings.rounds}
                    settingKey="rounds"
                  />
                  <TimerControl 
                    label="APNEA TIME" 
                    value={settings.apneaTime}
                    settingKey="apneaTime"
                  />
                  <TimerControl 
                    label="INITIAL REST TIME" 
                    value={settings.restStartTime}
                    settingKey="restStartTime"
                  />
                  <TimerControl 
                    label="REST DECREMENT" 
                    value={settings.restDecrement}
                    settingKey="restDecrement"
                  />
                </div>

                <div>
                  <TimerControl 
                    label="COOLDOWN TIME" 
                    value={settings.cooldownTime}
                    settingKey="cooldownTime"
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
                Save Table
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 