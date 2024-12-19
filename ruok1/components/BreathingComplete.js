import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
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
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const session = {
        timestamp: Date.now(),
        ...sessionData
      };

      await updateDoc(userRef, {
        sessions: arrayUnion(session)
      });

      // Navigate back to home after successful save
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving session:', error);
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Session Complete!
      </Text>
      
      <View style={styles.statsContainer}>
        {/* ... existing stats ... */}
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
  },
  circleContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Layout.spacing.xlarge,
  },
  breathCountContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  breathCount: {
    fontFamily: Typography.fonts.bold,
    fontSize: 72,
  },
  breathLabel: {
    fontFamily: Typography.fonts.medium,
    fontSize: Layout.text.large,
  },
  congratsText: {
    fontFamily: Typography.fonts.bold,
    fontSize: Layout.text.xlarge,
    textAlign: 'center',
    marginBottom: Layout.spacing.small,
  },
  subText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Layout.text.large,
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
  continueButton: {
    width: '100%',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    alignItems: 'center',
  },
  continueText: {
    fontFamily: Typography.fonts.bold,
    fontSize: Layout.text.large,
  },
  shareButton: {
    marginTop: Layout.spacing.large,
  },
  shareText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Layout.text.medium,
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