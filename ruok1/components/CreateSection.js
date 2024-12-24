import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

const ACTIVITY_TYPES = [
  { id: 'breathingTest', label: 'Breathing Test', icon: 'fitness-outline' },
  { id: 'exercise', label: 'Exercise', icon: 'barbell-outline' },
  { id: 'breathProtocol', label: 'Breath Protocol', icon: 'pulse-outline' },
  { id: 'habitTask', label: 'Habit & Task', icon: 'checkbox-outline' },
  { id: 'guidedSession', label: 'Guided Session', icon: 'play-circle-outline' }
];

export default function CreateSection({ navigation }) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);

  const handleActivityToggle = (activityType) => {
    setSelectedActivities(current => {
      const exists = current.find(a => a.type === activityType.id);
      if (exists) {
        return current.filter(a => a.type !== activityType.id);
      } else {
        return [...current, { type: activityType.id, items: [] }];
      }
    });
  };

  const handleNext = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the section');
      return;
    }

    if (selectedActivities.length === 0) {
      Alert.alert('Error', 'Please select at least one activity type');
      return;
    }

    navigation.navigate('AddSectionActivities', {
      sectionData: {
        title: title.trim(),
        description: description.trim(),
        activities: selectedActivities,
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { 
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background 
      }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          Create Section
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary + '20' }]}
          onPress={handleNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>Next</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Title</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter section title"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
              height: 100,
              textAlignVertical: 'top'
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter section description"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Activities</Text>
          <View style={styles.activityTypes}>
            {ACTIVITY_TYPES.map((activity) => {
              const isSelected = selectedActivities.some(a => a.type === activity.id);
              return (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityButton,
                    { 
                      backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.surface 
                    }
                  ]}
                  onPress={() => handleActivityToggle(activity)}
                >
                  <Ionicons 
                    name={activity.icon} 
                    size={24} 
                    color={isSelected ? theme.colors.primary : theme.colors.text} 
                  />
                  <Text style={[
                    styles.activityButtonText,
                    { color: isSelected ? theme.colors.primary : theme.colors.text }
                  ]}>
                    {activity.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
    marginRight: Layout.spacing.small,
    zIndex: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginLeft: -40,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: Layout.spacing.small,
    paddingHorizontal: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    zIndex: 1,
  },
  saveButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.large,
  },
  formGroup: {
    marginBottom: Layout.spacing.large,
  },
  label: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.medium,
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
  },
  activityTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.medium,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    width: '48%',
  },
  activityButtonText: {
    fontSize: 15,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.small,
  },
}); 