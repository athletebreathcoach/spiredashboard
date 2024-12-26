import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Alert, PanResponder, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { getScheduledExercises, scheduleExercise, deleteScheduledExercise, updateExerciseMetrics } from '../firebase/scheduledExercises';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          // Find current date index in weekDates
          const currentIndex = weekDates.findIndex(
            date => date.toDateString() === selectedDate.toDateString()
          );
          
          if (currentIndex !== -1) {
            let newIndex;
            if (gestureState.dx > 0) {
              // Swipe right - go to previous day
              newIndex = currentIndex - 1;
              if (newIndex < 0) {
                // If we're at the start of the week, generate new week dates
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
                // If we're at the end of the week, generate new week dates
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
      },
    })
  ).current;

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

  const handleLogExercise = (exercise) => {
    setSelectedExercise(exercise);
    setShowMetricsForm(true);
  };

  const handleMetricsSubmit = async (metrics) => {
    try {
      if (selectedExercise) {
        await updateExerciseMetrics(selectedExercise.id, {
          ...selectedExercise.metrics,
          ...metrics,
          logged: true,
        });
        setShowMetricsForm(false);
        loadExercisesForDate(selectedDate);
      }
    } catch (error) {
      console.error('Error updating exercise metrics:', error);
      Alert.alert('Error', 'Failed to update exercise metrics. Please try again.');
    }
  };

  return (
    <View 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      {...panResponder.panHandlers}
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
        <View style={styles.weekSelectorContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={[styles.weekSelector, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
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
                    isSelected && [styles.selectedDay, { borderBottomColor: theme.colors.primary }],
                    { width: DAY_WIDTH }
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
                  const timeOfDay = exercise.metrics?.timeOfDay || 'Unscheduled';
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
                  'Unscheduled': 3
                };

                // Sort groups by time of day
                const sortedGroups = Object.entries(groupedExercises).sort((a, b) => {
                  return (timeOrder[a[0]] ?? 4) - (timeOrder[b[0]] ?? 4);
                });

                // Render each group
                return sortedGroups.map(([timeOfDay, groupExercises]) => (
                  <View key={timeOfDay}>
                    {timeOfDay !== 'Unscheduled' && (
                      <View style={styles.timeOfDayHeader}>
                        <Text style={[styles.timeOfDayText, { color: theme.colors.textSecondary }]}>
                          {timeOfDay}
                        </Text>
                        <View style={[styles.timeOfDayDivider, { backgroundColor: theme.colors.border }]} />
                      </View>
                    )}
                    {groupExercises.map((exercise, index) => {
                      const section = String.fromCharCode(65 + Math.floor(index / 3));
                      const subIndex = (index % 3) + 1;
                      const exerciseId = index < 3 ? section : `${section}${subIndex}`;
                      
                      return (
                        <TouchableOpacity
                          key={exercise.id}
                          style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]}
                          onPress={() => {
                            if (exercise.type === 'breathProtocol') {
                              const breathGuideParams = {
                                settings: {
                                  inhaleTime: exercise.protocol.pattern.inhale,
                                  inhaleHoldTime: exercise.protocol.pattern.inHold,
                                  exhaleTime: exercise.protocol.pattern.exhale,
                                  exhaleHoldTime: exercise.protocol.pattern.exHold,
                                  rounds: exercise.protocol.rounds,
                                  totalTime: parseInt(exercise.protocol.duration)
                                },
                                presetName: exercise.protocol.title
                              };
                              navigation.navigate('BreathGuide', breathGuideParams);
                            } else {
                              navigation.navigate('ExerciseDetail', { exercise });
                            }
                          }}
                        >
                          <View style={[styles.exerciseIdContainer, { backgroundColor: theme.colors.border }]}>
                            <Text style={[styles.exerciseId, { color: theme.colors.text }]}>{exerciseId}</Text>
                          </View>
                          <View style={styles.exerciseContent}>
                            <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>
                              {exercise.exerciseTitle}
                            </Text>
                            {exercise.type === 'guidedSession' ? (
                              <Text style={[styles.exerciseMetrics, { color: theme.colors.primary }]}>
                                {exercise.duration}
                              </Text>
                            ) : exercise.type === 'breathProtocol' ? (
                              <View style={styles.breathProtocolMetrics}>
                                <View style={styles.exerciseMetricsContainer}>
                                  {exercise.metrics?.rounds && (
                                    <Text style={[styles.exerciseMetrics, { color: theme.colors.primary }]}>
                                      {exercise.metrics.rounds} rounds
                                    </Text>
                                  )}
                                  {exercise.metrics?.breathHold && (
                                    <Text style={[styles.exerciseMetrics, { color: theme.colors.primary, marginLeft: 8 }]}>
                                      {exercise.metrics.breathHold}s hold
                                    </Text>
                                  )}
                                  {exercise.metrics?.recovery && (
                                    <Text style={[styles.exerciseMetrics, { color: theme.colors.primary, marginLeft: 8 }]}>
                                      {exercise.metrics.recovery}s recovery
                                    </Text>
                                  )}
                                </View>
                                {!isCoach && (
                                  <TouchableOpacity
                                    style={[styles.logButton, { borderColor: theme.colors.primary }]}
                                    onPress={() => {
                                      const breathGuideParams = {
                                        settings: {
                                          inhaleTime: exercise.protocol.pattern.inhale,
                                          inhaleHoldTime: exercise.protocol.pattern.inHold,
                                          exhaleTime: exercise.protocol.pattern.exhale,
                                          exhaleHoldTime: exercise.protocol.pattern.exHold,
                                          rounds: exercise.protocol.rounds,
                                          totalTime: parseInt(exercise.protocol.duration)
                                        },
                                        presetName: exercise.protocol.title
                                      };
                                      navigation.navigate('BreathGuide', breathGuideParams);
                                    }}
                                  >
                                    <Text style={[styles.logButtonText, { color: theme.colors.primary }]}>
                                      Start Protocol
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            ) : exercise.type === 'habit' ? (
                              <View style={styles.habitMetrics}>
                                <Ionicons 
                                  name={exercise.metrics?.completed ? "checkmark-circle" : "ellipse-outline"} 
                                  size={20} 
                                  color={theme.colors.primary} 
                                />
                                <Text style={[styles.exerciseMetrics, { color: theme.colors.primary, marginLeft: 8 }]}>
                                  Streak: {exercise.metrics?.streak || 0}
                                </Text>
                              </View>
                            ) : exercise.type === 'task' ? (
                              <View style={styles.taskMetrics}>
                                <Ionicons 
                                  name={exercise.metrics?.completed ? "checkmark-circle" : "ellipse-outline"} 
                                  size={20} 
                                  color={theme.colors.primary} 
                                />
                                <Text style={[styles.exerciseMetrics, { color: theme.colors.primary, marginLeft: 8 }]}>
                                  Priority: {exercise.metrics?.priority || 'medium'}
                                </Text>
                              </View>
                            ) : (
                              <View>
                                <View style={styles.exerciseMetricsContainer}>
                                  {exercise.metrics?.sets && exercise.metrics?.reps && (
                                    <Text style={[styles.exerciseMetrics, { color: theme.colors.primary }]}>
                                      {exercise.metrics.sets} × {exercise.metrics.reps}
                                    </Text>
                                  )}
                                  {exercise.metrics?.weights && (
                                    <Text style={[styles.exerciseMetrics, { color: theme.colors.primary, marginLeft: 8 }]}>
                                      {exercise.metrics.weights}kg
                                    </Text>
                                  )}
                                  {exercise.metrics?.rir && (
                                    <Text style={[styles.exerciseMetrics, { color: theme.colors.primary, marginLeft: 8 }]}>
                                      RIR: {exercise.metrics.rir}
                                    </Text>
                                  )}
                                  {exercise.metrics?.time && (
                                    <Text style={[styles.exerciseMetrics, { color: theme.colors.primary, marginLeft: 8 }]}>
                                      {exercise.metrics.time}
                                    </Text>
                                  )}
                                  {exercise.metrics?.distance && (
                                    <Text style={[styles.exerciseMetrics, { color: theme.colors.primary, marginLeft: 8 }]}>
                                      {exercise.metrics.distance}km
                                    </Text>
                                  )}
                                  {exercise.metrics?.oneRmPercentage && (
                                    <Text style={[styles.exerciseMetrics, { color: theme.colors.primary, marginLeft: 8 }]}>
                                      {exercise.metrics.oneRmPercentage}% 1RM
                                    </Text>
                                  )}
                                </View>
                                {!isCoach && (
                                  <TouchableOpacity
                                    style={[styles.logButton, { borderColor: theme.colors.primary }]}
                                    onPress={() => handleLogExercise(exercise)}
                                  >
                                    <Text style={[styles.logButtonText, { color: theme.colors.primary }]}>
                                      {exercise.metrics?.logged ? 'Update Log' : 'Log Exercise'}
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            )}
                          </View>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteExercise(exercise.id)}
                          >
                            <Ionicons name="trash-outline" size={24} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
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
    flexDirection: 'column',
  },
  title: {
    fontSize: 28,
    fontFamily: Typography.fonts.bold,
    padding: Layout.spacing.large,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: Layout.spacing.large,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  exerciseIdContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.medium,
  },
  exerciseId: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  exerciseContent: {
    flex: 1,
    paddingRight: Layout.spacing.small,
  },
  exerciseTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginBottom: 4,
  },
  exerciseMetrics: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
    lineHeight: 20,
  },
  deleteButton: {
    padding: Layout.spacing.small,
    alignSelf: 'center',
  },
  addButton: {
    position: 'absolute',
    right: Layout.spacing.large,
    bottom: Layout.spacing.large,
    borderRadius: 16,
    padding: 8,
  },
  weekSelectorContainer: {
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  weekSelector: {
    height: '100%',
  },
  weekSelectorContent: {
    height: '100%',
  },
  dayButton: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    borderBottomWidth: 0,
  },
  dayText: {
    fontSize: 13,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 17,
    fontFamily: Typography.fonts.semibold,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  emptyIcon: {
    marginBottom: Layout.spacing.medium,
  },
  addFirstButton: {
    paddingHorizontal: Layout.spacing.xlarge,
    paddingVertical: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
  },
  addFirstButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
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
  sectionHeader: {
    fontSize: 24,
    fontFamily: Typography.fonts.semibold,
    color: '#00B5E0',
    marginBottom: Layout.spacing.large,
  },
  exerciseList: {
    paddingTop: 0,
    marginTop: 8,
  },
  habitMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseMetricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  exerciseMetrics: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    backgroundColor: 'rgba(0, 181, 224, 0.1)',
    paddingHorizontal: Layout.spacing.small,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.small,
  },
  timeOfDay: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
    marginBottom: 4,
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
  logButton: {
    padding: Layout.spacing.small,
    borderWidth: 1,
    borderColor: '#00B5E0',
    borderRadius: Layout.borderRadius.small,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  logButtonText: {
    fontSize: 13,
    fontFamily: Typography.fonts.medium,
    color: '#00B5E0',
  },
  breathProtocolMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
}); 