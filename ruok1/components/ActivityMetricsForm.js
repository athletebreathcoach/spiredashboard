import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

export default function ActivityMetricsForm({ visible, onClose, onSubmit, activity }) {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    sets: '',
    reps: '',
    weights: '',
    rir: '', // Reps In Reserve
    time: '',
    distance: '',
    calories: '',
    oneRmPercentage: '', // %1RM
    completed: false,
    streak: 0,
    priority: 'medium',
    timeOfDay: '',
  });

  // Reset metrics when activity changes
  useEffect(() => {
    setMetrics({
      sets: '',
      reps: '',
      weights: '',
      rir: '',
      time: '',
      distance: '',
      calories: '',
      oneRmPercentage: '',
      completed: false,
      streak: 0,
      priority: 'medium',
      timeOfDay: '',
    });
  }, [activity]);

  const getVisibleFields = () => {
    const baseFields = ['timeOfDay'];
    switch (activity?.type?.toLowerCase()) {
      case 'strength':
        return [...baseFields, 'sets', 'reps', 'weights', 'rir', 'oneRmPercentage'];
      case 'cardio':
        return [...baseFields, 'time', 'distance', 'calories'];
      case 'habit':
        return [...baseFields, 'streak'];
      case 'task':
        return [...baseFields, 'priority'];
      case 'guidedsession':
        return [...baseFields, 'time'];
      default:
        return [...baseFields, 'sets', 'reps', 'weights', 'time']; // Default fields
    }
  };

  const handleSubmit = () => {
    // Convert string values to numbers where appropriate
    const processedMetrics = {
      sets: metrics.sets ? parseInt(metrics.sets) : null,
      reps: metrics.reps ? parseInt(metrics.reps) : null,
      weights: metrics.weights ? parseFloat(metrics.weights) : null,
      rir: metrics.rir ? parseInt(metrics.rir) : null,
      time: metrics.time || null,
      distance: metrics.distance ? parseFloat(metrics.distance) : null,
      calories: metrics.calories ? parseInt(metrics.calories) : null,
      oneRmPercentage: metrics.oneRmPercentage ? parseInt(metrics.oneRmPercentage) : null,
      completed: metrics.completed,
      streak: metrics.streak,
      priority: metrics.priority,
      timeOfDay: metrics.timeOfDay || null,
    };
    onSubmit(processedMetrics);
  };

  const visibleFields = getVisibleFields();

  const renderField = (fieldName) => {
    const fieldConfig = {
      timeOfDay: {
        label: 'Time of Day',
        options: ['Morning', 'Afternoon', 'Evening'],
      },
      sets: {
        label: 'Sets',
        placeholder: '0',
        keyboardType: 'number-pad',
      },
      reps: {
        label: 'Reps',
        placeholder: '0',
        keyboardType: 'number-pad',
      },
      weights: {
        label: 'Weight (kg)',
        placeholder: '0.0',
        keyboardType: 'decimal-pad',
      },
      rir: {
        label: 'RIR',
        placeholder: '0',
        keyboardType: 'number-pad',
      },
      time: {
        label: 'Time',
        placeholder: 'mm:ss',
        keyboardType: 'default',
      },
      distance: {
        label: 'Distance (km)',
        placeholder: '0.0',
        keyboardType: 'decimal-pad',
      },
      calories: {
        label: 'Calories',
        placeholder: '0',
        keyboardType: 'number-pad',
      },
      oneRmPercentage: {
        label: '%1RM',
        placeholder: '0',
        keyboardType: 'number-pad',
      },
      streak: {
        label: 'Current Streak',
        placeholder: '0',
        keyboardType: 'number-pad',
      },
      priority: {
        label: 'Priority',
        placeholder: 'medium',
        keyboardType: 'default',
      },
    };

    const config = fieldConfig[fieldName];
    if (!config) return null;

    if (fieldName === 'timeOfDay') {
      return (
        <View style={styles.inputGroup} key={fieldName}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{config.label}</Text>
          <View style={styles.timeOfDayContainer}>
            {config.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.timeOfDayButton,
                  metrics.timeOfDay === option && { backgroundColor: theme.colors.primary },
                  { borderColor: theme.colors.primary }
                ]}
                onPress={() => setMetrics(prev => ({ ...prev, timeOfDay: option }))}
              >
                <Text
                  style={[
                    styles.timeOfDayText,
                    metrics.timeOfDay === option
                      ? { color: theme.colors.white }
                      : { color: theme.colors.primary }
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.inputGroup} key={fieldName}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{config.label}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
          value={metrics[fieldName]}
          onChangeText={(text) => setMetrics(prev => ({ ...prev, [fieldName]: text }))}
          keyboardType={config.keyboardType}
          placeholder={config.placeholder}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Set {activity?.type || 'Activity'} Metrics
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            {/* Render Time of Day selector first */}
            {renderField('timeOfDay')}
            
            {/* Render remaining fields in pairs */}
            {Array.from({ length: Math.ceil((visibleFields.length - 1) / 2) }).map((_, index) => {
              const fieldIndex = index * 2 + 1; // Skip timeOfDay which is already rendered
              return (
                <View style={styles.inputRow} key={index}>
                  {renderField(visibleFields[fieldIndex])}
                  {visibleFields[fieldIndex + 1] && renderField(visibleFields[fieldIndex + 1])}
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitButtonText, { color: theme.colors.white }]}>
              Schedule {activity?.type || 'Activity'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: Layout.borderRadius.large,
    borderTopRightRadius: Layout.borderRadius.large,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.large,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.semibold,
  },
  closeButton: {
    padding: Layout.spacing.small,
  },
  form: {
    padding: Layout.spacing.large,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.medium,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: Layout.spacing.xsmall,
  },
  label: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.xsmall,
  },
  input: {
    height: 48,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.medium,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  submitButton: {
    margin: Layout.spacing.large,
    height: 56,
    borderRadius: Layout.borderRadius.large,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
  timeOfDayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Layout.spacing.small,
  },
  timeOfDayButton: {
    flex: 1,
    height: 48,
    borderRadius: Layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  timeOfDayText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
}); 