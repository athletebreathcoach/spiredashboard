import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/config/firebase';
import { collection, query, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { scheduleExercise, scheduleNote, scheduleGuidedSession, scheduleBreathProtocol } from '@/services/scheduledExercises';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface ActivitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  date: Date;
  timeOfDay: string;
  selectedClientId: string;
  onActivityScheduled?: () => void;
}

interface Activity {
  id: string;
  title?: string;
  name?: string;
  type: 'exercise' | 'breathProtocol' | 'breathTest' | 'guidedSession' | 'habit' | 'task' | 'education' | 'note';
  description?: string;
  videoId?: string;
  duration?: string;
  videoUrl?: string;
  sessionType?: string;
  intensity?: string;
  priority?: string;
  collectionType?: string;
  activityType?: string;
  content?: string;
  linkPreviews?: {
    url: string;
    type: 'youtube' | 'image' | 'link';
    videoId?: string;
  }[];
  [key: string]: any;
}

interface AllActivities {
  exercises: any[];
  breathProtocols: any[];
  breathTests: any[];
  guidedSessions: any[];
  habits: any[];
  education: any[];
}

interface ActivityItem {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  type?: string;
  collectionType?: string;
  content?: string;
  linkPreviews?: {
    url: string;
    type: 'youtube' | 'image' | 'link';
    videoId?: string;
  }[];
  [key: string]: any;
}

interface BreathProtocolMetrics {
  inhaleTime: number;
  inhaleHoldTime: number;
  exhaleTime: number;
  exhaleHoldTime: number;
  rounds: number;
  restAfter: number;
  totalTime: number;
}

type ActivityType = Activity['type'];

