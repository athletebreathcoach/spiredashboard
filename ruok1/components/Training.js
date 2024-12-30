import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert, PanResponder, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { getScheduledExercises, scheduleExercise, deleteScheduledExercise, updateExerciseMetrics, updateExerciseStatus } from '../firebase/scheduledExercises';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, getDocs, where, orderBy } from 'firebase/firestore';
import ClientSelector from './ClientSelector';
import ActivityMetricsForm from './ActivityMetricsForm';

const { width } = Dimensions.get('window');
const DAY_WIDTH = width / 7;

export default function Training({ navigation, route }) {
  const theme = useTheme();
  const [exercises, setExercises] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

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
      setSelectedClient({ id: auth.currentUser.uid, name: 'My Training' });
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
      const exercisesForDate = await getScheduledExercises(userId, startOfDay, endOfDay);
      setExercises(exercisesForDate);
    } catch (error) {
      console.error('Error loading exercises:', error);
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
    setSelectedClient(client);
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
      setShowMetricsForm(true);
    }
  };

  const handleMetricsSubmit = async (metrics) => {
    try {
      if (selectedExercise) {
        // Update the scheduled exercise
        await updateExerciseMetrics(selectedExercise.id, {
          ...selectedExercise.metrics,
          ...metrics,
          logged: true,
        });
        await updateExerciseStatus(selectedExercise.id, 'completed');

        // Save to exercise history
        const historyRef = collection(db, 'users', auth.currentUser.uid, 'exerciseHistory');
        await addDoc(historyRef, {
          exerciseId: selectedExercise.exerciseId,
          title: selectedExercise.exerciseTitle,
          type: selectedExercise.exerciseType?.name || selectedExercise.exerciseType,
          metrics,
          completedAt: serverTimestamp(),
        });

        setShowMetricsForm(false);
        loadExercisesForDate(selectedDate);
      }
    } catch (error) {
      console.error('Error updating exercise metrics:', error);
      Alert.alert('Error', 'Failed to update exercise metrics. Please try again.');
    }
  };

  const handleSectionPress = (section) => {
    navigation.navigate('SectionDetail', { 
      section,
      selectedDate: selectedDate
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
          onPress: () => handleDeleteExercise(exercise.id)
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

    console.log('Rendering exercise:', {
      type: exercise.type,
      title: exercise.title,
      exerciseTitle: exercise.exerciseTitle,
      isGuidedSession
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
    const activities = section.activities;
    const completedActivities = activities.filter(a => a.metrics?.completed).length;

    return (
      <TouchableOpacity
        key={section.id}
        style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleSectionPress(section)}
      >
        <View style={styles.exerciseContent}>
          <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>
            {section.exerciseTitle || section.title}
          </Text>
          <View style={styles.sectionMetrics}>
            <Text style={[styles.exerciseMetrics, { color: theme.colors.primary }]}>
              {completedActivities}/{activities.length} Activities
            </Text>
            <Text style={[styles.timeOfDayText, { color: theme.colors.textSecondary }]}>
              {timeOfDay}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteExercise(section.id)}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderTimeOfDayGroup = (timeOfDay, exercises) => {
    // Group exercises by section
    const sections = {};
    const standaloneExercises = [];

    exercises.forEach(exercise => {
      if (exercise.sectionId) {
        if (!sections[exercise.sectionId]) {
          sections[exercise.sectionId] = {
            id: exercise.sectionId,
            title: exercise.sectionTitle,
            exerciseTitle: exercise.sectionTitle,
            activities: [],
          };
        }
        sections[exercise.sectionId].activities.push(exercise);
      } else {
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

      <ActivityMetricsForm
        visible={showMetricsForm}
        onClose={() => setShowMetricsForm(false)}
        onSubmit={handleMetricsSubmit}
        activity={selectedExercise}
      />
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
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.xsmall,
  },
  startButton: {
    paddingHorizontal: Layout.spacing.xlarge,
    paddingVertical: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
  },
  startButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
}); 