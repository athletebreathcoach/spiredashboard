'use client';

import { useEffect, useState, useMemo } from 'react';
import { FireIcon } from '@heroicons/react/24/solid';
import { getExercises, Exercise } from '@/services/exercises';
import { useLibrary } from '@/context/LibraryContext';
import ExerciseForm from '@/components/ExerciseForm';

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { searchQuery } = useLibrary();

  const fetchExercises = async () => {
    try {
      const data = await getExercises();
      console.log('Fetched exercises:', data); // Debug log
      setExercises(data);
    } catch (err) {
      setError('Failed to load exercises');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const filteredExercises = useMemo(() => {
    if (!searchQuery) return exercises;
    
    const query = searchQuery.toLowerCase();
    return exercises.filter(exercise => {
      const name = exercise?.name?.toLowerCase() || exercise?.title?.toLowerCase() || '';
      const description = exercise?.description?.toLowerCase() || '';
      const type = exercise?.type?.name?.toLowerCase() || '';
      const muscleGroup = exercise?.primaryMuscleGroup?.name?.toLowerCase() || '';

      return (
        name.includes(query) ||
        description.includes(query) ||
        type.includes(query) ||
        muscleGroup.includes(query)
      );
    });
  }, [exercises, searchQuery]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading exercises...</div>
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
          <h2 className="text-2xl font-bold text-white mb-2">Exercises</h2>
          <p className="text-gray-400">
            {filteredExercises.length} {filteredExercises.length === 1 ? 'exercise' : 'exercises'} found
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all"
        >
          Add Exercise
        </button>
      </div>

      <div className="space-y-4">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">
                {exercise.title || exercise.name}
              </h3>
            </div>
            <p className="text-gray-400 mb-3">{exercise.description}</p>
            
            <div className="flex flex-wrap gap-2">
              {exercise.type?.name && (
                <span className="text-sm text-blue-200 bg-blue-900/50 px-3 py-1 rounded-full border border-blue-700/50">
                  {exercise.type.name}
                </span>
              )}
              {exercise.primaryMuscleGroup?.name && (
                <span className="text-sm text-green-200 bg-green-900/50 px-3 py-1 rounded-full border border-green-700/50">
                  {exercise.primaryMuscleGroup.name}
                </span>
              )}
              {exercise.equipment && Object.values(exercise.equipment).map((equip, index) => (
                <span key={index} className="text-sm text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full border border-purple-700/50">
                  {equip.name}
                </span>
              ))}
              {exercise.duration && (
                <span className="text-sm text-orange-200 bg-orange-900/50 px-3 py-1 rounded-full border border-orange-700/50">
                  {exercise.duration}
                </span>
              )}
              {exercise.difficulty && (
                <span className="text-sm text-red-200 bg-red-900/50 px-3 py-1 rounded-full border border-red-700/50">
                  {exercise.difficulty}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <ExerciseForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchExercises();
          }}
        />
      )}
    </div>
  );
} 