export default function ActivitySelectorModal({
  isOpen,
  onClose,
  position,
  date,
  timeOfDay,
  selectedClientId,
  onActivityScheduled
}: ActivitySelectorModalProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allActivities, setAllActivities] = useState<AllActivities>({
    exercises: [],
    breathProtocols: [],
    breathTests: [],
    guidedSessions: [],
    habits: [],
    education: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [exerciseMetrics, setExerciseMetrics] = useState({
    sets: [{
      reps: '',
      weight: '',
      rest: '00:00'
    }],
    eachSide: false
  });
  const [protocolMetrics, setProtocolMetrics] = useState<BreathProtocolMetrics>({
    inhaleTime: 4,
    inhaleHoldTime: 0,
    exhaleTime: 4,
    exhaleHoldTime: 0,
    rounds: 3,
    restAfter: 0,
    totalTime: 24 // (4+0+4+0) * 3
  });

  const activityTypes = [
    { id: 'exercise', name: 'Exercise', icon: '💪', collection: 'exercises' },
    { id: 'breathProtocol', name: 'Breath Protocol', icon: '🫁', collection: 'breathProtocols' },
    { id: 'breathTest', name: 'Breath Test', icon: '🌬️', collection: 'breathTests' },
    { id: 'guidedSession', name: 'Guided Session', icon: '🎯', collection: 'guidedSessions' },
    { id: 'habit', name: 'Habit', icon: '🔄', collection: 'habitstasks' },
    { id: 'task', name: 'Task', icon: '✓', collection: 'habitstasks' },
    { id: 'education', name: 'Education', icon: '📚', collection: 'education/content/documents' },
    { id: 'note', name: 'Note', icon: '📝', collection: null }
  ];

  // Calculate modal position based on viewport boundaries
  useEffect(() => {
    if (isOpen) {
      const MODAL_WIDTH = 300;
      const MODAL_HEIGHT = 500; // Increased to better account for content
      const VIEWPORT_PADDING = 16;
      const BUTTON_WIDTH = 24; // Width of the + button

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate x position
      let x;
      
      // If button is in the right third of the screen, align modal left of the button
      if (position.x > viewportWidth * 0.7) {
        x = position.x - MODAL_WIDTH - VIEWPORT_PADDING;
      }
      // If button is in the left third of the screen, align modal right of the button
      else if (position.x < viewportWidth * 0.3) {
        x = position.x + BUTTON_WIDTH + VIEWPORT_PADDING;
      }
      // Otherwise center the modal on the button
      else {
        x = position.x - (MODAL_WIDTH / 2) + (BUTTON_WIDTH / 2);
      }
      
      // Ensure modal doesn't go off screen left or right
      x = Math.max(VIEWPORT_PADDING, x); // Left boundary
      x = Math.min(viewportWidth - MODAL_WIDTH - VIEWPORT_PADDING, x); // Right boundary

      // Calculate y position
      let y = position.y + BUTTON_WIDTH + 8; // Position below button with small gap
      
      // If modal would go off bottom of screen, position it above the button
      if (y + MODAL_HEIGHT > viewportHeight - VIEWPORT_PADDING) {
        y = position.y - MODAL_HEIGHT - 8;
      }

      // Ensure modal doesn't go off screen top
      y = Math.max(VIEWPORT_PADDING, y);

      setModalPosition({ x, y });
    }
  }, [isOpen, position]);

  // Fetch all activities on mount
  useEffect(() => {
    const fetchAllActivities = async () => {
      try {
        setLoading(true);
        const collections = ['exercises', 'breathProtocols', 'breathTests', 'guidedSessions', 'habitstasks', 'education/content/documents'];
        const results: any = {};

        await Promise.all(collections.map(async (collectionName) => {
          const collRef = collection(db, collectionName);
          const snapshot = await getDocs(query(collRef));
          results[collectionName] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            collectionType: collectionName
          }));
        }));

        setAllActivities({
          exercises: results.exercises || [],
          breathProtocols: results.breathProtocols || [],
          breathTests: results.breathTests || [],
          guidedSessions: results.guidedSessions || [],
          habits: (results.habitstasks || []).filter((item: any) => item.type === 'habit'),
          education: results['education/content/documents'] || []
        });
      } catch (error) {
        console.error('Error fetching all activities:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchAllActivities();
    }
  }, [isOpen]);

  const getFilteredActivities = (): Activity[] => {
    if (!searchQuery.trim()) {
      return step === 1 ? [] : activities;
    }

    const query = searchQuery.toLowerCase();

    if (step === 1) {
      // Search across all activities
      return Object.entries(allActivities).flatMap(([type, items]) => 
        items
          .filter((item: ActivityItem) => 
            (item.title || item.name || '').toLowerCase().includes(query) ||
            (item.description || '').toLowerCase().includes(query)
          )
          .map((item: ActivityItem): Activity => {
            const baseType = type.replace(/s$/, '') as Activity['type'];
            return {
              ...item,
              id: item.id || '',
              type: baseType,
              activityType: type
            };
          })
      );
    } else {
      // Search within selected category
      return activities.filter((activity: Activity) =>
        (activity.title || activity.name || '').toLowerCase().includes(query) ||
        (activity.description || '').toLowerCase().includes(query)
      );
    }
  };

  const handleSelectType = async (typeId: string) => {
    setSelectedType(typeId);
    setLoading(true);
    
    try {
      if (typeId === 'note') {
        // For notes, we don't need to fetch anything
        setActivities([]);
        setStep(2);
        setLoading(false);
        return;
      }

      const selectedTypeInfo = activityTypes.find(t => t.id === typeId);
      if (!selectedTypeInfo || !selectedTypeInfo.collection) return;

      const activitiesRef = collection(db, selectedTypeInfo.collection);
      const q = query(activitiesRef);
      const snapshot = await getDocs(q);
      
      const fetchedActivities = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || data.name || 'Untitled',
            type: typeId as Activity['type'],
            description: data.description,
            pattern: data.pattern,
            rounds: data.rounds,
            duration: data.duration,
            ...data
          } as Activity;
        })
        .filter(activity => {
          if (typeId === 'habit') return activity.type === 'habit';
          if (typeId === 'task') return activity.type === 'task';
          return true;
        });

      setActivities(fetchedActivities);
      setStep(2);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    // Don't schedule immediately - wait for configuration
  };

  const handleScheduleActivity = async () => {
    if (!selectedType || !selectedActivity || !selectedActivity.id) return;

    try {
      setLoading(true);
      const scheduledDateTime = new Date(date);

      if (selectedType === 'note') {
        if (!noteTitle.trim()) {
          alert('Please enter a note title');
          return;
        }

        await scheduleNote(selectedClientId, scheduledDateTime, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
          timeOfDay: timeOfDay.toLowerCase()
        });
      } else {
        let scheduleData;
        let collectionPath = '';
        
        const activityTitle = selectedActivity.title || selectedActivity.name || 'Untitled';
        
        switch (selectedType) {
          case 'exercise':
            scheduleData = {
              exerciseTitle: activityTitle,
              type: 'exercise',
              description: selectedActivity.description || '',
              videoId: selectedActivity.videoId,
              timeOfDay: timeOfDay.toLowerCase(),
              metrics: {
                timeOfDay: timeOfDay.toLowerCase(),
                completed: false,
                sets: exerciseMetrics.sets,
                eachSide: exerciseMetrics.eachSide,
                notes: ''
              },
              coachNotes: coachNotes
            };
            collectionPath = selectedActivity.id;
            break;

          case 'breathProtocol': {
            if (!selectedActivity || !('id' in selectedActivity)) break;
            const breathProtocol = selectedActivity as Activity;
            await scheduleBreathProtocol(
              selectedClientId,
              breathProtocol.id,
              scheduledDateTime,
              {
                metrics: {
                  timeOfDay: timeOfDay.toLowerCase(),
                  settings: {
                    pattern: {
                      inhale: protocolMetrics.inhaleTime,
                      inHold: protocolMetrics.inhaleHoldTime,
                      exhale: protocolMetrics.exhaleTime,
                      exHold: protocolMetrics.exhaleHoldTime
                    },
                    rounds: protocolMetrics.rounds,
                    duration: protocolMetrics.totalTime.toString()
                  }
                },
                protocol: {
                  type: 'standard',
                  pattern: {
                    inhale: protocolMetrics.inhaleTime,
                    inHold: protocolMetrics.inhaleHoldTime,
                    exhale: protocolMetrics.exhaleTime,
                    exHold: protocolMetrics.exhaleHoldTime
                  },
                  rounds: protocolMetrics.rounds,
                  duration: protocolMetrics.totalTime.toString()
                },
                coachNotes: coachNotes
              }
            );
            if (onActivityScheduled) {
              onActivityScheduled();
            }
            onClose();
            break;
          }

          case 'breathTest':
            scheduleData = {
              exerciseTitle: activityTitle,
              type: 'breathTest',
              description: selectedActivity.description,
              testId: selectedActivity.id,
              timeOfDay: timeOfDay.toLowerCase(),
              metrics: {
                timeOfDay: timeOfDay.toLowerCase(),
                completed: false
              },
              coachNotes: coachNotes
            };
            collectionPath = selectedActivity.id;
            break;

          case 'guidedSession':
            scheduleData = {
              exerciseTitle: activityTitle,
              type: 'guidedSession',
              description: selectedActivity.description,
              sessionId: selectedActivity.id,
              duration: selectedActivity.duration,
              videoUrl: selectedActivity.videoUrl,
              sessionType: selectedActivity.type,
              intensity: selectedActivity.intensity,
              timeOfDay: timeOfDay.toLowerCase(),
              metrics: {
                timeOfDay: timeOfDay.toLowerCase(),
                completed: false
              },
              coachNotes: coachNotes
            };
            collectionPath = selectedActivity.id;
            break;

          case 'habit':
            scheduleData = {
              exerciseTitle: activityTitle,
              type: 'habit',
              description: selectedActivity.description,
              habitId: selectedActivity.id,
              timeOfDay: timeOfDay.toLowerCase(),
              metrics: {
                timeOfDay: timeOfDay.toLowerCase(),
                completed: false,
                streak: 0
              },
              coachNotes: coachNotes
            };
            collectionPath = selectedActivity.id;
            break;

          case 'task':
            scheduleData = {
              exerciseTitle: activityTitle,
              type: 'task',
              description: selectedActivity.description,
              taskId: selectedActivity.id,
              timeOfDay: timeOfDay.toLowerCase(),
              metrics: {
                timeOfDay: timeOfDay.toLowerCase(),
                completed: false,
                priority: selectedActivity.priority || 'medium'
              },
              coachNotes: coachNotes
            };
            collectionPath = selectedActivity.id;
            break;

          case 'education':
            scheduleData = {
              exerciseTitle: activityTitle,
              type: 'education',
              description: selectedActivity.description,
              content: selectedActivity.content,
              documentId: selectedActivity.id,
              linkPreviews: selectedActivity.linkPreviews,
              timeOfDay: timeOfDay.toLowerCase(),
              metrics: {
                timeOfDay: timeOfDay.toLowerCase(),
                completed: false
              },
              coachNotes: coachNotes
            };
            collectionPath = selectedActivity.id; // Just use the ID directly since we'll construct the full path in scheduleExercise
            break;
        }

        if (!collectionPath) {
          throw new Error('Invalid activity type');
        }

        console.log('Scheduling activity:', {
          clientId: selectedClientId,
          activityId: selectedActivity.id,
          date: scheduledDateTime,
          data: scheduleData
        });

        await scheduleExercise(
          selectedClientId,
          collectionPath,
          scheduledDateTime,
          scheduleData
        );
      }
      
      setStep(1);
      setSelectedType(null);
      setSelectedActivity(null);
      setNoteTitle('');
      setNoteContent('');
      setCoachNotes('');
      setExerciseMetrics({
        sets: [{
          reps: '',
          weight: '',
          rest: '00:00'
        }],
        eachSide: false
      });
      setProtocolMetrics({
        inhaleTime: 4,
        inhaleHoldTime: 0,
        exhaleTime: 4,
        exhaleHoldTime: 0,
        rounds: 3,
        restAfter: 0,
        totalTime: 24 // (4+0+4+0) * 3
      });
    } catch (error) {
      console.error('Error scheduling activity:', error);
      alert('Failed to schedule activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedType(null);
      setSelectedActivity(null);
      setNoteTitle('');
      setNoteContent('');
      setCoachNotes('');
      setExerciseMetrics({
        sets: [{
          reps: '',
          weight: '',
          rest: '00:00'
        }],
        eachSide: false
      });
      setProtocolMetrics({
        inhaleTime: 4,
        inhaleHoldTime: 0,
        exhaleTime: 4,
        exhaleHoldTime: 0,
        rounds: 3,
        restAfter: 0,
        totalTime: 24 // (4+0+4+0) * 3
      });
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const modal = document.getElementById('activity-selector-modal');
      if (modal && !modal.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Add helper function to calculate total time
  const calculateTotalTime = (metrics: Partial<BreathProtocolMetrics>) => {
    const roundTime = (metrics.inhaleTime || 0) + 
                     (metrics.inhaleHoldTime || 0) + 
                     (metrics.exhaleTime || 0) + 
                     (metrics.exhaleHoldTime || 0);
    return roundTime * (metrics.rounds || 1);
  };

  // Update the renderConfirmationStep to include breath protocol UI
  const renderConfirmationStep = () => {
    if (!selectedActivity) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">
            Configure {selectedActivity.title}
          </h3>
          <button
            onClick={() => setSelectedActivity(null)}
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Back
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedType === 'exercise' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Sets
                </label>
                {exerciseMetrics.sets.map((set, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Reps"
                      value={set.reps}
                      onChange={(e) => {
                        const newSets = [...exerciseMetrics.sets];
                        newSets[index].reps = e.target.value;
                        setExerciseMetrics({ ...exerciseMetrics, sets: newSets });
                      }}
                      className="flex-1 px-3 py-2 bg-[#161B22] text-white rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Weight"
                      value={set.weight}
                      onChange={(e) => {
                        const newSets = [...exerciseMetrics.sets];
                        newSets[index].weight = e.target.value;
                        setExerciseMetrics({ ...exerciseMetrics, sets: newSets });
                      }}
                      className="flex-1 px-3 py-2 bg-[#161B22] text-white rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
                <button
                  onClick={() => setExerciseMetrics({
                    ...exerciseMetrics,
                    sets: [...exerciseMetrics.sets, { reps: '', weight: '', rest: '00:00' }]
                  })}
                  className="text-sm text-blue-500 hover:text-blue-400"
                >
                  + Add Set
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="eachSide"
                  checked={exerciseMetrics.eachSide}
                  onChange={(e) => setExerciseMetrics({ ...exerciseMetrics, eachSide: e.target.checked })}
                  className="rounded border-gray-700/50 bg-[#161B22] text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="eachSide" className="text-sm text-gray-300">
                  Each Side
                </label>
              </div>
            </div>
          )}

          {selectedType === 'breathProtocol' && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-4">
                  Total Time: {Math.floor(protocolMetrics.totalTime / 60)}m {protocolMetrics.totalTime % 60}s
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Inhale Time (s)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newMetrics = {
                            ...protocolMetrics,
                            inhaleTime: Math.max(1, protocolMetrics.inhaleTime - 1)
                          };
                          newMetrics.totalTime = calculateTotalTime(newMetrics);
                          setProtocolMetrics(newMetrics);
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-white">{protocolMetrics.inhaleTime}</span>
                      <button
                        onClick={() => {
                          const newMetrics = {
                            ...protocolMetrics,
                            inhaleTime: protocolMetrics.inhaleTime + 1
                          };
                          newMetrics.totalTime = calculateTotalTime(newMetrics);
                          setProtocolMetrics(newMetrics);
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Inhale Hold (s)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newMetrics = {
                            ...protocolMetrics,
                            inhaleHoldTime: Math.max(0, protocolMetrics.inhaleHoldTime - 1)
                          };
                          newMetrics.totalTime = calculateTotalTime(newMetrics);
                          setProtocolMetrics(newMetrics);
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-white">{protocolMetrics.inhaleHoldTime}</span>
                      <button
                        onClick={() => {
                          const newMetrics = {
                            ...protocolMetrics,
                            inhaleHoldTime: protocolMetrics.inhaleHoldTime + 1
                          };
                          newMetrics.totalTime = calculateTotalTime(newMetrics);
                          setProtocolMetrics(newMetrics);
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Exhale Time (s)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newMetrics = {
                            ...protocolMetrics,
                            exhaleTime: Math.max(1, protocolMetrics.exhaleTime - 1)
                          };
                          newMetrics.totalTime = calculateTotalTime(newMetrics);
                          setProtocolMetrics(newMetrics);
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-white">{protocolMetrics.exhaleTime}</span>
                      <button
                        onClick={() => {
                          const newMetrics = {
                            ...protocolMetrics,
                            exhaleTime: protocolMetrics.exhaleTime + 1
                          };
                          newMetrics.totalTime = calculateTotalTime(newMetrics);
                          setProtocolMetrics(newMetrics);
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Exhale Hold (s)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newMetrics = {
                            ...protocolMetrics,
                            exhaleHoldTime: Math.max(0, protocolMetrics.exhaleHoldTime - 1)
                          };
                          newMetrics.totalTime = calculateTotalTime(newMetrics);
                          setProtocolMetrics(newMetrics);
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-white">{protocolMetrics.exhaleHoldTime}</span>
                      <button
                        onClick={() => {
                          const newMetrics = {
                            ...protocolMetrics,
                            exhaleHoldTime: protocolMetrics.exhaleHoldTime + 1
                          };
                          newMetrics.totalTime = calculateTotalTime(newMetrics);
                          setProtocolMetrics(newMetrics);
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Rounds
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newMetrics = {
                            ...protocolMetrics,
                            rounds: Math.max(1, protocolMetrics.rounds - 1)
                          };
                          newMetrics.totalTime = calculateTotalTime(newMetrics);
                          setProtocolMetrics(newMetrics);
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-white">{protocolMetrics.rounds}</span>
                      <button
                        onClick={() => {
                          const newMetrics = {
                            ...protocolMetrics,
                            rounds: protocolMetrics.rounds + 1
                          };
                          newMetrics.totalTime = calculateTotalTime(newMetrics);
                          setProtocolMetrics(newMetrics);
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Rest After (s)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setProtocolMetrics({
                            ...protocolMetrics,
                            restAfter: Math.max(0, protocolMetrics.restAfter - 30)
                          });
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-white">{protocolMetrics.restAfter}</span>
                      <button
                        onClick={() => {
                          setProtocolMetrics({
                            ...protocolMetrics,
                            restAfter: protocolMetrics.restAfter + 30
                          });
                        }}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coach Notes - Available for all types */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Coach Notes
            </label>
            <textarea
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder="Add notes for the client..."
              className="w-full px-3 py-2 bg-[#161B22] text-white rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-32"
            />
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-700/50">
          <button
            onClick={handleScheduleActivity}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {loading ? 'Scheduling...' : 'Schedule Activity'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="activity-selector-modal"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className={`fixed z-50 bg-[#0D1117] rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden
            ${selectedType === 'note' && step === 2 ? 'w-[800px]' : 'w-[400px]'}`}
          style={{
            maxHeight: selectedType === 'note' && step === 2 ? 'calc(100vh - 40px)' : '90vh',
            minHeight: '300px',
            maxWidth: 'calc(100vw - 40px)',
            left: modalPosition.x,
            top: modalPosition.y
          }}
        >
          <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="flex-shrink-0 p-4 border-b border-gray-700/50">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={step === 1 ? "Search all activities..." : `Search ${selectedType}s...`}
                  className="w-full px-4 py-2 pl-10 bg-gray-800/50 text-white rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none placeholder-gray-500"
                />
                <svg
                  className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {step === 1 ? (
              <div className="flex-1 overflow-auto">
                {searchQuery.trim() ? (
                  // Show search results across all activities
                  <div className="p-4 space-y-2">
                    {getFilteredActivities().map((activity: Activity) => (
                      <button
                        key={activity.id}
                        onClick={() => {
                          const type = (activity.activityType || '').replace(/s$/, '');
                          setSelectedType(type);
                          setActivities([activity]);
                          setSelectedActivity(activity);
                          setStep(2);
                        }}
                        className="w-full text-left p-3 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                      >
                        <div className="font-medium text-white">{activity.title || activity.name}</div>
                        {activity.description && (
                          <div className="text-sm text-gray-300 mt-1">{activity.description}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1 capitalize">
                          {(activity.activityType || '').replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  // Show activity type grid
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Select Activity Type</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {activityTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleSelectType(type.id)}
                          className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                          disabled={loading}
                        >
                          <span className="text-xl mb-1">{type.icon}</span>
                          <span className="text-sm font-medium text-white">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedActivity ? 'Configure Activity' : selectedType === 'note' ? 'Create Note' : `Select ${selectedType}`}
                  </h3>
                  <button
                    onClick={() => {
                      if (selectedActivity) {
                        setSelectedActivity(null);
                      } else {
                        setStep(1);
                        setSearchQuery('');
                      }
                    }}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
                  >
                    ← Back
                  </button>
                </div>

                {loading ? (
                  <div className="flex-1 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : selectedType === 'note' ? (
                  <div className="flex flex-col flex-1 p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Title
                      </label>
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Enter note title"
                        className="w-full px-3 py-2.5 bg-[#161B22] text-white rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none placeholder-gray-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                      {/* Editor */}
                      <div className="flex flex-col min-h-0">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Content
                        </label>
                        <textarea
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Enter note content (Markdown supported)"
                          className="flex-1 w-full px-3 py-2.5 bg-[#161B22] text-white rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none resize-none font-mono text-sm placeholder-gray-500"
                        />
                      </div>
                      {/* Preview */}
                      <div className="flex flex-col min-h-0">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Preview
                        </label>
                        <div className="flex-1 px-3 py-2.5 bg-[#161B22] text-white rounded-lg border border-gray-700/50 overflow-y-auto">
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            >
                              {noteContent || '_No content yet_'}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={handleScheduleActivity}
                        disabled={loading || !noteTitle.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        {loading ? 'Scheduling...' : 'Schedule Note'}
                      </button>
                    </div>
                  </div>
                ) : selectedActivity ? (
                  <div className="flex flex-col flex-1">
                    <div className="flex-1 overflow-y-auto p-4">
                      {selectedType === 'exercise' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                              Sets
                            </label>
                            {exerciseMetrics.sets.map((set, index) => (
                              <div key={index} className="flex gap-2 mb-2">
                                <input
                                  type="text"
                                  placeholder="Reps"
                                  value={set.reps}
                                  onChange={(e) => {
                                    const newSets = [...exerciseMetrics.sets];
                                    newSets[index].reps = e.target.value;
                                    setExerciseMetrics({ ...exerciseMetrics, sets: newSets });
                                  }}
                                  className="flex-1 px-3 py-2 bg-[#161B22] text-white rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Weight"
                                  value={set.weight}
                                  onChange={(e) => {
                                    const newSets = [...exerciseMetrics.sets];
                                    newSets[index].weight = e.target.value;
                                    setExerciseMetrics({ ...exerciseMetrics, sets: newSets });
                                  }}
                                  className="flex-1 px-3 py-2 bg-[#161B22] text-white rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => setExerciseMetrics({
                                ...exerciseMetrics,
                                sets: [...exerciseMetrics.sets, { reps: '', weight: '', rest: '00:00' }]
                              })}
                              className="text-sm text-blue-500 hover:text-blue-400"
                            >
                              + Add Set
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="eachSide"
                              checked={exerciseMetrics.eachSide}
                              onChange={(e) => setExerciseMetrics({ ...exerciseMetrics, eachSide: e.target.checked })}
                              className="rounded border-gray-700/50 bg-[#161B22] text-blue-500 focus:ring-blue-500"
                            />
                            <label htmlFor="eachSide" className="text-sm text-gray-300">
                              Each Side
                            </label>
                          </div>
                        </div>
                      )}

                      {selectedType === 'breathProtocol' && (
                        <div className="space-y-6">
                          <div className="bg-gray-800/50 rounded-lg p-4">
                            <div className="text-sm text-gray-300 mb-4">
                              Total Time: {Math.floor(protocolMetrics.totalTime / 60)}m {protocolMetrics.totalTime % 60}s
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                  Inhale Time (s)
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const newMetrics = {
                                        ...protocolMetrics,
                                        inhaleTime: Math.max(1, protocolMetrics.inhaleTime - 1)
                                      };
                                      newMetrics.totalTime = calculateTotalTime(newMetrics);
                                      setProtocolMetrics(newMetrics);
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    -
                                  </button>
                                  <span className="w-12 text-center text-white">{protocolMetrics.inhaleTime}</span>
                                  <button
                                    onClick={() => {
                                      const newMetrics = {
                                        ...protocolMetrics,
                                        inhaleTime: protocolMetrics.inhaleTime + 1
                                      };
                                      newMetrics.totalTime = calculateTotalTime(newMetrics);
                                      setProtocolMetrics(newMetrics);
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                  Inhale Hold (s)
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const newMetrics = {
                                        ...protocolMetrics,
                                        inhaleHoldTime: Math.max(0, protocolMetrics.inhaleHoldTime - 1)
                                      };
                                      newMetrics.totalTime = calculateTotalTime(newMetrics);
                                      setProtocolMetrics(newMetrics);
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    -
                                  </button>
                                  <span className="w-12 text-center text-white">{protocolMetrics.inhaleHoldTime}</span>
                                  <button
                                    onClick={() => {
                                      const newMetrics = {
                                        ...protocolMetrics,
                                        inhaleHoldTime: protocolMetrics.inhaleHoldTime + 1
                                      };
                                      newMetrics.totalTime = calculateTotalTime(newMetrics);
                                      setProtocolMetrics(newMetrics);
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                  Exhale Time (s)
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const newMetrics = {
                                        ...protocolMetrics,
                                        exhaleTime: Math.max(1, protocolMetrics.exhaleTime - 1)
                                      };
                                      newMetrics.totalTime = calculateTotalTime(newMetrics);
                                      setProtocolMetrics(newMetrics);
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    -
                                  </button>
                                  <span className="w-12 text-center text-white">{protocolMetrics.exhaleTime}</span>
                                  <button
                                    onClick={() => {
                                      const newMetrics = {
                                        ...protocolMetrics,
                                        exhaleTime: protocolMetrics.exhaleTime + 1
                                      };
                                      newMetrics.totalTime = calculateTotalTime(newMetrics);
                                      setProtocolMetrics(newMetrics);
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                  Exhale Hold (s)
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const newMetrics = {
                                        ...protocolMetrics,
                                        exhaleHoldTime: Math.max(0, protocolMetrics.exhaleHoldTime - 1)
                                      };
                                      newMetrics.totalTime = calculateTotalTime(newMetrics);
                                      setProtocolMetrics(newMetrics);
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    -
                                  </button>
                                  <span className="w-12 text-center text-white">{protocolMetrics.exhaleHoldTime}</span>
                                  <button
                                    onClick={() => {
                                      const newMetrics = {
                                        ...protocolMetrics,
                                        exhaleHoldTime: protocolMetrics.exhaleHoldTime + 1
                                      };
                                      newMetrics.totalTime = calculateTotalTime(newMetrics);
                                      setProtocolMetrics(newMetrics);
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                  Rounds
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const newMetrics = {
                                        ...protocolMetrics,
                                        rounds: Math.max(1, protocolMetrics.rounds - 1)
                                      };
                                      newMetrics.totalTime = calculateTotalTime(newMetrics);
                                      setProtocolMetrics(newMetrics);
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    -
                                  </button>
                                  <span className="w-12 text-center text-white">{protocolMetrics.rounds}</span>
                                  <button
                                    onClick={() => {
                                      const newMetrics = {
                                        ...protocolMetrics,
                                        rounds: protocolMetrics.rounds + 1
                                      };
                                      newMetrics.totalTime = calculateTotalTime(newMetrics);
                                      setProtocolMetrics(newMetrics);
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                  Rest After (s)
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setProtocolMetrics({
                                        ...protocolMetrics,
                                        restAfter: Math.max(0, protocolMetrics.restAfter - 30)
                                      });
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    -
                                  </button>
                                  <span className="w-12 text-center text-white">{protocolMetrics.restAfter}</span>
                                  <button
                                    onClick={() => {
                                      setProtocolMetrics({
                                        ...protocolMetrics,
                                        restAfter: protocolMetrics.restAfter + 30
                                      });
                                    }}
                                    className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedType === 'education' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Content
                          </label>
                          <textarea
                            value={selectedActivity.content}
                            onChange={(e) => {
                              const newActivity = { ...selectedActivity, content: e.target.value };
                              setSelectedActivity(newActivity);
                            }}
                            placeholder="Enter education content"
                            className="w-full px-3 py-2 bg-[#161B22] text-white rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-32"
                          />
                        </div>
                      )}

                      {/* Coach Notes - Available for all types */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Coach Notes
                        </label>
                        <textarea
                          value={coachNotes}
                          onChange={(e) => setCoachNotes(e.target.value)}
                          placeholder="Add notes for the client..."
                          className="w-full px-3 py-2 bg-[#161B22] text-white rounded-lg border border-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-32"
                        />
                      </div>
                    </div>

                    <div className="flex-shrink-0 p-4 border-t border-gray-700/50">
                      <button
                        onClick={handleScheduleActivity}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        {loading ? 'Scheduling...' : 'Schedule Activity'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Activity selection list
                  <div className="overflow-y-auto max-h-[400px]">
                    {getFilteredActivities().map((activity: Activity) => (
                      <motion.button
                        key={activity.id}
                        onClick={() => setSelectedActivity(activity)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedActivity?.id === activity.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700/50 text-gray-100 hover:bg-gray-600/50'
                        }`}
                      >
                        <div className="font-medium">{activity.title}</div>
                        {activity.description && (
                          <div className="text-sm text-gray-300 mt-1 line-clamp-2">
                            {activity.description}
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 