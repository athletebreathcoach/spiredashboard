import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

export default function BreathingComplete({ navigation, route }) {
  const { theme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const { totalBreaths, streak, totalSessions, sessionData } = route.params;

  const handleLogSession = async () => {
    setIsSaving(true);
    try {
      // Save to the breathingExercises subcollection
      const breathingRef = collection(db, 'users', auth.currentUser.uid, 'breathingExercises');
      await addDoc(breathingRef, {
        ...sessionData,
        totalBreaths,
        completedAt: serverTimestamp(),
        duration: sessionData.totalTime,
        protocol: sessionData.presetName
      });

      // Navigate back to home after successful save
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save breathing session');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Session Complete!
      </Text>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Duration
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {sessionData.totalTime}s
          </Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Breaths
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {totalBreaths}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleLogSession}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.logButtonText}>Log Session</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.skipButton]}
        onPress={() => navigation.navigate('Home')}
        disabled={isSaving}
      >
        <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
          Skip Logging
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: Layout.spacing.large,
  },
  title: {
    fontFamily: Typography.fonts.medium,
    fontSize: Layout.text.xlarge,
    marginTop: Layout.spacing.large,
    marginBottom: Layout.spacing.xlarge,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.medium,
    marginBottom: Layout.spacing.xlarge,
  },
  statBox: {
    flex: 1,
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: Layout.text.medium,
    marginBottom: Layout.spacing.small,
  },
  statValue: {
    fontFamily: Typography.fonts.bold,
    fontSize: Layout.text.xxlarge,
  },
  logButton: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    marginTop: Layout.spacing.xlarge,
    width: '80%',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
  skipButton: {
    padding: Layout.spacing.medium,
    marginTop: Layout.spacing.medium,
  },
  skipButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  }
}); 