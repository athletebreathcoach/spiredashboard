import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { getTodaysExercises, getExercisesForDate } from '../firebase/programs';
import { auth } from '../config/firebase';

const { width } = Dimensions.get('window');
const DAY_WIDTH = width / 7; // Width for each day button

export default function Training({ navigation }) {
  const theme = useTheme();
  const [exercises, setExercises] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateWeekDates();
  }, []);

  useEffect(() => {
    loadExercisesForDate(selectedDate);
  }, [selectedDate]);

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
      const exercisesForDate = await getExercisesForDate(auth.currentUser.uid, date);
      setExercises(exercisesForDate);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, theme?.colors?.background && { backgroundColor: theme.colors.background }]}>
      {/* Week Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.weekSelector, theme?.colors?.border && { borderBottomColor: theme.colors.border }]}
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
                theme?.colors?.textSecondary && { color: theme.colors.textSecondary },
                (isSelected || today) && { color: '#00B5E0' }
              ]}>
                {formattedDate.day}
              </Text>
              <Text style={[
                styles.dateText,
                theme?.colors?.text && { color: theme.colors.text },
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

      <Text style={[styles.title, theme?.colors?.text && { color: theme.colors.text }]}>Today's Training</Text>
      
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <Text style={[styles.emptyText, theme?.colors?.textSecondary && { color: theme.colors.textSecondary }]}>
            Loading...
          </Text>
        ) : exercises.length > 0 ? (
          exercises.map((exercise, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.exerciseCard, { backgroundColor: '#2C2C2E' }]}
            >
              <Ionicons 
                name={exercise.icon} 
                size={24} 
                color="#00B5E0" 
                style={styles.exerciseIcon}
              />
              <View style={styles.exerciseContent}>
                <Text style={[styles.exerciseTitle, theme?.colors?.text && { color: theme.colors.text }]}>
                  {exercise.title}
                </Text>
                <Text style={[styles.exerciseType, theme?.colors?.textSecondary && { color: theme.colors.textSecondary }]}>
                  {exercise.type}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => {/* Handle start */}}
              >
                <Ionicons name="play-circle" size={32} color="#00B5E0" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.emptyText, theme?.colors?.textSecondary && { color: theme.colors.textSecondary }]}>
            No exercises scheduled for {selectedDate.toLocaleDateString()}
          </Text>
        )}
      </ScrollView>

      {/* Add Exercise Button */}
      <TouchableOpacity 
        style={[styles.addButton, theme?.colors?.background && { backgroundColor: theme.colors.background }]}
        onPress={() => navigation.navigate('Exercises', { selectionMode: true })}
      >
        <Ionicons name="add-circle" size={32} color="#00B5E0" />
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
}); 