'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  CheckCircleIcon,
  FireIcon,
  HeartIcon,
  SunIcon,
  BeakerIcon,
  DocumentTextIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/solid';
import { getHabits, Habit } from '@/services/habits';
import { useLibrary } from '@/context/LibraryContext';
import HabitTaskForm from '@/components/HabitTaskForm';
import { db } from '@/config/firebase';
import { deleteDoc, doc } from 'firebase/firestore';

const categoryIcons: { [key: string]: any } = {
  recovery: HeartIcon,
  breathing: BeakerIcon,
  wellness: SunIcon,
  performance: FireIcon,
  mindset: DocumentTextIcon,
  sleep: ClockIcon,
};

const categoryColors: { [key: string]: string } = {
  recovery: 'from-blue-600 to-blue-500',
  breathing: 'from-emerald-600 to-emerald-500',
  wellness: 'from-yellow-600 to-yellow-500',
  performance: 'from-red-600 to-red-500',
  mindset: 'from-purple-600 to-purple-500',
  sleep: 'from-indigo-600 to-indigo-500',
};

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const { searchQuery } = useLibrary();

  const fetchHabits = async () => {
    try {
      const data = await getHabits();
      setHabits(data);
    } catch (err) {
      setError('Failed to load habits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleDelete = async (habit: Habit) => {
    setHabitToDelete(habit);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!habitToDelete) return;

    try {
      await deleteDoc(doc(db, 'habitstasks', habitToDelete.id));
      setHabits(prev => prev.filter(h => h.id !== habitToDelete.id));
      setShowDeleteConfirm(false);
      setHabitToDelete(null);
    } catch (error) {
      console.error('Error deleting habit:', error);
      alert('Failed to delete habit. Please try again.');
    }
  };

  const handleEdit = (habit: Habit) => {
    setHabitToEdit(habit);
    setShowForm(true);
  };

  const filteredHabits = useMemo(() => {
    if (!searchQuery) return habits;
    
    const query = searchQuery.toLowerCase();
    return habits.filter(habit => {
      const title = habit.title.toLowerCase();
      const description = habit.description.toLowerCase();
      const type = habit.type.toLowerCase();
      const category = habit.categoryId.toLowerCase();

      return (
        title.includes(query) ||
        description.includes(query) ||
        type.includes(query) ||
        category.includes(query)
      );
    });
  }, [habits, searchQuery]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading habits...</div>
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
          <h2 className="text-2xl font-bold text-white mb-2">Habits & Tasks</h2>
          <p className="text-gray-400">
            {filteredHabits.length} {filteredHabits.length === 1 ? 'item' : 'items'} found
          </p>
        </div>
        <button 
          onClick={() => {
            setHabitToEdit(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all"
        >
          Add Item
        </button>
      </div>

      <div className="space-y-4">
        {filteredHabits.map((habit) => {
          const CategoryIcon = categoryIcons[habit.categoryId] || CheckCircleIcon;
          const categoryColor = categoryColors[habit.categoryId] || 'from-gray-600 to-gray-500';

          return (
            <div
              key={habit.id}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <CategoryIcon className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-bold text-white">
                    {habit.title}
                  </h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm text-white bg-gradient-to-r ${categoryColor} px-3 py-1 rounded-full`}>
                    {habit.categoryId}
                  </span>
                  <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full capitalize">
                    {habit.type}
                  </span>
                  {habit.priority && (
                    <span className={`text-sm text-white px-3 py-1 rounded-full ${
                      habit.priority === 'high' ? 'bg-red-500' :
                      habit.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}>
                      {habit.priority}
                    </span>
                  )}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(habit);
                      }}
                      className="text-gray-500 hover:text-yellow-500 transition-colors"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(habit);
                      }}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-gray-400">{habit.description}</p>
              
              {habit.frequency && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Frequency</h4>
                  <div className="text-gray-400">
                    {habit.frequency}
                  </div>
                </div>
              )}

              {Object.keys(habit.metrics).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Metrics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(habit.metrics).map(([key, value]) => (
                      <div key={key} className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-500 capitalize">{key}</div>
                        <div className="text-gray-400">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <HabitTaskForm
          onClose={() => {
            setShowForm(false);
            setHabitToEdit(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setHabitToEdit(null);
            fetchHabits();
          }}
          editItem={habitToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl p-8 max-w-md w-full border border-gray-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Delete {habitToDelete?.type}</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{habitToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setHabitToDelete(null);
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