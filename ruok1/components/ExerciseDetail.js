import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import YoutubePlayer from "react-native-youtube-iframe";

export default function ExerciseDetail({ route }) {
  const { theme } = useTheme();
  const { exercise } = route.params;

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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
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
}); 