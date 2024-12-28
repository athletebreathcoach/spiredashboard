import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { getSections, scheduleSection } from '../firebase/sections';
import { auth } from '../config/firebase';

export default function Sections({ navigation, route }) {
  const theme = useTheme();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSections, setSelectedSections] = useState([]);
  const isSelectionMode = route.params?.selectedDate != null;
  const { selectedDate } = route.params || {};

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const sectionsData = await getSections(auth.currentUser.uid);
      setSections(sectionsData);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = () => {
    navigation.navigate('ActivitySelector', {
      onNext: (selectedActivities) => {
        navigation.navigate('ConfigureSection', {
          activities: selectedActivities
        });
      }
    });
  };

  const handleSectionPress = (section) => {
    navigation.navigate('SectionDetail', {
      section,
      selectedDate
    });
  };

  const handleProgramSelected = async () => {
    try {
      setLoading(true);
      // Schedule all selected sections
      await Promise.all(
        selectedSections.map(section =>
          scheduleSection(
            auth.currentUser.uid,
            section,
            selectedDate,
            'Unscheduled'
          )
        )
      );
      navigation.goBack();
    } catch (error) {
      console.error('Error scheduling sections:', error);
      Alert.alert('Error', 'Failed to schedule sections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = (section) => {
    setSelectedSections(prev => {
      const exists = prev.find(s => s.id === section.id);
      if (exists) {
        return prev.filter(s => s.id !== section.id);
      }
      return [...prev, section];
    });
  };

  const renderSection = (section) => {
    // Count activities by type
    const activityCounts = section.activities?.reduce((acc, activity) => {
      const type = activity.type || 'exercise';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return (
      <TouchableOpacity
        key={section.id}
        style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => isSelectionMode ? handleSectionSelect(section) : handleSectionPress(section)}
      >
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {section.title}
          </Text>
          {section.description && (
            <Text 
              style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {section.description}
            </Text>
          )}
          <View style={styles.categoryInfo}>
            {activityCounts?.exercise > 0 && (
              <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                {activityCounts.exercise} exercises
              </Text>
            )}
            {activityCounts?.habit > 0 && (
              <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                {activityCounts.habit} habits/tasks
              </Text>
            )}
          </View>
        </View>
        {isSelectionMode && (
          <Ionicons 
            name={selectedSections.some(s => s.id === section.id) 
              ? "checkmark-circle" 
              : "ellipse-outline"
            } 
            size={24} 
            color={selectedSections.some(s => s.id === section.id)
              ? theme.colors.primary
              : theme.colors.textSecondary
            } 
            style={styles.selectionIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {isSelectionMode && selectedSections.length > 0 && (
          <TouchableOpacity 
            style={[styles.programButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleProgramSelected}
          >
            <Text style={[styles.programButtonText, { color: theme.colors.white }]}>
              Program Selected ({selectedSections.length})
            </Text>
          </TouchableOpacity>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          {sections.map(section => renderSection(section))}
        </ScrollView>

        {!isSelectionMode && (
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateSection}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    backgroundColor: '#1C1C1E',
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCount: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
  },
  createButton: {
    position: 'absolute',
    bottom: Layout.spacing.medium,
    right: Layout.spacing.medium,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  programButton: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  programButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  selectionIcon: {
    marginLeft: Layout.spacing.medium,
  },
}); 