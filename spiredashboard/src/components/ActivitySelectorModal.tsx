import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/config/firebase';
import { collection, query, getDocs, addDoc, Timestamp } from 'firebase/firestore';

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
  title: string;
  type: string;
  description?: string;
  [key: string]: any;
}

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
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  const activityTypes = [
    { id: 'exercise', name: 'Exercise', icon: '💪', collection: 'exercises' },
    { id: 'breathProtocol', name: 'Breath Protocol', icon: '🫁', collection: 'breathProtocols' },
    { id: 'breathTest', name: 'Breath Test', icon: '🌬️', collection: 'breathTests' },
    { id: 'guidedSession', name: 'Guided Session', icon: '🎯', collection: 'guidedSessions' },
    { id: 'habit', name: 'Habit', icon: '🔄', collection: 'habitstasks' },
    { id: 'task', name: 'Task', icon: '✓', collection: 'habitstasks' }
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

  const handleSelectType = async (typeId: string) => {
    setSelectedType(typeId);
    setLoading(true);
    
    try {
      const selectedTypeInfo = activityTypes.find(t => t.id === typeId);
      if (!selectedTypeInfo) return;

      const activitiesRef = collection(db, selectedTypeInfo.collection);
      const q = query(activitiesRef);
      const snapshot = await getDocs(q);
      
      const fetchedActivities = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || data.name || 'Untitled',
            type: typeId,
            description: data.description,
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

  const handleScheduleActivity = async () => {
    if (!selectedActivity) return;

    try {
      setLoading(true);
      const scheduledDateTime = new Date(date);
      
      // Create the scheduled exercise
      const scheduledExercise = {
        userId: selectedClientId,
        exerciseId: selectedActivity.id,
        exerciseTitle: selectedActivity.title,
        scheduledDateTime: Timestamp.fromDate(scheduledDateTime),
        status: 'scheduled',
        metrics: {
          timeOfDay: timeOfDay.toLowerCase(),
          completed: false
        },
        ...selectedActivity // This will include the type and other data
      };

      await addDoc(collection(db, 'scheduledExercises'), scheduledExercise);
      
      if (onActivityScheduled) {
        onActivityScheduled();
      }
      
      onClose();
      setStep(1);
      setSelectedType(null);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Error scheduling activity:', error);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="activity-selector-modal"
          initial={{ 
            scale: 0.2,
            opacity: 0,
            x: position.x,
            y: position.y
          }}
          animate={{ 
            scale: 1,
            opacity: 1,
            x: modalPosition.x,
            y: modalPosition.y
          }}
          exit={{ 
            scale: 0.2,
            opacity: 0,
            x: position.x,
            y: position.y
          }}
          transition={{ type: "spring", duration: 0.5 }}
          className="fixed z-50 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-[300px]"
        >
          <div className="p-4">
            {step === 1 ? (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Select Activity Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {activityTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleSelectType(type.id)}
                      className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                      disabled={loading}
                    >
                      <span className="text-2xl mb-2">{type.icon}</span>
                      <span className="text-sm font-medium text-white">{type.name}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Select {selectedType}</h3>
                  <button
                    onClick={() => setStep(1)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ← Back
                  </button>
                </div>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {activities.map((activity) => (
                      <button
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
                      </button>
                    ))}
                  </div>
                )}
                {selectedActivity && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleScheduleActivity}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Scheduling...' : 'Schedule'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 