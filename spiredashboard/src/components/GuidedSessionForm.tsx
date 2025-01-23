'use client';

import { useState } from 'react';
import { db } from '@/config/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';

interface GuidedSessionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SESSION_TYPES = [
  'Strength',
  'Cardio',
  'Flexibility',
  'Meditation',
  'Yoga',
  'Recovery',
  'HIIT',
  'Mobility'
];

const INTENSITY_LEVELS = [
  'Low',
  'Medium',
  'High',
  'Variable'
];

const DURATIONS = [
  '5 min',
  '10 min',
  '15 min',
  '20 min',
  '30 min',
  '45 min',
  '60 min'
];

export default function GuidedSessionForm({ onClose, onSuccess }: GuidedSessionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: { name: '' },
    duration: '',
    intensity: '',
    videoUrl: '',
    tags: [] as string[]
  });

  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const sessionsRef = collection(db, 'guidedSessions');
      
      // Create a reference to the type document
      const typeRef = doc(db, 'sessionTypes', formData.type.name.toLowerCase().replace(/\s+/g, '-'));
      
      const sessionData = {
        title: formData.title,
        description: formData.description,
        type: {
          name: formData.type.name,
          ref: typeRef
        },
        duration: formData.duration,
        intensity: formData.intensity,
        videoUrl: formData.videoUrl,
        tags: formData.tags,
        createdAt: new Date()
      };
      
      console.log('Saving guided session to Firebase:', sessionData);
      const docRef = await addDoc(sessionsRef, sessionData);
      console.log('Guided session saved successfully with ID:', docRef.id);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding guided session:', error);
      alert('Failed to add guided session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Add New Guided Session
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
          <div className="space-y-6">
            {/* Title */}
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

            {/* Description */}
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
              {/* Session Type */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  Session Type
                </label>
                <select
                  value={formData.type.name}
                  onChange={e => setFormData(prev => ({ ...prev, type: { name: e.target.value } }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select type</option>
                  {SESSION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select duration</option>
                  {DURATIONS.map(duration => (
                    <option key={duration} value={duration}>{duration}</option>
                  ))}
                </select>
              </div>

              {/* Intensity */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  Intensity
                </label>
                <select
                  value={formData.intensity}
                  onChange={e => setFormData(prev => ({ ...prev, intensity: e.target.value }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select intensity</option>
                  {INTENSITY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Video URL */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={e => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                  placeholder="e.g., https://youtube.com/watch?v=..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-400">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                placeholder="Add tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-yellow-500/10 text-yellow-500 px-6 py-2 rounded-xl font-medium hover:bg-yellow-500/20 transition-all border border-yellow-500/20"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-xl border border-yellow-500/20 flex items-center gap-2 group"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="text-yellow-500/50 hover:text-yellow-500 transition-colors"
                  >
                    ×
                  </button>
                </span>
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
              {isSubmitting ? 'Adding...' : 'Add Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 