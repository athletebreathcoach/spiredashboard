'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isToday, endOfWeek } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import ClientSelector from '@/components/ClientSelector';
import ActivitySelectorModal from '@/components/ActivitySelectorModal';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, Timestamp, deleteDoc, doc, getDoc } from 'firebase/firestore';

interface Client {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isGroup?: boolean;
}

interface ActivityType {
  name: string;
  id: string;
  ref?: any;
}

interface ScheduledActivity {
  id: string;
  exerciseTitle: string;
  type: string | ActivityType;  // Can be either a string or an ActivityType object
  exerciseType?: string;
  scheduledDateTime: Timestamp;
  status: string;
  metrics: {
    timeOfDay: string;
    [key: string]: any;
  };
}

interface ActivityCardProps {
  activity: ScheduledActivity;
  onActivityClick: (activity: ScheduledActivity, event: React.MouseEvent) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onActivityClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActivityColor = (type: string | ActivityType) => {
    const typeStr = typeof type === 'string' ? type : type.name;
    switch (typeStr.toLowerCase()) {
      case 'exercise':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'breathprotocol':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'breathtest':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'guidedsession':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'habit':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      case 'task':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const typeStr = typeof activity.type === 'string' ? activity.type : activity.type.name;
  const colorClasses = getActivityColor(activity.type);

  return (
    <div 
      className={`group relative rounded-md bg-gray-900/50 hover:bg-gray-800/50 transition-all duration-200 border ${
        colorClasses.split(' ')[2]
      } cursor-pointer`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="px-2 py-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className={`flex-shrink-0 w-5 h-5 ${colorClasses.split(' ')[0]} rounded-sm flex items-center justify-center text-sm mt-0.5`}>
              {activity.type === 'exercise' ? '💪' : 
               activity.type === 'habit' ? '🔄' : 
               activity.type === 'breathprotocol' ? '🫁' : '📝'}
            </div>
            <h3 className="text-sm font-medium text-white break-words min-w-0 pr-2">{activity.exerciseTitle}</h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button 
              className="p-0.5 hover:bg-gray-700/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onActivityClick(activity, e);
              }}
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button className="p-0.5 hover:bg-gray-700/50 rounded">
              <svg 
                className={`w-3.5 h-3.5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-1.5 pt-1.5 border-t border-gray-800">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`px-1.5 py-0.5 rounded-sm font-medium uppercase tracking-wider ${colorClasses.split(' ').slice(0, 2).join(' ')}`}>
                  {typeStr}
                </span>
                <span className="text-gray-400">
                  {activity.status || 'scheduled'}
                </span>
              </div>
              {activity.metrics && Object.keys(activity.metrics).length > 0 && (
                <div className="text-xs text-gray-400 grid grid-cols-2 gap-x-4 gap-y-1 pt-1.5 border-t border-gray-800">
                  {Object.entries(activity.metrics)
                    .filter(([key]) => key !== 'timeOfDay')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="capitalize opacity-75">{key}:</span>
                        <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div 
        className={`absolute right-1 bottom-1 w-2.5 h-2.5 rounded-full ${
          activity.status === 'completed' ? 'bg-green-500' : 
          activity.status === 'in_progress' ? 'bg-yellow-500' : 
          'bg-gray-600'
        }`} 
      />
    </div>
  );
};

export default function TrainingPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activities, setActivities] = useState<ScheduledActivity[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; timeOfDay: string } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ScheduledActivity | null>(null);
  const [isWeekView, setIsWeekView] = useState(false);

  // Generate week dates
  useEffect(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    setWeekDates(dates);
  }, [selectedDate]);

  // Set initial client as self
  useEffect(() => {
    if (user && !selectedClient) {
      setSelectedClient({ id: user.uid, firstName: 'My', lastName: 'Training' });
    }
  }, [user]);

  // Fetch scheduled activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!selectedClient) return;

      try {
        const start = startOfWeek(selectedDate);
        const end = endOfWeek(selectedDate);

        if (selectedClient.isGroup) {
          // If a group is selected, only get activities scheduled for the group
          const exercisesRef = collection(db, 'scheduledExercises');
          const q = query(
            exercisesRef,
            where('groupId', '==', selectedClient.id),
            where('scheduledDateTime', '>=', start),
            where('scheduledDateTime', '<=', end)
          );

          const snapshot = await getDocs(q);
          const groupActivities = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              exerciseTitle: data.exerciseTitle || 'Untitled',
              type: data.type || data.exerciseType || 'exercise',
              exerciseType: data.exerciseType,
              scheduledDateTime: data.scheduledDateTime,
              status: data.status || 'scheduled',
              metrics: {
                timeOfDay: (data.metrics?.timeOfDay || 'anytime').toLowerCase(),
                ...(data.metrics || {})
              }
            } as ScheduledActivity;
          });

          setActivities(groupActivities);
        } else {
          // If an individual client is selected, get their personal activities
          const exercisesRef = collection(db, 'scheduledExercises');
          const q = query(
            exercisesRef,
            where('userId', '==', selectedClient.id),
            where('scheduledDateTime', '>=', start),
            where('scheduledDateTime', '<=', end)
          );

          const snapshot = await getDocs(q);
          const clientActivities = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              exerciseTitle: data.exerciseTitle || 'Untitled',
              type: data.type || data.exerciseType || 'exercise',
              exerciseType: data.exerciseType,
              scheduledDateTime: data.scheduledDateTime,
              status: data.status || 'scheduled',
              metrics: {
                timeOfDay: (data.metrics?.timeOfDay || 'anytime').toLowerCase(),
                ...(data.metrics || {})
              }
            } as ScheduledActivity;
          });

          setActivities(clientActivities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
  }, [selectedClient, selectedDate]);

  const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Anytime'];

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
  };

  const getActivitiesForDateAndSlot = (date: Date, timeOfDay: string) => {
    try {
      return activities.filter(activity => {
        if (!activity?.scheduledDateTime) {
          console.log('Activity missing scheduledDateTime:', activity);
          return false;
        }
        
        if (!activity?.metrics?.timeOfDay) {
          console.log('Activity missing timeOfDay:', activity);
          return false;
        }

        const activityDate = activity.scheduledDateTime.toDate();
        const activityTimeOfDay = activity.metrics.timeOfDay.toLowerCase();
        const dateMatches = format(activityDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        const timeMatches = activityTimeOfDay === timeOfDay.toLowerCase();
        
        return dateMatches && timeMatches;
      });
    } catch (error) {
      console.error('Error filtering activities:', error);
      return [];
    }
  };

  const handleAddActivity = (date: Date, timeOfDay: string, event: React.MouseEvent) => {
    // Get the button's position for the modal animation
    const button = event.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    
    setModalPosition({ x: rect.x, y: rect.y });
    setSelectedTimeSlot({ date, timeOfDay });
    setModalOpen(true);
  };

  const handleActivityScheduled = () => {
    // Refresh the activities list
    const fetchActivities = async () => {
      if (!selectedClient) return;

      try {
        const start = startOfWeek(selectedDate);
        const end = endOfWeek(selectedDate);

        if (selectedClient.isGroup) {
          // If a group is selected, only get activities scheduled for the group
          const exercisesRef = collection(db, 'scheduledExercises');
          const q = query(
            exercisesRef,
            where('groupId', '==', selectedClient.id),
            where('scheduledDateTime', '>=', start),
            where('scheduledDateTime', '<=', end)
          );

          const snapshot = await getDocs(q);
          const groupActivities = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              exerciseTitle: data.exerciseTitle || 'Untitled',
              type: data.type || data.exerciseType || 'exercise',
              exerciseType: data.exerciseType,
              scheduledDateTime: data.scheduledDateTime,
              status: data.status || 'scheduled',
              metrics: {
                timeOfDay: (data.metrics?.timeOfDay || 'anytime').toLowerCase(),
                ...(data.metrics || {})
              }
            } as ScheduledActivity;
          });

          setActivities(groupActivities);
        } else {
          // If an individual client is selected, get their personal activities
          const exercisesRef = collection(db, 'scheduledExercises');
          const q = query(
            exercisesRef,
            where('userId', '==', selectedClient.id),
            where('scheduledDateTime', '>=', start),
            where('scheduledDateTime', '<=', end)
          );

          const snapshot = await getDocs(q);
          const clientActivities = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              exerciseTitle: data.exerciseTitle || 'Untitled',
              type: data.type || data.exerciseType || 'exercise',
              exerciseType: data.exerciseType,
              scheduledDateTime: data.scheduledDateTime,
              status: data.status || 'scheduled',
              metrics: {
                timeOfDay: (data.metrics?.timeOfDay || 'anytime').toLowerCase(),
                ...(data.metrics || {})
              }
            } as ScheduledActivity;
          });

          setActivities(clientActivities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
  };

  const handleActivityClick = (activity: ScheduledActivity, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Activity clicked:', activity);
    setActivityToDelete(activity);
    setDeleteModalOpen(true);
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'scheduledExercises', activityToDelete.id));
      
      // Update local state
      setActivities(prevActivities => 
        prevActivities.filter(activity => activity.id !== activityToDelete.id)
      );
      
      // Close modal
      setDeleteModalOpen(false);
      setActivityToDelete(null);
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white">Training Calendar</h1>
          <div className="flex bg-gray-800/50 rounded-lg p-0.5">
            <button
              onClick={() => setIsWeekView(false)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !isWeekView 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setIsWeekView(true)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isWeekView 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Week
            </button>
          </div>
        </div>
        <div className="w-72">
          <ClientSelector
            onClientSelect={handleClientSelect}
            selectedClientId={selectedClient?.id}
          />
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Date Navigation */}
        <div className="flex items-center px-4 py-2 border-b border-gray-800 bg-[#111827]">
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - (isWeekView ? 7 : 1));
              setSelectedDate(newDate);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 grid grid-cols-7 gap-0">
            {weekDates.map((date, index) => {
              const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center py-2 ${
                    isSelected ? 'bg-blue-500/20' : ''
                  }`}
                >
                  <span className="text-xs text-gray-400 font-medium">{format(date, 'EEE')}</span>
                  <span className={`text-lg font-bold ${
                    isToday(date) ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {format(date, 'd')}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + (isWeekView ? 7 : 1));
              setSelectedDate(newDate);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Activities Grid */}
        <div className="flex-1 overflow-auto">
          {isWeekView ? (
            <div className="grid grid-cols-7 h-full divide-x divide-gray-800">
              {weekDates.map((date) => (
                <div key={date.toISOString()} className="min-w-[180px] flex flex-col">
                  {timeSlots.map((slot) => {
                    const activitiesInSlot = getActivitiesForDateAndSlot(date, slot);
                    return (
                      <div key={slot} className="relative border-b border-gray-800">
                        <div className="sticky top-0 z-10 flex items-center justify-between p-2 bg-[#111827]/95 backdrop-blur-sm">
                          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">{slot}</h2>
                          <button
                            onClick={(e) => handleAddActivity(date, slot, e)}
                            className="w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
                            title={`Add activity for ${format(date, 'MMM d')} - ${slot}`}
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="p-2 space-y-1">
                          {activitiesInSlot
                            .filter(activity => 
                              activity && 
                              typeof activity === 'object' && 
                              'id' in activity && 
                              'exerciseTitle' in activity
                            )
                            .map((activity) => (
                              <ActivityCard
                                key={activity.id}
                                activity={activity}
                                onActivityClick={handleActivityClick}
                              />
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {timeSlots.map((slot) => {
                const activitiesInSlot = getActivitiesForDateAndSlot(selectedDate, slot);
                return (
                  <div key={slot} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{slot}</h2>
                      <button
                        onClick={(e) => handleAddActivity(selectedDate, slot, e)}
                        className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
                        title={`Add activity for ${format(selectedDate, 'MMM d')} - ${slot}`}
                      >
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {activitiesInSlot
                        .filter(activity => 
                          activity && 
                          typeof activity === 'object' && 
                          'id' in activity && 
                          'exerciseTitle' in activity
                        )
                        .map((activity) => (
                          <ActivityCard
                            key={activity.id}
                            activity={activity}
                            onActivityClick={handleActivityClick}
                          />
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedTimeSlot && selectedClient && (
        <ActivitySelectorModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedTimeSlot(null);
          }}
          position={modalPosition}
          date={selectedTimeSlot.date}
          timeOfDay={selectedTimeSlot.timeOfDay}
          selectedClientId={selectedClient.id}
          onActivityScheduled={handleActivityScheduled}
        />
      )}

      {deleteModalOpen && activityToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Activity</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{activityToDelete.exerciseTitle}"?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setActivityToDelete(null);
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteActivity}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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