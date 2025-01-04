import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert, PanResponder, RefreshControl, ActivityIndicator, Modal, TextInput, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { 
  getScheduledExercises, 
  scheduleExercise, 
  deleteScheduledExercise, 
  updateExerciseMetrics, 
  updateExerciseStatus 
} from '../firebase/scheduledExercises';
import { getScheduledSessions, updateScheduledSession } from '../firebase/scheduledSessions';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, getDocs, where, orderBy } from 'firebase/firestore';
import ClientSelector from './ClientSelector';
import ActivityMetricsForm from './ActivityMetricsForm';
import { useSelectedClient } from '../context/SelectedClientContext';

const { width } = Dimensions.get('window');
const DAY_WIDTH = width / 7;

export default function Training({ navigation, route }) {
  const theme = useTheme();
  const [exercises, setExercises] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const { selectedClient, updateSelectedClient } = useSelectedClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [metrics, setMetrics] = useState({
    sets: [{
      reps: '',
      weight: '',
      rest: '00:00'
    }],
    eachSide: false,
    notes: ''
  });
  const [showMetricsEditor, setShowMetricsEditor] = useState(false);

  // Add theme check right after hooks declarations
  if (!theme) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <ActivityIndicator size="large" color="#00B5E0" />
      </View>
    );
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      const { dx, dy } = gestureState;
      return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5;
    },
    onMoveShouldSetPanResponderCapture: () => false,
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > 30) {
        const currentIndex = weekDates.findIndex(
          date => date.toDateString() === selectedDate.toDateString()
        );
        
        if (currentIndex !== -1) {
          let newIndex;
          if (gestureState.dx > 0) {
            // Swipe right - go to previous day
            newIndex = currentIndex - 1;
            if (newIndex < 0) {
              const newDate = new Date(weekDates[0]);
              newDate.setDate(newDate.getDate() - 7);
              generateWeekDates(newDate);
              setSelectedDate(newDate);
              return;
            }
          } else {
            // Swipe left - go to next day
            newIndex = currentIndex + 1;
            if (newIndex >= weekDates.length) {
              const newDate = new Date(weekDates[6]);
              newDate.setDate(newDate.getDate() + 1);
              generateWeekDates(newDate);
              setSelectedDate(newDate);
              return;
            }
          }
          setSelectedDate(weekDates[newIndex]);
        }
      }
    }
  });

  const panResponderRef = useRef(panResponder).current;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadExercisesForDate(selectedDate);
    });
    return unsubscribe;
  }, [navigation, selectedDate]);

  useEffect(() => {
    checkIfCoach();
    generateWeekDates();
  }, []);

  useEffect(() => {
    if (isCoach) {
      updateSelectedClient({ id: auth.currentUser.uid, name: 'My Training' });
    }
  }, [isCoach]);

  useEffect(() => {
    loadExercisesForDate(selectedDate);
  }, [selectedDate, selectedClient]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadExercisesForDate(selectedDate);
    } catch (error) {
      console.error('Error refreshing exercises:', error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedDate]);

  const checkIfCoach = async () => {
    try {
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      setIsCoach(coachDoc.exists());
    } catch (error) {
      console.error('Error checking coach status:', error);
    }
  };

  const generateWeekDates = (baseDate = new Date()) => {
    const dates = [];
    const date = new Date(baseDate);
    const day = date.getDay();
    
    // Get Sunday of current week
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - day);

    // Generate array of dates for the week
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(sunday);
      newDate.setDate(sunday.getDate() + i);
      dates.push(newDate);
    }
    setWeekDates(dates);
  };

  const formatDate = (date) => {
    return {
      day: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
      date: date.getDate(),
    };
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const loadExercisesForDate = async (date) => {
    try {
      setLoading(true);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const userId = selectedClient?.id || auth.currentUser.uid;
      
      console.log('Loading exercises for date:', {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        userId
      });

      // Get both exercises and sessions
      const [exercisesForDate, sessionsForDate] = await Promise.all([
        getScheduledExercises(userId, startOfDay, endOfDay),
        getScheduledSessions(userId, startOfDay, endOfDay)
      ]);

      console.log('Fetched data:', {
        exercisesCount: exercisesForDate.length,
        sessionsCount: sessionsForDate.length,
        sessions: sessionsForDate
      });

      // Convert sessions to the same format as exercises
      const formattedSessions = sessionsForDate.map(session => ({
        ...session,
        type: 'session',
        exerciseTitle: session.title,
        metrics: {
          ...session.metrics,
          timeOfDay: session.timeOfDay || 'anytime',
          completed: session.status === 'completed'
        }
      }));

      console.log('Formatted sessions:', formattedSessions);

      // Sort all activities by scheduledDateTime
      const allActivities = [...exercisesForDate, ...formattedSessions].sort((a, b) => {
        const timeA = a.scheduledDateTime?.toDate?.() || a.scheduledDateTime;
        const timeB = b.scheduledDateTime?.toDate?.() || b.scheduledDateTime;
        return timeA - timeB;
      });

      console.log('Final activities:', {
        totalCount: allActivities.length,
        activities: allActivities
      });

      setExercises(allActivities);
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Error', 'Failed to load exercises. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client) => {
    console.log('Selected client in handleClientSelect:', {
      client,
      clientId: client?.id,
      clientName: client?.name,
      isCoachId: client?.id === auth.currentUser.uid
    });
    updateSelectedClient(client);
  };

  const handleAddExercise = () => {
    navigation.navigate('CategorySelector', {
      selectedDate,
      selectedClient,
    });
  };

  const handleDeleteExercise = async (exerciseId) => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to remove this exercise from your schedule?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteScheduledExercise(exerciseId);
              // Refresh the exercises list
              loadExercisesForDate(selectedDate);
            } catch (error) {
              console.error('Error deleting exercise:', error);
              Alert.alert('Error', 'Failed to delete exercise. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleLogExercise = async (exercise) => {
    if (exercise.type === 'habit' || exercise.type === 'task') {
      try {
        if (exercise.type === 'habit') {
          // Get all scheduled instances of this habit from the past week
          const startOfPastWeek = new Date(selectedDate);
          startOfPastWeek.setDate(startOfPastWeek.getDate() - 7);
          startOfPastWeek.setHours(0, 0, 0, 0);

          const exercisesRef = collection(db, 'scheduledExercises');
          const q = query(
            exercisesRef,
            where('userId', '==', auth.currentUser.uid),
            where('habitId', '==', exercise.habitId),
            where('scheduledDateTime', '<=', selectedDate),
            where('scheduledDateTime', '>=', startOfPastWeek),
            orderBy('scheduledDateTime', 'desc')
          );
          
          const snapshot = await getDocs(q);
          const pastScheduledDays = snapshot.docs
            .filter(doc => doc.id !== exercise.id)
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

          let newStreak = 0;
          if (!exercise.metrics?.completed) {
            // If marking as complete
            // Find the most recent scheduled day before this one
            const previousScheduledDay = pastScheduledDays[0];
            
            if (previousScheduledDay?.metrics?.completed) {
              // If previous scheduled day was completed, increment that streak
              newStreak = (previousScheduledDay.metrics?.streak || 0) + 1;
            } else {
              // Start new streak
              newStreak = 1;
            }
          } else {
            // If marking as incomplete
            // Check if there's a completed scheduled day before this one
            const previousScheduledDay = pastScheduledDays[0];
            if (previousScheduledDay?.metrics?.completed) {
              // Keep previous scheduled day's streak
              newStreak = previousScheduledDay.metrics?.streak || 0;
            }
          }

          await updateExerciseMetrics(exercise.id, {
            ...exercise.metrics,
            completed: !exercise.metrics?.completed,
            streak: newStreak
          });

          // Save completed habits to habitHistory
          if (!exercise.metrics?.completed) {
            const historyRef = collection(db, 'users', auth.currentUser.uid, 'habitHistory');
            await addDoc(historyRef, {
              habitId: exercise.habitId,
              title: exercise.title || exercise.exerciseTitle,
              type: 'habit',
              metrics: {
                streak: newStreak,
                timeOfDay: exercise.metrics?.timeOfDay || 'Anytime'
              },
              completedAt: serverTimestamp(),
            });
          }
        } else {
          // For tasks, just toggle completion without streak
          await updateExerciseMetrics(exercise.id, {
            ...exercise.metrics,
            completed: !exercise.metrics?.completed
          });

          // Save completed tasks to taskHistory
          if (!exercise.metrics?.completed) {
            const historyRef = collection(db, 'users', auth.currentUser.uid, 'taskHistory');
            await addDoc(historyRef, {
              taskId: exercise.taskId,
              title: exercise.title || exercise.exerciseTitle,
              type: 'task',
              metrics: {
                timeOfDay: exercise.metrics?.timeOfDay || 'Anytime'
              },
              completedAt: serverTimestamp(),
            });
          }
        }
        
        await updateExerciseStatus(exercise.id, exercise.metrics?.completed ? 'incomplete' : 'completed');
        loadExercisesForDate(selectedDate);
      } catch (error) {
        console.error('Error updating habit/task status:', error);
      }
    } else {
      setSelectedExercise(exercise);
      setMetrics(exercise.metrics || {
        sets: [{
          reps: '',
          weight: '',
          rest: '00:00'
        }],
        eachSide: false,
        notes: ''
      });
      setShowMetricsEditor(true);
    }
  };

  const handleMetricsSubmit = async (updatedMetrics) => {
    try {
      if (selectedExercise) {
        // Update the scheduled exercise
        await updateExerciseMetrics(selectedExercise.id, updatedMetrics);
        await updateExerciseStatus(selectedExercise.id, 'completed');

        // Save to exercise history
        const historyRef = collection(db, 'users', auth.currentUser.uid, 'exerciseHistory');
        await addDoc(historyRef, {
          exerciseId: selectedExercise.exerciseId || selectedExercise.id, // Use exerciseId if available, fallback to id
          title: selectedExercise.title || selectedExercise.exerciseTitle,
          type: selectedExercise.type || 'exercise',
          metrics: updatedMetrics,
          completedAt: serverTimestamp(),
          timeOfDay: selectedExercise.metrics?.timeOfDay || 'anytime',
          scheduledDateTime: selectedExercise.scheduledDateTime || new Date().toISOString()
        });

        setShowMetricsEditor(false);
        setSelectedExercise(null);
        setMetrics({
          sets: [{
            reps: '',
            weight: '',
            rest: '00:00'
          }],
          eachSide: false,
          notes: ''
        });
        loadExercisesForDate(selectedDate);
      }
    } catch (error) {
      console.error('Error updating exercise metrics:', error);
      Alert.alert('Error', 'Failed to update exercise metrics. Please try again.');
    }
  };

  const handleSectionPress = (section) => {
    // Get all exercises that belong to this section and maintain their order
    const sectionExercises = exercises
      .filter(ex => ex.sectionId === section.id && !ex.isParent && ex.type !== 'section')
      .sort((a, b) => (a.order || 0) - (b.order || 0));  // Sort by order if available

    // Navigate to SectionDetail with the properly structured data for logging
    navigation.navigate('SectionDetail', { 
      section: {
        id: section.id,
        title: section.title || section.sectionTitle,
        type: section.sectionType || 'section',
        description: section.description || '',
        activities: [{
          type: 'activities',
          items: sectionExercises.map((ex, index) => ({
            id: ex.id,
            title: ex.title || ex.exerciseTitle,
            type: ex.type || 'exercise',
            description: ex.description || '',
            exerciseId: ex.exerciseId,
            order: ex.order || index,  // Use existing order or create one based on index
            metrics: ex.metrics || {
              sets: [{
                reps: '',
                weight: '',
                rest: '00:00'
              }],
              eachSide: false,
              notes: ''
            }
          }))
        }],
        scheduledDateTime: section.scheduledDateTime,
        metrics: section.metrics,
        settings: section.settings || {}
      },
      mode: 'logging',
      isLogging: true
    });
  };

  const handleActivityPress = (activity) => {
    if (activity.type === 'section') {
      // If it's a section, show the first exercise in the metrics form
      const firstExercise = activity.activities[0];
      if (firstExercise) {
        setSelectedActivity({
          ...firstExercise,
          sectionId: activity.id,
          sectionTitle: activity.exerciseTitle
        });
        setShowMetricsForm(true);
      }
    } else {
      setSelectedActivity(activity);
      setShowMetricsForm(true);
    }
  };

  const handleMoveExercise = async (exercise, newTimeOfDay) => {
    try {
      await updateExerciseMetrics(exercise.id, {
        ...exercise.metrics,
        timeOfDay: newTimeOfDay
      });
      loadExercisesForDate(selectedDate);
    } catch (error) {
      console.error('Error moving exercise:', error);
      Alert.alert('Error', 'Failed to move exercise. Please try again.');
    }
  };

  const getMetricsPreview = (exercise) => {
    if (!exercise.metrics?.sets || exercise.metrics.sets.length === 0) return '';
    
    const { sets, eachSide } = exercise.metrics;
    
    // Format each set
    const setPreviews = sets.map((set, index) => {
      const parts = [];
      if (set.reps) parts.push(`${set.reps}`);
      if (set.weight) parts.push(`@ ${set.weight}lb`);
      return parts.join(' ');
    });

    // If all sets are the same, just show one number with the total sets
    const allSetsEqual = setPreviews.every(preview => preview === setPreviews[0]);
    let preview = allSetsEqual 
      ? `${sets.length} x ${setPreviews[0]}`
      : setPreviews.join(' | ');

    // Add each side indicator if needed
    if (eachSide) {
      preview += ' (each side)';
    }

    return preview;
  };

  const showExerciseOptions = (exercise) => {
    Alert.alert(
      "Exercise Options",
      "Choose an action",
      [
        {
          text: "Move to Morning",
          onPress: () => handleMoveExercise(exercise, 'morning')
        },
        {
          text: "Move to Afternoon",
          onPress: () => handleMoveExercise(exercise, 'afternoon')
        },
        {
          text: "Move to Evening",
          onPress: () => handleMoveExercise(exercise, 'evening')
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Get the appropriate type name for the alert
            let typeName = 'Exercise';
            if (exercise.type === 'section') typeName = 'Section';
            if (exercise.type === 'habit') typeName = 'Habit';
            if (exercise.type === 'task') typeName = 'Task';
            if (exercise.type === 'breathProtocol') typeName = 'Breath Protocol';
            if (exercise.type === 'breathTest') typeName = 'Breath Test';
            if (exercise.type === 'guidedSession') typeName = 'Guided Session';

            Alert.alert(
              `Delete ${typeName}`,
              `Are you sure you want to remove this ${typeName.toLowerCase()} from your schedule?`,
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      // If it's a section, delete all related exercises too
                      if (exercise.type === 'section' || exercise.isParent) {
                        const exercisesToDelete = exercises.filter(ex => 
                          ex.sectionId === exercise.id || ex.id === exercise.id
                        );
                        await Promise.all(
                          exercisesToDelete.map(ex => deleteScheduledExercise(ex.id))
                        );
                      } else {
                        // For all other types, just delete the single exercise
                        await deleteScheduledExercise(exercise.id);
                      }
                      loadExercisesForDate(selectedDate);
                    } catch (error) {
                      console.error('Error deleting exercise:', error);
                      Alert.alert('Error', `Failed to delete ${typeName.toLowerCase()}. Please try again.`);
                    }
                  }
                }
              ]
            );
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const renderExercise = (exercise, timeOfDay) => {
    // If it's part of a section and not being viewed individually
    if (exercise.sectionId && !exercise.isExpanded) {
      return null; // Don't render individual activities from sections
    }

    const isHabit = exercise.type === 'habit';
    const isTask = exercise.type === 'task';
    const isBreathProtocol = exercise.type === 'breathProtocol';
    const isGuidedSession = exercise.type === 'guidedSession';
    const isBreathTest = exercise.type === 'breathTest';

    console.log('Rendering exercise:', {
      type: exercise.type,
      title: exercise.title,
      exerciseTitle: exercise.exerciseTitle,
      isGuidedSession,
      isBreathTest
    });

    const handlePress = () => {
      if (isGuidedSession) {
        navigation.navigate('GuidedSessionDetail', { 
          session: {
            id: exercise.sessionId,
            title: exercise.title || exercise.exerciseTitle,
            description: exercise.description,
            duration: exercise.duration,
            videoUrl: exercise.videoUrl,
            type: exercise.type,
            intensity: exercise.intensity
          },
          isScheduled: true,
          scheduledExerciseId: exercise.id
        });
      } else if (isBreathProtocol) {
        // Navigate to BreathGuide with the protocol settings
        const breathGuideParams = {
          settings: {
            inhaleTime: exercise.protocol.pattern.inhale,
            inhaleHoldTime: exercise.protocol.pattern.inHold,
            exhaleTime: exercise.protocol.pattern.exhale,
            exhaleHoldTime: exercise.protocol.pattern.exHold,
            rounds: exercise.protocol.rounds,
            totalTime: parseInt(exercise.protocol.duration)
          },
          presetName: exercise.exerciseTitle,
          scheduledExerciseId: exercise.id
        };
        navigation.navigate('BreathGuide', breathGuideParams);
      } else {
        handleLogExercise(exercise);
      }
    };

    const handleStartTest = () => {
      navigation.navigate('BreathTestDetail', { 
        test: {
          id: exercise.testId,
          title: exercise.title || exercise.exerciseTitle,
          type: exercise.type,
          icon: exercise.icon
        }
      });
    };

    return (
      <TouchableOpacity
        key={exercise.id}
        style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]}
        onPress={handlePress}
      >
        <View style={styles.exerciseContent}>
          {exercise.sectionTitle && (
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              {exercise.sectionTitle}
            </Text>
          )}
          <View style={styles.exerciseHeader}>
            <Ionicons 
              name={isHabit ? 'repeat-outline' : isTask ? 'checkbox-outline' : isGuidedSession ? 'play-circle-outline' : exercise.icon || 'barbell-outline'} 
              size={24} 
              color={theme.colors.primary} 
              style={styles.exerciseIcon}
            />
            <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>
              {exercise.title || exercise.exerciseTitle}
            </Text>
          </View>

          {!isGuidedSession && !isBreathProtocol && !isHabit && !isTask && !isBreathTest && (
            <Text style={[styles.exerciseSubtitle, { color: theme.colors.textSecondary }]}>
              {getMetricsPreview(exercise)}
            </Text>
          )}

          {isGuidedSession && (
            <View style={styles.guidedSessionMetrics}>
              <Text style={[styles.exerciseMetrics, { color: theme.colors.primary }]}>
                {exercise.duration} min
              </Text>
              {exercise.metrics?.completed && (
                <Text style={[styles.completedText, { color: theme.colors.success }]}>
                  Completed
                </Text>
              )}
            </View>
          )}

          {isBreathProtocol && (
            <View style={styles.breathProtocolMetrics}>
              <Text style={[styles.exerciseSubtitle, { color: theme.colors.textSecondary }]}>
                {exercise.protocol.duration} @ {exercise.protocol.pattern.inhale}:{exercise.protocol.pattern.inHold}:{exercise.protocol.pattern.exhale}:{exercise.protocol.pattern.exHold}
              </Text>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
                onPress={handlePress}
              >
                <Text style={[styles.startButtonText, { color: theme.colors.background }]}>Start</Text>
              </TouchableOpacity>
            </View>
          )}

          {isBreathTest && (
            <View style={styles.breathTestMetrics}>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleStartTest}
              >
                <Text style={[styles.startButtonText, { color: theme.colors.background }]}>
                  Start Test
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {(isHabit || isTask) && (
            <View style={styles.habitTaskMetrics}>
              <TouchableOpacity
                style={styles.completionButton}
                onPress={() => handleLogExercise(exercise)}
              >
                <Ionicons 
                  name={exercise.metrics?.completed ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={exercise.metrics?.completed ? theme.colors.success : theme.colors.primary} 
                />
              </TouchableOpacity>
              <Text style={[styles.exerciseMetrics, { color: theme.colors.textSecondary }]}>
                {isHabit ? (
                  exercise.metrics?.streak > 0 ? `${exercise.metrics.streak} day streak` : 'Start your streak'
                ) : (
                  `Priority: ${exercise.metrics?.priority || 'medium'}`
                )}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => showExerciseOptions(exercise)}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSection = (section, timeOfDay) => {
    // Get the metrics preview for the first exercise
    const firstExercise = section.activities?.[0];
    const metricsPreview = firstExercise ? getMetricsPreview(firstExercise) : '';

    // Get icon based on section type
    const getIconForType = (type) => {
      switch (type?.toLowerCase()) {
        case 'fortime':
          return 'timer-outline';
        case 'amrap':
          return 'infinite-outline';
        case 'chipper':
          return 'list-outline';
        case 'intervals':
          return 'repeat-outline';
        default:
          return 'layers-outline';
      }
    };

    // Format section type for display
    const getDisplayType = (type) => {
      switch (type?.toLowerCase()) {
        case 'fortime':
          return 'For Time';
        case 'amrap':
          return 'AMRAP';
        case 'chipper':
          return 'Chipper';
        case 'intervals':
          return 'Intervals';
        default:
          return 'Superset';
      }
    };

    return (
      <TouchableOpacity
        key={section.id}
        style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleSectionPress(section)}
      >
        <View style={styles.exerciseContent}>
          <View style={styles.exerciseHeader}>
            <Ionicons 
              name={getIconForType(section.sectionType)}
              size={24} 
              color={theme.colors.primary}
              style={styles.exerciseIcon}
            />
            <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>
              {section.title || section.exerciseTitle || section.sectionTitle}
            </Text>
          </View>
          <Text style={[styles.exerciseSubtitle, { color: theme.colors.textSecondary }]}>
            {getDisplayType(section.sectionType)}
          </Text>
          {metricsPreview && (
            <Text style={[styles.exerciseSubtitle, { color: theme.colors.textSecondary }]}>
              {metricsPreview}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => showExerciseOptions(section)}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderTimeOfDayGroup = (timeOfDay, exercises) => {
    // Group exercises by section
    const sections = {};
    const standaloneExercises = [];

    exercises.forEach(exercise => {
      // Skip untitled sections
      if (exercise.type === 'section' && !exercise.title) {
        return;
      }

      // Handle parent section documents
      if (exercise.type === 'section' && exercise.isParent) {
        sections[exercise.id] = {
          id: exercise.id,
          title: exercise.title || exercise.exerciseTitle,
          type: 'section',
          activities: [],
          scheduledDateTime: exercise.scheduledDateTime,
          metrics: exercise.metrics,
          sectionType: exercise.sectionType
        };
        return;
      }

      // Handle activities that belong to sections
      if (exercise.sectionId) {
        if (!sections[exercise.sectionId]) {
          // Create new section if it doesn't exist
          sections[exercise.sectionId] = {
            id: exercise.sectionId,
            title: exercise.sectionTitle,
            type: 'section',
            activities: [],
            scheduledDateTime: exercise.scheduledDateTime,
            metrics: exercise.metrics
          };
        }
        sections[exercise.sectionId].activities.push({
          ...exercise,
          type: exercise.type || 'exercise'
        });
      } else if (!exercise.isParent) {  // Only add standalone exercises that aren't parent sections
        standaloneExercises.push(exercise);
      }
    });

    // Only render the time of day group if there are exercises or sections to show
    if (Object.keys(sections).length === 0 && standaloneExercises.length === 0) {
      return null;
    }

    return (
      <View key={timeOfDay}>
        <View style={styles.timeOfDayHeader}>
          <Text style={[styles.timeOfDayText, { color: theme.colors.textSecondary }]}>
            {timeOfDay}
          </Text>
          <View style={[styles.timeOfDayDivider, { backgroundColor: theme.colors.border }]} />
        </View>
        {Object.values(sections).map(section => renderSection(section, timeOfDay))}
        {standaloneExercises.map(exercise => renderExercise(exercise, timeOfDay))}
      </View>
    );
  };

  const renderActivity = (activity, date) => {
    const isSection = activity.type === 'section';
    const isSession = activity.type === 'session';
    const isCompleted = activity.metrics?.completed;

    if (isSession) {
      return (
        <TouchableOpacity
          key={activity.id}
          style={[
            styles.activityCard,
            { backgroundColor: theme.colors.surface },
            isCompleted && styles.completedActivity
          ]}
          onPress={() => navigation.navigate('SessionDetail', { session: activity })}
        >
          <View style={styles.exerciseHeader}>
            <View style={[styles.exerciseIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={theme.colors.white}
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                {activity.title}
              </Text>
              <View style={styles.sessionMetrics}>
                <Text style={[styles.sectionMetrics, { color: theme.colors.textSecondary }]}>
                  {activity.items?.length || 0} activities
                </Text>
                {activity.scheduledTime && (
                  <Text style={[styles.scheduledTime, { color: theme.colors.textSecondary }]}>
                    {activity.scheduledTime}
                  </Text>
                )}
              </View>
            </View>
            {isCompleted ? (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            ) : (
              <TouchableOpacity
                style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleCompleteSession(activity)}
              >
                <Text style={[styles.completeButtonText, { color: theme.colors.white }]}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
          {activity.items && activity.items.length > 0 && (
            <View style={styles.sessionPreview}>
              {activity.items.slice(0, 3).map((item, index) => (
                <Text 
                  key={index} 
                  style={[styles.previewItem, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  • {item.title || item.name}
                </Text>
              ))}
              {activity.items.length > 3 && (
                <Text style={[styles.moreItems, { color: theme.colors.textSecondary }]}>
                  +{activity.items.length - 3} more
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={activity.id}
        style={[
          styles.activityCard,
          { backgroundColor: theme.colors.surface },
          isCompleted && styles.completedActivity
        ]}
        onPress={() => {
          if (isSection) {
            navigation.navigate('SectionMetrics', { section: activity, date });
          } else {
            handleActivityPress(activity);
          }
        }}
      >
        <View style={styles.exerciseHeader}>
          <View style={[styles.exerciseIcon, { backgroundColor: theme.colors.primary }]}>
            <Ionicons
              name={isSection ? "layers-outline" : "barbell-outline"}
              size={24}
              color={theme.colors.white}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
              {activity.title}
            </Text>
            {isSection && (
              <Text style={[styles.sectionMetrics, { color: theme.colors.textSecondary }]}>
                {activity.activities?.length || 0} exercises
              </Text>
            )}
          </View>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
          ) : (
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleCompleteSession = async (session) => {
    try {
      await updateScheduledSession(session.id, {
        metrics: {
          ...session.metrics,
          completed: true
        }
      });
      loadExercisesForDate(selectedDate);
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Error', 'Failed to complete session. Please try again.');
    }
  };

  return (
    <View 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      {...panResponderRef.panHandlers}
    >
      {/* Client Selector for Coaches */}
      {isCoach && (
        <ClientSelector
          onClientSelect={handleClientSelect}
          selectedClientId={selectedClient?.id}
        />
      )}

      <View style={styles.contentContainer}>
        {/* Week Selector */}
        <View style={[
          styles.weekSelectorContainer, 
          { 
            backgroundColor: theme.colors.surface,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)'
          }
        ]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.weekSelector}
            contentContainerStyle={styles.weekSelectorContent}
          >
            {weekDates.map((date, index) => {
              const formattedDate = formatDate(date);
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const today = isToday(date);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    { width: DAY_WIDTH },
                    isSelected && [styles.selectedDay, { borderBottomColor: theme.colors.primary }]
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dayText,
                    { color: theme.colors.textSecondary },
                    (isSelected || today) && { color: theme.colors.primary }
                  ]}>
                    {formattedDate.day}
                  </Text>
                  <Text style={[
                    styles.dateText,
                    { color: theme.colors.text },
                    (isSelected || today) && { color: theme.colors.primary }
                  ]}>
                    {formattedDate.date}
                  </Text>
                  {today && (
                    <View style={[styles.todayDot, { backgroundColor: theme.colors.primary }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {loading ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Loading...
            </Text>
          ) : exercises.length > 0 ? (
            <View style={[styles.exerciseList, { marginTop: 8, paddingTop: 0 }]}>
              {(() => {
                // Group exercises by time of day
                const groupedExercises = [...exercises].reverse().reduce((acc, exercise) => {
                  // Normalize time of day when grouping
                  const rawTimeOfDay = exercise.metrics?.timeOfDay || 'Anytime';
                  const timeOfDay = rawTimeOfDay.charAt(0).toUpperCase() + rawTimeOfDay.slice(1).toLowerCase();
                  
                  if (!acc[timeOfDay]) {
                    acc[timeOfDay] = [];
                  }
                  acc[timeOfDay].push(exercise);
                  return acc;
                }, {});

                // Define time of day order
                const timeOrder = {
                  'Morning': 0,
                  'Afternoon': 1,
                  'Evening': 2,
                  'Anytime': 3
                };

                // Sort groups by time of day
                const sortedGroups = Object.entries(groupedExercises)
                  .sort((a, b) => {
                    // Default to Anytime (3) if time not found in order
                    return (timeOrder[a[0]] ?? 3) - (timeOrder[b[0]] ?? 3);
                  });

                // Render each group
                return sortedGroups.map(([timeOfDay, groupExercises]) => (
                  renderTimeOfDayGroup(timeOfDay, groupExercises)
                ));
              })()}
            </View>
          ) : (
            <View style={[styles.emptyContainer, { marginTop: -150 }]}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No exercises scheduled
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddExercise}
              >
                <Text style={[styles.addButtonText, { color: theme.colors.white }]}>Add First Exercise</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddExercise}
      >
        <Ionicons name="add" size={24} color={theme.colors.background} />
      </TouchableOpacity>

      {/* Metrics Editor Modal */}
      <Modal
        visible={showMetricsEditor}
        transparent={true}
        animationType="slide"
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Log Exercise
            </Text>

            {metrics.sets.map((set, setIndex) => (
              <View 
                key={`set-${setIndex}`} 
                style={styles.metricsRow}
              >
                <View style={styles.metricColumn}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>SET</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.text }]}>{setIndex + 1}</Text>
                </View>
                <View style={styles.metricColumn}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>LB</Text>
                  <TextInput
                    style={[styles.metricInput, { color: theme.colors.text }]}
                    value={set.weight}
                    onChangeText={(value) => {
                      const updatedSets = [...metrics.sets];
                      updatedSets[setIndex] = { ...set, weight: value };
                      setMetrics({ ...metrics, sets: updatedSets });
                    }}
                    keyboardType="numeric"
                    placeholder="-"
                    placeholderTextColor={theme.colors.textSecondary}
                    returnKeyType="done"
                    keyboardAppearance="dark"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
                <View style={styles.metricColumn}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>REPS</Text>
                  <TextInput
                    style={[styles.metricInput, { color: theme.colors.text }]}
                    value={set.reps}
                    onChangeText={(value) => {
                      const updatedSets = [...metrics.sets];
                      updatedSets[setIndex] = { ...set, reps: value };
                      setMetrics({ ...metrics, sets: updatedSets });
                    }}
                    keyboardType="numeric"
                    placeholder="-"
                    placeholderTextColor={theme.colors.textSecondary}
                    returnKeyType="done"
                    keyboardAppearance="dark"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
                <View style={styles.metricColumn}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>REST</Text>
                  <TextInput
                    style={[styles.metricInput, { color: theme.colors.text }]}
                    value={set.rest}
                    onChangeText={(value) => {
                      const updatedSets = [...metrics.sets];
                      updatedSets[setIndex] = { ...set, rest: value };
                      setMetrics({ ...metrics, sets: updatedSets });
                    }}
                    placeholder="00:00"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addSetButton}
              onPress={() => setMetrics(current => ({
                ...current,
                sets: [
                  ...current.sets,
                  {
                    reps: '',
                    weight: '',
                    rest: '00:00'
                  }
                ]
              }))}
            >
              <Ionicons name="add" size={20} color={theme.colors.primary} />
              <Text style={[styles.addSetText, { color: theme.colors.primary }]}>Add Set</Text>
            </TouchableOpacity>

            <View style={styles.eachSideRow}>
              <TouchableOpacity 
                style={[
                  styles.checkbox,
                  metrics.eachSide && { 
                    backgroundColor: theme.colors.primary, 
                    borderColor: theme.colors.primary 
                  }
                ]}
                onPress={() => setMetrics(current => ({
                  ...current,
                  eachSide: !current.eachSide
                }))}
              >
                {metrics.eachSide && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                )}
              </TouchableOpacity>
              <Text style={[styles.eachSideText, { color: theme.colors.textSecondary }]}>Each side</Text>
            </View>

            <TextInput
              style={[styles.notesInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text 
              }]}
              placeholder="Add note..."
              placeholderTextColor={theme.colors.textSecondary}
              value={metrics.notes}
              onChangeText={(value) => setMetrics(current => ({ ...current, notes: value }))}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={() => {
                  setShowMetricsEditor(false);
                  setSelectedExercise(null);
                  setMetrics({
                    sets: [{
                      reps: '',
                      weight: '',
                      rest: '00:00'
                    }],
                    eachSide: false,
                    notes: ''
                  });
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleMetricsSubmit(metrics)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.large,
    paddingBottom: 120,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  exerciseContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.xsmall,
  },
  exerciseTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.xsmall,
  },
  exerciseMetrics: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    backgroundColor: 'rgba(0, 181, 224, 0.1)',
    paddingHorizontal: Layout.spacing.small,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.small,
  },
  exerciseMetricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  deleteButton: {
    padding: Layout.spacing.small,
  },
  timeOfDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    marginTop: Layout.spacing.medium,
    marginBottom: Layout.spacing.small,
  },
  timeOfDayText: {
    fontSize: 15,
    fontFamily: Typography.fonts.medium,
    marginRight: Layout.spacing.medium,
    opacity: 0.8,
  },
  timeOfDayDivider: {
    height: 1,
    flex: 1,
    opacity: 0.2,
  },
  habitMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  breathProtocolMetrics: {
    marginTop: 4,
  },
  // Restore FAB styles
  fab: {
    position: 'absolute',
    right: Layout.spacing.large - 8,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  // Restore empty state styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
  },
  addButton: {
    paddingHorizontal: Layout.spacing.xlarge,
    paddingVertical: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
  },
  addButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  sectionMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.xsmall,
  },
  weekSelectorContainer: {
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  weekSelector: {
    flexDirection: 'row',
  },
  weekSelectorContent: {
    paddingHorizontal: Layout.spacing.small,
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedDay: {
    borderBottomWidth: 2,
  },
  dayText: {
    fontSize: 13,
    fontFamily: Typography.fonts.medium,
    opacity: 0.7,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 15,
    fontFamily: Typography.fonts.semibold,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.small,
  },
  exerciseIcon: {
    marginRight: Layout.spacing.medium,
  },
  habitTaskMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.small,
  },
  completionButton: {
    marginRight: Layout.spacing.medium,
  },
  optionsButton: {
    padding: Layout.spacing.small,
    marginLeft: Layout.spacing.small,
  },
  exerciseSubtitle: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    marginTop: 4,
  },
  startButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
  },
  modalTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.large,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.small,
  },
  metricColumn: {
    flex: 1,
    marginRight: Layout.spacing.small,
  },
  metricLabel: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
  },
  metricInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    padding: Layout.spacing.small,
    borderRadius: Layout.borderRadius.small,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.small,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: Layout.borderRadius.small,
    marginTop: Layout.spacing.small,
  },
  addSetText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.small,
  },
  eachSideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.small,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: Layout.borderRadius.small,
    marginRight: Layout.spacing.small,
  },
  eachSideText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    padding: Layout.spacing.small,
    borderRadius: Layout.borderRadius.small,
    marginTop: Layout.spacing.small,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.large,
  },
  modalButton: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.small,
  },
  modalButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  breathTestMetrics: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  activityTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.xsmall,
  },
  titleContainer: {
    flex: 1,
    marginRight: Layout.spacing.medium,
  },
  completedActivity: {
    opacity: 0.7,
  },
  completeButton: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.small,
  },
  completeButtonText: {
    fontSize: 14,
    fontFamily: Typography.fonts.medium,
  },
  sessionMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.xsmall,
  },
  scheduledTime: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    marginTop: Layout.spacing.xsmall,
  },
  sessionPreview: {
    marginTop: Layout.spacing.small,
  },
  previewItem: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.xsmall,
  },
  moreItems: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    marginTop: Layout.spacing.xsmall,
  },
}); 