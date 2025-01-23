'use client';

import { useEffect, useState, useMemo } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/solid';
import { getBreathTests, BreathTest } from '@/services/breathTests';
import { useLibrary } from '@/context/LibraryContext';

export default function BreathingTests() {
  const [tests, setTests] = useState<BreathTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchQuery } = useLibrary();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const data = await getBreathTests();
        setTests(data);
      } catch (err) {
        setError('Failed to load breathing tests');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const filteredTests = useMemo(() => {
    if (!searchQuery) return tests;
    
    const query = searchQuery.toLowerCase();
    return tests.filter(test => {
      const title = test.title.toLowerCase();
      const description = test.description.toLowerCase();
      const type = test.type?.name?.toLowerCase() || '';
      const instructions = test.instructions?.join(' ').toLowerCase() || '';

      return (
        title.includes(query) ||
        description.includes(query) ||
        type.includes(query) ||
        instructions.includes(query)
      );
    });
  }, [tests, searchQuery]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading breathing tests...</div>
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
          <h2 className="text-2xl font-bold text-white mb-2">Breathing Tests</h2>
          <p className="text-gray-400">
            {filteredTests.length} {filteredTests.length === 1 ? 'test' : 'tests'} found
          </p>
        </div>
        <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 px-4 py-2 rounded-lg font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all">
          Add Test
        </button>
      </div>

      <div className="space-y-4">
        {filteredTests.map((test) => (
          <div
            key={test.id}
            className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">
                {test.title}
              </h3>
              <div className="flex items-center space-x-3">
                {test.type?.name && (
                  <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                    {test.type.name}
                  </span>
                )}
                {test.duration && (
                  <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                    {test.duration}
                  </span>
                )}
                {test.difficulty && (
                  <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                    {test.difficulty}
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-400">{test.description}</p>
            
            {test.instructions && test.instructions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white mb-2">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {test.instructions.map((instruction, index) => (
                    <li key={index} className="text-gray-400">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {test.metrics && test.metrics.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white mb-2">Metrics:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.metrics.map((metric, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="font-medium text-white">{metric.name}</div>
                      <div className="text-sm text-gray-400">{metric.description}</div>
                      <div className="text-xs text-gray-500 mt-1">Unit: {metric.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {test.normalRanges && test.normalRanges.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-white mb-2">Normal Ranges:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.normalRanges.map((range, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="font-medium text-white">{range.metric}</div>
                      <div className="text-sm text-gray-400">
                        {range.min} - {range.max} {range.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 