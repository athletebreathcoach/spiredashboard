import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityMetricsForm({ visible, onClose, onSubmit, activity }) {
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState({
    sets: '',
    reps: '',
    weight: '',
    notes: '',
  });

  // Default colors to use when theme isn't ready
  const defaultColors = {
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#00B5E0',
    error: '#FF3B30',
  };

  // Use theme colors if available, otherwise fall back to defaults
  const colors = {
    background: theme?.colors?.background || defaultColors.background,
    surface: theme?.colors?.surface || defaultColors.surface,
    text: theme?.colors?.text || defaultColors.text,
    textSecondary: theme?.colors?.textSecondary || defaultColors.textSecondary,
    primary: theme?.colors?.primary || defaultColors.primary,
    error: theme?.colors?.error || defaultColors.error,
  };

  const handleSubmit = () => {
    if (!metrics.sets || !metrics.reps) {
      Alert.alert('Required Fields', 'Please fill in sets and reps before submitting.');
      return;
    }

    const formattedMetrics = {
      sets: parseInt(metrics.sets, 10),
      reps: parseInt(metrics.reps, 10),
      weight: metrics.weight ? parseFloat(metrics.weight) : null,
      notes: metrics.notes || '',
    };

    onSubmit(formattedMetrics);
    setMetrics({ sets: '', reps: '', weight: '', notes: '' });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Log {activity?.title || 'Exercise'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Sets *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={metrics.sets}
                onChangeText={(text) => setMetrics({ ...metrics, sets: text })}
                keyboardType="number-pad"
                placeholder="Enter number of sets"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Reps *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={metrics.reps}
                onChangeText={(text) => setMetrics({ ...metrics, reps: text })}
                keyboardType="number-pad"
                placeholder="Enter number of reps"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Weight (lbs)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={metrics.weight}
                onChangeText={(text) => setMetrics({ ...metrics, weight: text })}
                keyboardType="decimal-pad"
                placeholder="Enter weight (optional)"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput, { backgroundColor: colors.background, color: colors.text }]}
                value={metrics.notes}
                onChangeText={(text) => setMetrics({ ...metrics, notes: text })}
                placeholder="Add any notes (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitButtonText, { color: colors.background }]}>
              Save Log
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Layout.borderRadius.large,
    borderTopRightRadius: Layout.borderRadius.large,
    padding: Layout.spacing.large,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.large,
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
  },
  closeButton: {
    padding: Layout.spacing.small,
  },
  form: {
    minHeight: 300,
    marginBottom: Layout.spacing.large,
  },
  inputGroup: {
    marginBottom: Layout.spacing.large,
  },
  label: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
  },
  input: {
    height: 48,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.medium,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  notesInput: {
    height: 120,
    paddingTop: Layout.spacing.medium,
    paddingBottom: Layout.spacing.medium,
  },
  submitButton: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
  },
  submitButtonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
}); 