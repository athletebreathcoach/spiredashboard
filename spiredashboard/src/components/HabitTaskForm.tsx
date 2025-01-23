'use client';

import { useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

interface HabitTaskFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editItem?: any; // The item to edit, if in edit mode
}

const ICONS = [
  'barbell-outline',
  'water-outline',
  'bed-outline',
  'book-outline',
  'walk-outline',
  'bicycle-outline',
  'nutrition-outline',
  'meditate-outline',
  'journal-outline',
  'timer-outline',
  'fitness-outline',
  'heart-outline'
];

const FREQUENCIES = [
  'Daily',
  'Weekly',
  'Monthly',
  'Weekdays',
  'Weekends',
  'Custom'
];

const PRIORITIES = [
  'Low',
  'Medium',
  'High'
];

const CATEGORIES = [
  'Health',
  'Fitness',
  'Mindfulness',
  'Productivity',
  'Learning',
  'Lifestyle',
  'Personal',
  'Work'
];

export default function HabitTaskForm({ onClose, onSuccess, editItem }: HabitTaskFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'habit', // or 'task'
    categoryId: '',
    icon: ICONS[0],
    frequency: '',
    priority: '',
    metrics: {} as Record<string, string | number | boolean>
  });

  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with edit data if provided
  useEffect(() => {
    if (editItem) {
      setFormData({
        title: editItem.title || '',
        description: editItem.description || '',
        type: editItem.type || 'habit',
        categoryId: editItem.categoryId || '',
        icon: editItem.icon || ICONS[0],
        frequency: editItem.frequency || '',
        priority: editItem.priority || '',
        metrics: editItem.metrics || {}
      });
    }
  }, [editItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editItem) {
        // Update existing item
        const itemRef = doc(db, 'habitstasks', editItem.id);
        const itemData = {
          ...formData,
          updatedAt: new Date()
        };
        
        console.log('Updating habit/task in Firebase:', itemData);
        await updateDoc(itemRef, itemData);
        console.log('Habit/task updated successfully');
      } else {
        // Create new item
        const habitsTasksRef = collection(db, 'habitstasks');
        const itemData = {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('Saving habit/task to Firebase:', itemData);
        const docRef = await addDoc(habitsTasksRef, itemData);
        console.log('Habit/task saved successfully with ID:', docRef.id);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving habit/task:', error);
      alert('Failed to save habit/task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMetric = () => {
    if (newMetricName.trim() && newMetricValue.trim()) {
      setFormData(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [newMetricName.trim()]: newMetricValue.trim()
        }
      }));
      setNewMetricName('');
      setNewMetricValue('');
    }
  };

  const removeMetric = (key: string) => {
    setFormData(prev => {
      const newMetrics = { ...prev.metrics };
      delete newMetrics[key];
      return { ...prev, metrics: newMetrics };
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMetric();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {editItem ? 'Edit' : 'Add New'} {formData.type === 'habit' ? 'Habit' : 'Task'}
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
            {/* Type Selection */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'habit' }))}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  formData.type === 'habit'
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
              >
                Habit
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'task' }))}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  formData.type === 'task'
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
              >
                Task
              </button>
            </div>

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
              {/* Category */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category.toLowerCase()}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Icon */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                  required
                >
                  {ICONS.map(icon => (
                    <option key={icon} value={icon}>{icon.replace('-outline', '').replace(/-/g, ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Frequency or Priority */}
              {formData.type === 'habit' ? (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={e => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                    required
                  >
                    <option value="">Select frequency</option>
                    {FREQUENCIES.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-yellow-500 transition-colors">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all appearance-none"
                    required
                  >
                    <option value="">Select priority</option>
                    {PRIORITIES.map(priority => (
                      <option key={priority} value={priority.toLowerCase()}>{priority}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Metrics Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-400">Metrics</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMetricName}
                onChange={e => setNewMetricName(e.target.value)}
                className="flex-1 bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                placeholder="Metric name..."
              />
              <input
                type="text"
                value={newMetricValue}
                onChange={e => setNewMetricValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-gray-800/50 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                placeholder="Metric value..."
              />
              <button
                type="button"
                onClick={addMetric}
                className="bg-yellow-500/10 text-yellow-500 px-6 py-2 rounded-xl font-medium hover:bg-yellow-500/20 transition-all border border-yellow-500/20"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(formData.metrics).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-gray-800/30 p-4 rounded-xl group"
                >
                  <span className="flex-1 text-gray-300">
                    <span className="font-medium">{key}:</span> {value.toString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMetric(key)}
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
              {isSubmitting ? 'Saving...' : editItem ? 'Save Changes' : 'Add ' + (formData.type === 'habit' ? 'Habit' : 'Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 