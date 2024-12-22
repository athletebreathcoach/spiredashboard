import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

const { width } = Dimensions.get('window');

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

  // YouTube video ID for bench press tutorial
  const videoId = "vcBig73ojF0";

  const instructions = [
    "1. Lie on a flat bench with your feet flat on the floor",
    "2. Grip the barbell slightly wider than shoulder-width",
    "3. Unrack the bar and lower it to your mid-chest",
    "4. Keep your elbows at about a 45-degree angle to your body",
    "5. Touch the bar to your chest while maintaining control",
    "6. Press the bar back up to the starting position",
  ];

  const tips = [
    "Keep your wrists straight",
    "Maintain a tight core throughout the movement",
    "Drive your feet into the ground for stability",
    "Keep your shoulder blades retracted",
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{exercise.title}</Text>
      
      <View style={styles.videoContainer}>
        <YoutubePlayer
          height={220}
          videoId={videoId}
          play={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions</Text>
        {instructions.map((instruction, index) => (
          <Text key={index} style={[styles.instruction, { color: colors.textSecondary }]}>
            {instruction}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pro Tips</Text>
        {tips.map((tip, index) => (
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