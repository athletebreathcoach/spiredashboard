import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import YoutubePlayer from "react-native-youtube-iframe";
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import ActivityMetricsForm from './ActivityMetricsForm';

export default function ExerciseDetail({ route, navigation }) {
  const { theme } = useTheme();
  const { exercise } = route.params;
  const [showMetricsForm, setShowMetricsForm] = useState(false);

  // Default colors to use when theme isn't ready
  const defaultColors = {
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#00B5E0'
  };

  // Use theme colors if available, otherwise fall back to defaults
  const colors = {
    background: theme?.colors?.background || defaultColors.background,
    surface: theme?.colors?.surface || defaultColors.surface,
    text: theme?.colors?.text || defaultColors.text,
    textSecondary: theme?.colors?.textSecondary || defaultColors.textSecondary,
    primary: theme?.colors?.primary || defaultColors.primary
  };

  const handleMetricsSubmit = async (metrics) => {
    try {
      const historyRef = collection(db, 'users', auth.currentUser.uid, 'exerciseHistory');
      await addDoc(historyRef, {
        exerciseId: exercise.id,
        title: exercise.title,
        type: exercise.type.name,
        primaryMuscleGroup: exercise.primaryMuscleGroup.name,
        metrics,
        completedAt: serverTimestamp(),
      });

      setShowMetricsForm(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving exercise metrics:', error);
      Alert.alert('Error', 'Failed to save exercise metrics. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: colors.text }]}>{exercise.title}</Text>
        
        {exercise.videoId && (
          <View style={styles.videoContainer}>
            <YoutubePlayer
              height={220}
              videoId={exercise.videoId}
              play={false}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Type & Target</Text>
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: colors.surface }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {exercise.type.name}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: colors.surface }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {exercise.primaryMuscleGroup.name}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Equipment Needed</Text>
          <View style={styles.tags}>
            {Object.values(exercise.equipment).map((equip) => (
              <View key={equip.id} style={[styles.tag, { backgroundColor: colors.surface }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  {equip.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {exercise.description}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions</Text>
          {exercise.instructions.map((instruction, index) => (
            <Text key={index} style={[styles.instruction, { color: colors.textSecondary }]}>
              {instruction}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pro Tips</Text>
          {exercise.tips.map((tip, index) => (
            <Text key={index} style={[styles.tip, { color: colors.textSecondary }]}>
              • {tip}
            </Text>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.logButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowMetricsForm(true)}
      >
        <Ionicons name="barbell-outline" size={24} color={colors.background} style={styles.logButtonIcon} />
        <Text style={[styles.logButtonText, { color: colors.background }]}>
          Log Exercise
        </Text>
      </TouchableOpacity>

      <ActivityMetricsForm
        visible={showMetricsForm}
        onClose={() => setShowMetricsForm(false)}
        onSubmit={handleMetricsSubmit}
        activity={{ ...exercise, type: exercise.type.name.toLowerCase() }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  title: {
    fontSize: Layout.text.xxlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.large,
  },
  videoContainer: {
    marginBottom: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    overflow: 'hidden',
  },
  section: {
    marginBottom: Layout.spacing.large,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.medium,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.small,
  },
  tagText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  description: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    lineHeight: 24,
  },
  instruction: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.small,
  },
  tip: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.small,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.medium,
    margin: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
  },
  logButtonIcon: {
    marginRight: Layout.spacing.small,
  },
  logButtonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
}); 