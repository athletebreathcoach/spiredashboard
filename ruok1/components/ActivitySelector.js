import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { getExercises } from '../firebase/exercises';
import { getHabits, getTasks } from '../firebase/habits';
import { getBreathingTests } from '../firebase/breathingTests';
import { getBreathProtocols } from '../firebase/breathProtocols';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { getSections } from '../firebase/sections';

const CATEGORIES = [
  { id: 'sections', label: 'Sections', icon: 'layers-outline' },
  { id: 'exercises', label: 'Exercises', icon: 'barbell-outline' },
  { id: 'habitstasks', label: 'Habits & Tasks', icon: 'checkbox-outline' },
  { id: 'breathingTests', label: 'Breathing Tests', icon: 'fitness-outline' },
  { id: 'breathProtocols', label: 'Breath Protocols', icon: 'pulse-outline' },
  { id: 'guidedSessions', label: 'Guided Sessions', icon: 'play-circle-outline' },
];

const SECTION_TYPES = [
  { id: 'standard', label: 'Standard', icon: 'barbell-outline' },
  { id: 'forTime', label: 'For Time', icon: 'timer-outline' },
  { id: 'amrap', label: 'AMRAP', icon: 'infinite-outline' },
  { id: 'chipper', label: 'Chipper', icon: 'list-outline' },
  { id: 'intervals', label: 'Intervals', icon: 'repeat-outline' }
];

export default function ActivitySelector({ navigation, route }) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('exercises');
  const [activities, setActivities] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('No user ID found');
        setActivities({});
        return;
      }

      const [sections, exercises, habits, tasks, breathingTests, breathProtocols] = await Promise.all([
        getSections(userId),
        getExercises(),
        getHabits(),
        getTasks(),
        getBreathingTests(),
        getBreathProtocols()
      ]);

      // Fetch guided sessions
      const guidedSessionsRef = collection(db, 'guidedSessions');
      const q = query(guidedSessionsRef, orderBy('title'));
      const snapshot = await getDocs(q);
      const guidedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        title: doc.data().title || doc.data().name
      }));

      // Process breathing tests to ensure they have titles
      const processedBreathingTests = (breathingTests || []).map(test => ({
        ...test,
        title: test.name || test.title || test.testName || 'Unnamed Test',
        type: 'breathingTests'
      }));

      setActivities({
        sections: sections || [],
        exercises: exercises || [],
        habitstasks: [...(habits || []), ...(tasks || [])],
        breathingTests: processedBreathingTests,
        breathProtocols,
        guidedSessions
      });
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities({});
    } finally {
      setLoading(false);
    }
  };

  const toggleActivitySelection = (activity) => {
    setSelectedActivities(current => {
      const exists = current.find(a => a.id === activity.id);
      if (exists) {
        return current.filter(a => a.id !== activity.id);
      }
      
      // Clean the activity data when adding it
      const cleanedActivity = {
        id: activity.id,
        title: activity.title || activity.name,
        type: selectedCategory === 'sections' ? activity.type || 'section' : selectedCategory,
        description: activity.description || '',
        category: activity.category || '',
        settings: activity.settings || {},
        activities: activity.exercises || [], // Include exercises for sections
        metrics: selectedCategory === 'exercises' ? {
          sets: [{
            reps: '',
            weight: '',
            rest: '00:00'
          }],
          eachSide: false,
          notes: ''
        } : undefined
      };
      
      return [...current, cleanedActivity];
    });
  };

  const handleNext = () => {
    if (selectedActivities.length === 0) {
      Alert.alert('Error', 'Please select at least one activity');
      return;
    }

    console.log('Route params:', route.params);
    console.log('Selected activities:', selectedActivities);

    if (route.params?.type === 'session') {
      navigation.navigate('SessionDetail', {
        session: {
          title: 'New Session',
          items: selectedActivities.map(item => {
            if (item.type === 'section' || SECTION_TYPES.some(t => t.id === item.type)) {
              // For sections, include their exercises and settings
              return {
                ...item,
                id: Math.random().toString(), // Temporary ID for new items
                activities: item.activities.map(exercise => ({
                  ...exercise,
                  id: Math.random().toString(),
                  metrics: {
                    sets: [{
                      reps: '',
                      weight: '',
                      rest: '00:00'
                    }],
                    eachSide: false
                  }
                }))
              };
            } else {
              // For regular activities
              return {
                ...item,
                id: Math.random().toString(), // Temporary ID for new items
                metrics: item.type === 'exercise' ? {
                  sets: [{
                    reps: '',
                    weight: '',
                    rest: '00:00'
                  }],
                  eachSide: false
                } : undefined
              };
            }
          })
        },
        isNew: true
      });
    } else if (route.params?.onNextScreen) {
      navigation.navigate(route.params.onNextScreen, {
        section: {
          exercises: selectedActivities
        }
      });
    } else {
      console.error('No valid navigation action found');
    }
  };

  const filteredActivities = activities[selectedCategory]?.filter(activity =>
    (activity.title || activity.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Select Activities
        </Text>
        {selectedActivities.length > 0 && (
          <TouchableOpacity 
            style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.nextButtonText, { color: theme.colors.white }]}>
              Next ({selectedActivities.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={theme.colors.textSecondary} 
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
          }]}
          placeholder="Search activities..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView 
        horizontal 
        style={styles.categoriesScroll}
        showsHorizontalScrollIndicator={false}
      >
        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              { 
                backgroundColor: selectedCategory === category.id 
                  ? theme.colors.primary 
                  : theme.colors.surface 
              }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon} 
              size={24} 
              color={selectedCategory === category.id 
                ? theme.colors.white 
                : theme.colors.text
              } 
            />
            <Text style={[
              styles.categoryLabel,
              { 
                color: selectedCategory === category.id 
                  ? theme.colors.white 
                  : theme.colors.text 
              }
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.activitiesScroll}>
          {filteredActivities.map(activity => (
            <TouchableOpacity
              key={activity.id}
              style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => toggleActivitySelection(activity)}
            >
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                  {activity.title || activity.name || 'Unnamed Activity'}
                </Text>
                {activity.description && (
                  <Text style={[styles.activityDescription, { color: theme.colors.textSecondary }]}>
                    {activity.description}
                  </Text>
                )}
                {__DEV__ && !activity.title && !activity.name && (
                  <Text style={{ color: 'red' }}>Debug: {JSON.stringify(activity)}</Text>
                )}
              </View>
              <Ionicons 
                name={selectedActivities.some(a => a.id === activity.id) 
                  ? "checkmark-circle" 
                  : "ellipse-outline"
                } 
                size={24} 
                color={selectedActivities.some(a => a.id === activity.id)
                  ? theme.colors.primary
                  : theme.colors.textSecondary
                } 
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    borderBottomWidth: 1,
    marginTop: 40,
  },
  backButton: {
    padding: Layout.spacing.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
  },
  nextButton: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.medium,
  },
  nextButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
  },
  searchIcon: {
    position: 'absolute',
    left: Layout.spacing.large,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: Layout.borderRadius.medium,
    paddingLeft: Layout.spacing.xlarge,
    fontSize: 16,
  },
  categoriesScroll: {
    maxHeight: 60,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    marginHorizontal: Layout.spacing.small,
    borderRadius: Layout.borderRadius.medium,
  },
  categoryLabel: {
    marginLeft: Layout.spacing.small,
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activitiesScroll: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.small,
    borderRadius: Layout.borderRadius.medium,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
  },
}); 