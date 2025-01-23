'use client';

import { useState } from 'react';
import { db } from '@/config/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface ExerciseFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EXERCISE_TYPES = [
  'Strength',
  'Cardio',
  'Flexibility',
  'Balance',
  'HIIT',
  'Plyometric',
  'Endurance',
  'Recovery'
];

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Core',
  'Abs',
  'Legs',
  'Quads',
  'Hamstrings',
  'Calves',
  'Glutes',
  'Full Body',
  'Upper Body',
  'Lower Body'
];

const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Resistance Bands',
  'Bodyweight',
  'Machine',
  'Cable Machine',
  'Medicine Ball',
  'Yoga Mat',
  'Pull-up Bar',
  'Bench',
  'Box',
  'TRX',
  'Foam Roller',
  'Plates',
  'Bosu Ball',
  'Jump Rope'
];

const CATEGORIES = [
  'Warm Up',
  'Main Exercise',
  'Accessory',
  'Cool Down',
  'Mobility',
  'Stretching',
  'Power',
  'Strength',
  'Hypertrophy',
  'Endurance'
];

export default function ExerciseForm({ onClose, onSuccess }: ExerciseFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: { name: '' },
    category: '',
    primaryMuscleGroup: { name: '' },
    equipment: [] as { name: string }[],
    duration: '',
    difficulty: '',
    instructions: [] as string[],
    tips: [] as string[],
    videoId: ''
  });

  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [newTip, setNewTip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const exercisesRef = collection(db, 'exercises');
      const exerciseData = {
        ...formData,
        equipment: formData.equipment.reduce((acc, eq) => {
          acc[eq.name.toLowerCase().replace(/\s+/g, '-')] = { name: eq.name };
          return acc;
        }, {} as Record<string, { name: string }>)
      };
      
      console.log('Saving exercise to Firebase:', exerciseData);
      const docRef = await addDoc(exercisesRef, exerciseData);
      console.log('Exercise saved successfully with ID:', docRef.id);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding exercise:', error);
      alert('Failed to add exercise. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEquipment = () => {
    if (selectedEquipment && !formData.equipment.some(eq => eq.name === selectedEquipment)) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, { name: selectedEquipment }]
      }));
      setSelectedEquipment('');
    }
  };

  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  const addInstruction = () => {
    if (newInstruction.trim()) {
      setFormData(prev => ({
        ...prev,
        instructions: [...prev.instructions, newInstruction.trim()]
      }));
      setNewInstruction('');
    }
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const addTip = () => {
    if (newTip.trim()) {
      setFormData(prev => ({
        ...prev,
        tips: [...prev.tips, newTip.trim()]
      }));
      setNewTip('');
    }
  };

  const removeTip = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tips: prev.tips.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Add New Exercise
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            <div className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                required
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  Exercise Type
                </label>
                <select
                  value={formData.type.name}
                  onChange={e => setFormData(prev => ({ ...prev, type: { name: e.target.value } }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select type</option>
                  {EXERCISE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  Primary Muscle Group
                </label>
                <select
                  value={formData.primaryMuscleGroup.name}
                  onChange={e => setFormData(prev => ({ ...prev, primaryMuscleGroup: { name: e.target.value } }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select muscle group</option>
                  {MUSCLE_GROUPS.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={e => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                >
                  <option value="">Select difficulty</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                  placeholder="e.g., 30 mins"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  YouTube Video ID
                </label>
                <input
                  type="text"
                  value={formData.videoId}
                  onChange={e => setFormData(prev => ({ ...prev, videoId: e.target.value }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                  placeholder="e.g., dQw4w9WgXcQ"
                />
              </div>
            </div>
          </div>

          {/* Equipment Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-400">Equipment</label>
            <div className="flex gap-2">
              <select
                value={selectedEquipment}
                onChange={e => setSelectedEquipment(e.target.value)}
                className="flex-1 bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
              >
                <option value="">Select equipment</option>
                {EQUIPMENT_OPTIONS.map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addEquipment}
                className="bg-yellow-500/10 text-yellow-500 px-6 py-2 rounded-xl font-medium hover:bg-yellow-500/20 transition-all border border-yellow-500/20"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.equipment.map((eq, index) => (
                <span
                  key={index}
                  className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-xl border border-yellow-500/20 flex items-center gap-2 group"
                >
                  {eq.name}
                  <button
                    type="button"
                    onClick={() => removeEquipment(index)}
                    className="text-yellow-500/50 hover:text-yellow-500 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Instructions Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-400">Instructions</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newInstruction}
                onChange={e => setNewInstruction(e.target.value)}
                className="flex-1 bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                placeholder="Add instruction step..."
              />
              <button
                type="button"
                onClick={addInstruction}
                className="bg-yellow-500/10 text-yellow-500 px-6 py-2 rounded-xl font-medium hover:bg-yellow-500/20 transition-all border border-yellow-500/20"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-800/30 p-4 rounded-xl group"
                >
                  <span className="flex-1 text-gray-300">{instruction}</span>
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-400">Pro Tips</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTip}
                onChange={e => setNewTip(e.target.value)}
                className="flex-1 bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                placeholder="Add pro tip..."
              />
              <button
                type="button"
                onClick={addTip}
                className="bg-yellow-500/10 text-yellow-500 px-6 py-2 rounded-xl font-medium hover:bg-yellow-500/20 transition-all border border-yellow-500/20"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.tips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-800/30 p-4 rounded-xl group"
                >
                  <span className="flex-1 text-gray-300">{tip}</span>
                  <button
                    type="button"
                    onClick={() => removeTip(index)}
                    className="text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 px-8 py-3 rounded-xl font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20"
            >
              {isSubmitting ? 'Adding...' : 'Add Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 