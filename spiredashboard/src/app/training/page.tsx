'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isToday, endOfWeek } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import ClientSelector from '@/components/ClientSelector';
import ActivitySelectorModal from '@/components/ActivitySelectorModal';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

interface Client {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
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

export default function TrainingPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activities, setActivities] = useState<ScheduledActivity[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; timeOfDay: string } | null>(null);

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

        const exercisesRef = collection(db, 'scheduledExercises');
        const q = query(
          exercisesRef,
          where('userId', '==', selectedClient.id),
          where('scheduledDateTime', '>=', start),
          where('scheduledDateTime', '<=', end)
        );

        const snapshot = await getDocs(q);
        const fetchedActivities = snapshot.docs.map(doc => {
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

        console.log('Fetched activities:', fetchedActivities);
        setActivities(fetchedActivities);
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

  const getActivityColor = (activity: ScheduledActivity) => {
    try {
      if (!activity) {
        return 'bg-gradient-to-r from-gray-600 to-gray-500';
      }

      // Handle case where type is an object
      if (typeof activity.type === 'object' && activity.type !== null) {
        const typeName = activity.type.name?.toLowerCase() || '';
        switch (typeName) {
          case 'mobility':
            return 'bg-gradient-to-r from-orange-600 to-orange-500';
          case 'strength':
            return 'bg-gradient-to-r from-red-600 to-red-500';
          case 'cardio':
            return 'bg-gradient-to-r from-blue-600 to-blue-500';
          default:
            return 'bg-gradient-to-r from-gray-600 to-gray-500';
        }
      }

      // Handle string type cases
      const activityType = (activity.type as string)?.toLowerCase() || '';
      
      switch (activityType) {
        case 'breathtest':
          return 'bg-gradient-to-r from-purple-600 to-purple-500';
        case 'breathprotocol':
          return 'bg-gradient-to-r from-emerald-600 to-emerald-500';
        case 'exercise':
          return 'bg-gradient-to-r from-blue-600 to-blue-500';
        case 'habit':
          return 'bg-gradient-to-r from-amber-600 to-amber-500';
        case 'task':
          return 'bg-gradient-to-r from-red-600 to-red-500';
        case 'section':
          return 'bg-gradient-to-r from-indigo-600 to-indigo-500';
        case 'mobility':
          return 'bg-gradient-to-r from-orange-600 to-orange-500';
        default:
          return 'bg-gradient-to-r from-gray-600 to-gray-500';
      }
    } catch (error) {
      console.error('Error in getActivityColor:', error);
      return 'bg-gradient-to-r from-gray-600 to-gray-500';
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

        const exercisesRef = collection(db, 'scheduledExercises');
        const q = query(
          exercisesRef,
          where('userId', '==', selectedClient.id),
          where('scheduledDateTime', '>=', start),
          where('scheduledDateTime', '<=', end)
        );

        const snapshot = await getDocs(q);
        const fetchedActivities = snapshot.docs.map(doc => {
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

        setActivities(fetchedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 text-transparent bg-clip-text">
          Training Calendar
        </h1>
        <div className="w-72">
          <ClientSelector
            onClientSelect={handleClientSelect}
            selectedClientId={selectedClient?.id}
          />
        </div>
      </div>

      {/* Week View Calendar */}
      <div className="flex-1 bg-gray-800/30 backdrop-blur-sm overflow-hidden flex flex-col border-t border-gray-700/50 shadow-2xl">
        {/* Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-700/50 bg-gray-800/50">
          {weekDates.map((date, index) => (
            <div
              key={index}
              className={`py-4 px-4 text-center border-r border-gray-700/50 ${
                isToday(date) ? 'bg-gradient-to-b from-gray-800 to-gray-800/50' : ''
              }`}
            >
              <div className="text-sm text-gray-400 font-medium">
                {format(date, 'EEE')}
              </div>
              <div className={`text-lg font-bold ${
                isToday(date) ? 'text-yellow-400' : 'text-white'
              }`}>
                {format(date, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 h-full divide-x divide-gray-700/50">
            {weekDates.map((date, dateIndex) => (
              <div key={dateIndex} className="min-w-[180px]">
                {timeSlots.map((slot, slotIndex) => (
                  <div
                    key={slotIndex}
                    className={`px-4 py-5 border-b border-gray-700/50 relative ${
                      isToday(date) ? 'bg-gray-800/20' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-xs uppercase tracking-wider font-semibold text-gray-500">
                        {slot}
                      </div>
                      <button
                        onClick={(e) => handleAddActivity(date, slot, e)}
                        className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
                        title={`Add activity for ${format(date, 'MMM d')} - ${slot}`}
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
                    {/* Activities */}
                    <div className="space-y-2.5">
                      {(() => {
                        try {
                          const filteredActivities = getActivitiesForDateAndSlot(date, slot);
                          
                          if (!Array.isArray(filteredActivities)) {
                            console.error('Filtered activities is not an array:', filteredActivities);
                            return null;
                          }

                          return filteredActivities
                            .filter(activity => 
                              activity && 
                              typeof activity === 'object' && 
                              'id' in activity && 
                              'exerciseTitle' in activity
                            )
                            .map((activity) => {
                              try {
                                const colorClass = getActivityColor(activity);
                                return (
                                  <div
                                    key={activity.id}
                                    className={`px-3.5 py-2.5 rounded-lg ${colorClass} shadow-lg hover:shadow-xl hover:translate-y-[-1px] hover:ring-2 hover:ring-white/20 transition-all cursor-pointer`}
                                  >
                                    <div className="font-semibold text-sm text-white">
                                      {activity.exerciseTitle || 'Untitled Activity'}
                                    </div>
                                    <div className="text-xs text-white/90 font-medium uppercase tracking-wide">
                                      {typeof activity.type === 'string' 
                                        ? activity.type 
                                        : activity.type.name || 'Exercise'}
                                    </div>
                                  </div>
                                );
                              } catch (error) {
                                console.error('Error rendering activity:', error, activity);
                                return null;
                              }
                            })
                            .filter(Boolean);
                        } catch (error) {
                          console.error('Error in activity rendering:', error);
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Selector Modal */}
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
    </div>
  );
} 