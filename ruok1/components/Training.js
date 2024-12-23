import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { getScheduledExercises, scheduleExercise } from '../firebase/scheduledExercises';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ClientSelector from './ClientSelector';

const { width } = Dimensions.get('window');
const DAY_WIDTH = width / 7;

export default function Training({ navigation }) {
  const theme = useTheme();
  const [exercises, setExercises] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    checkIfCoach();
    generateWeekDates();
  }, []);

  useEffect(() => {
    loadExercisesForDate(selectedDate);
  }, [selectedDate, selectedClient]);

  const checkIfCoach = async () => {
    try {
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      setIsCoach(coachDoc.exists());
    } catch (error) {
      console.error('Error checking coach status:', error);
    }
  };

  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    const day = today.getDay();
    
    // Get Sunday of current week
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - day);

    // Generate array of dates for the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      dates.push(date);
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
    setSelectedClient(client);
  };

  const handleAddExercise = () => {
    // If coach is viewing their own calendar or if user is not a coach
    const targetUserId = selectedClient?.id || auth.currentUser.uid;
    
    navigation.navigate('Exercises', {
      mode: 'selection',
      targetUserId,
      selectedDate,
      onExerciseSelect: async (exercise) => {
        try {
          await scheduleExercise(targetUserId, exercise.id, selectedDate);
          // Refresh the exercises list
          loadExercisesForDate(selectedDate);
        } catch (error) {
          console.error('Error scheduling exercise:', error);
        }
      }
    });
  };

  const handleDeleteExercise = async (exerciseId) => {
    try {
      await deleteExercise(exerciseId);
      // Refresh the exercises list
      loadExercisesForDate(selectedDate);
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Client Selector for Coaches */}
      {isCoach && (
        <ClientSelector
          onClientSelect={handleClientSelect}
          selectedClientId={selectedClient?.id}
        />
      )}

      {/* Week Selector */}
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

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
      >
        {loading ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Loading...
          </Text>
        ) : exercises.length > 0 ? (
          <>
            <View style={styles.exerciseList}>
              {exercises.map((exercise, index) => {
                const section = String.fromCharCode(65 + Math.floor(index / 3)); // A, B, C, etc.
                const subIndex = (index % 3) + 1; // 1, 2, 3
                const exerciseId = index < 3 ? section : `${section}${subIndex}`;
                
                return (
                  <TouchableOpacity
                    key={exercise.id}
                    style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]}
                    onPress={() => navigation.navigate('ExerciseDetail', { exercise })}
                  >
                    <View style={[styles.exerciseIdContainer, { backgroundColor: theme.colors.border }]}>
                      <Text style={[styles.exerciseId, { color: theme.colors.text }]}>{exerciseId}</Text>
                    </View>
                    <View style={styles.exerciseContent}>
                      <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>
                        {exercise.exerciseTitle}
                      </Text>
                      <Text style={[styles.exerciseMetrics, { color: theme.colors.primary }]}>
                        {exercise.sets}x{exercise.reps}
                      </Text>
                      {exercise.description && (
                        <Text style={[styles.exerciseDescription, { color: theme.colors.text }]}>
                          {exercise.description}
                        </Text>
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
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="calendar-outline" 
              size={48} 
              color={theme.colors.textSecondary} 
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No exercises scheduled for {selectedDate.toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={[styles.addFirstButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddExercise}
            >
              <Text style={[styles.addFirstButtonText, { color: theme.colors.background }]}>Add First Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddExercise}
      >
        <Ionicons name="add" size={24} color={theme.colors.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingTop: 0,
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
  },
  exerciseTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginBottom: 4,
  },
  exerciseMetrics: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
    lineHeight: 20,
  },
  deleteButton: {
    padding: Layout.spacing.small,
  },
  addButton: {
    position: 'absolute',
    right: Layout.spacing.large,
    bottom: Layout.spacing.large,
    borderRadius: 16,
    padding: 8,
  },
  weekSelector: {
    height: 80,
  },
  weekSelectorContent: {
    height: 80,
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
    paddingTop: Layout.spacing.medium,
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
    right: Layout.spacing.large,
    bottom: Layout.spacing.large + 60,
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
  },
}); 