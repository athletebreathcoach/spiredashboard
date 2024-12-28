import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { createSection } from '../firebase/sections';
import { auth } from '../config/firebase';

export default function ConfigureSection({ navigation, route }) {
  const theme = useTheme();
  const { activities } = route.params;
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [activityConfigs, setActivityConfigs] = useState(
    activities.map(activity => ({
      ...activity,
      config: {
        sets: '',
        reps: '',
        weight: '',
        duration: '',
        intensity: '',
        notes: '',
      }
    }))
  );

  const handleConfigChange = (index, field, value) => {
    setActivityConfigs(current => {
      const updated = [...current];
      updated[index] = {
        ...updated[index],
        config: {
          ...updated[index].config,
          [field]: value
        }
      };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!sectionTitle.trim()) {
      Alert.alert('Error', 'Please enter a section title');
      return;
    }

    try {
      await createSection({
        userId: auth.currentUser.uid,
        title: sectionTitle,
        description: sectionDescription,
        activities: activityConfigs,
      });
      
      navigation.navigate('Sections');
    } catch (error) {
      console.error('Error saving section:', error);
      Alert.alert('Error', 'Failed to save section. Please try again.');
    }
  };

  const renderConfigFields = (activity, index) => {
    const config = activityConfigs[index].config;

    switch (activity.type) {
      case 'exercises':
        return (
          <>
            <View style={styles.configRow}>
              <View style={styles.configField}>
                <Text style={[styles.configLabel, { color: theme.colors.textSecondary }]}>Sets</Text>
                <TextInput
                  style={[styles.configInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                  value={config.sets}
                  onChangeText={(value) => handleConfigChange(index, 'sets', value)}
                  keyboardType="numeric"
                  placeholder="Sets"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              <View style={styles.configField}>
                <Text style={[styles.configLabel, { color: theme.colors.textSecondary }]}>Reps</Text>
                <TextInput
                  style={[styles.configInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                  value={config.reps}
                  onChangeText={(value) => handleConfigChange(index, 'reps', value)}
                  keyboardType="numeric"
                  placeholder="Reps"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
              <View style={styles.configField}>
                <Text style={[styles.configLabel, { color: theme.colors.textSecondary }]}>Weight</Text>
                <TextInput
                  style={[styles.configInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                  value={config.weight}
                  onChangeText={(value) => handleConfigChange(index, 'weight', value)}
                  keyboardType="numeric"
                  placeholder="Weight"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>
          </>
        );
      
      case 'habitstasks':
        return (
          <View style={styles.configRow}>
            <View style={styles.configField}>
              <Text style={[styles.configLabel, { color: theme.colors.textSecondary }]}>Duration (min)</Text>
              <TextInput
                style={[styles.configInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                value={config.duration}
                onChangeText={(value) => handleConfigChange(index, 'duration', value)}
                keyboardType="numeric"
                placeholder="Duration"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
        );

      case 'breathingTests':
      case 'breathProtocols':
        return (
          <View style={styles.configRow}>
            <View style={styles.configField}>
              <Text style={[styles.configLabel, { color: theme.colors.textSecondary }]}>Duration (min)</Text>
              <TextInput
                style={[styles.configInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                value={config.duration}
                onChangeText={(value) => handleConfigChange(index, 'duration', value)}
                keyboardType="numeric"
                placeholder="Duration"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.configField}>
              <Text style={[styles.configLabel, { color: theme.colors.textSecondary }]}>Intensity</Text>
              <TextInput
                style={[styles.configInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                value={config.intensity}
                onChangeText={(value) => handleConfigChange(index, 'intensity', value)}
                placeholder="Intensity"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

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
          Configure Section
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sectionInfo}>
          <TextInput
            style={[styles.titleInput, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
            }]}
            placeholder="Section Title"
            placeholderTextColor={theme.colors.textSecondary}
            value={sectionTitle}
            onChangeText={setSectionTitle}
          />
          <TextInput
            style={[styles.descriptionInput, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
            }]}
            placeholder="Section Description (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={sectionDescription}
            onChangeText={setSectionDescription}
            multiline
          />
        </View>

        <View style={styles.activitiesList}>
          {activityConfigs.map((activity, index) => (
            <View 
              key={activity.id} 
              style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}
            >
              <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                {activity.title}
              </Text>
              {renderConfigFields(activity, index)}
              <TextInput
                style={[styles.notesInput, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                }]}
                placeholder="Additional notes..."
                placeholderTextColor={theme.colors.textSecondary}
                value={activity.config.notes}
                onChangeText={(value) => handleConfigChange(index, 'notes', value)}
                multiline
              />
            </View>
          ))}
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
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.medium,
  },
  saveButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  sectionInfo: {
    marginBottom: Layout.spacing.large,
  },
  titleInput: {
    height: 50,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.medium,
    fontSize: 18,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.medium,
  },
  descriptionInput: {
    height: 80,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.medium,
    paddingTop: Layout.spacing.medium,
    fontSize: 16,
    fontFamily: Typography.fonts.regular,
    textAlignVertical: 'top',
  },
  activitiesList: {
    gap: Layout.spacing.medium,
  },
  activityCard: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.medium,
  },
  activityTitle: {
    fontSize: 18,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.medium,
  },
  configRow: {
    flexDirection: 'row',
    gap: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
  },
  configField: {
    flex: 1,
  },
  configLabel: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    marginBottom: 4,
  },
  configInput: {
    height: 40,
    borderRadius: Layout.borderRadius.small,
    paddingHorizontal: Layout.spacing.medium,
    fontSize: 16,
    fontFamily: Typography.fonts.regular,
  },
  notesInput: {
    height: 60,
    borderRadius: Layout.borderRadius.small,
    paddingHorizontal: Layout.spacing.medium,
    paddingTop: Layout.spacing.small,
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    textAlignVertical: 'top',
  },
}); 