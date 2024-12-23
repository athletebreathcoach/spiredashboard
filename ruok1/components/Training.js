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

const defaultTheme = {
  colors: {
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    primary: '#00B5E0'
  }
};

export default function Training({ navigation }) {
  const { theme = defaultTheme } = useTheme();
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
        style={[styles.weekSelector, { borderBottomColor: theme.colors.border }]}
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
                isSelected && [styles.selectedDay, { borderBottomColor: '#00B5E0' }],
                { width: DAY_WIDTH }
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dayText,
                { color: theme.colors.textSecondary },
                (isSelected || today) && { color: '#00B5E0' }
              ]}>
                {formattedDate.day}
              </Text>
              <Text style={[
                styles.dateText,
                { color: theme.colors.text },
                (isSelected || today) && { color: '#00B5E0' }
              ]}>
                {formattedDate.date}
              </Text>
              {today && (
                <View style={styles.todayDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={[styles.title, { color: theme.colors.text }]}>
        {selectedClient?.name === 'My Training' ? 'My Training' : selectedClient ? `${selectedClient.name}'s Training` : "Today's Training"}
      </Text>
      
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Loading...
          </Text>
        ) : exercises.length > 0 ? (
          exercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[styles.exerciseCard, { backgroundColor: '#2C2C2E' }]}
              onPress={() => navigation.navigate('ExerciseDetail', { exercise })}
            >
              <Ionicons 
                name={exercise.icon || 'barbell-outline'} 
                size={24} 
                color="#00B5E0" 
                style={styles.exerciseIcon}
              />
              <View style={styles.exerciseContent}>
                <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>
                  {exercise.exerciseTitle}
                </Text>
                <Text style={[styles.exerciseType, { color: theme.colors.textSecondary }]}>
                  {exercise.status}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('ExerciseDetail', { exercise })}
              >
                <Ionicons name="chevron-forward" size={24} color="#00B5E0" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
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
              style={[styles.addFirstButton, { backgroundColor: '#00B5E0' }]}
              onPress={handleAddExercise}
            >
              <Text style={styles.addFirstButtonText}>Add First Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: '#00B5E0' }]}
        onPress={handleAddExercise}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
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
    padding: Layout.spacing.large,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  exerciseIcon: {
    marginRight: Layout.spacing.medium,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
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
    borderBottomWidth: 1,
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
    borderBottomWidth: 2,
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
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00B5E0',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    padding: Layout.spacing.large,
  },
  exerciseType: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
    marginTop: 4,
  },
  startButton: {
    padding: Layout.spacing.small,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.large,
  },
  emptyIcon: {
    marginBottom: Layout.spacing.medium,
  },
  addFirstButton: {
    marginTop: Layout.spacing.large,
    paddingVertical: Layout.spacing.small,
    paddingHorizontal: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
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
}); 