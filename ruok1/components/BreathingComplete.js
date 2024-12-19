import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import Svg, { Path, Circle } from 'react-native-svg';
import { doc, updateDoc, increment, getDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default function BreathingComplete({ navigation, route }) {
  const { theme } = useTheme();
  const { totalBreaths, streak = 1, totalSessions = 1 } = route.params;

  const updateBreathMetrics = async () => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};
      const today = new Date().toDateString();
      
      // Calculate daily breaths
      let newDailyBreaths = totalBreaths;
      if (userData.lastBreathDate === today) {
        newDailyBreaths = (userData.dailyBreaths || 0) + totalBreaths;
      }

      // Store session data in a coaching-friendly format
      const sessionData = {
        timestamp: new Date().toISOString(),
        breathCount: totalBreaths,
        completed: true
      };

      await updateDoc(userRef, {
        dailyBreaths: newDailyBreaths,
        totalBreaths: (userData.totalBreaths || 0) + totalBreaths,
        lastBreathDate: today,
        'sessions': arrayUnion(sessionData)  // Keep track of sessions for future coaching features
      });
    } catch (error) {
      console.error('Error updating breath metrics:', error);
    }
  };

  useEffect(() => {
    updateBreathMetrics();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Breathwrk</Text>
      
      {/* Breath count circle with decorative elements */}
      <View style={styles.circleContainer}>
        <Svg width={300} height={300} viewBox="0 0 300 300">
          {/* Decorative spiral */}
          <Circle
            cx="150"
            cy="150"
            r="120"
            stroke={theme.colors.primary}
            strokeWidth="2"
            fill="none"
            opacity={0.3}
          />
          <Path
            d="M150,30 A120,120 0 0,1 270,150"
            stroke={theme.colors.primary}
            strokeWidth="2"
            fill="none"
          />
        </Svg>
        <View style={styles.breathCountContainer}>
          <Text style={[styles.breathCount, { color: theme.colors.text }]}>
            {totalBreaths}
          </Text>
          <Text style={[styles.breathLabel, { color: theme.colors.textSecondary }]}>
            Breaths
          </Text>
        </View>
      </View>

      <Text style={[styles.congratsText, { color: theme.colors.text }]}>
        Impressive! Level {Math.floor(totalBreaths/30)} achieved!
      </Text>
      <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
        You've grown stronger!
      </Text>

      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Streak
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {streak}
          </Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Total Sessions
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {totalSessions}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: theme.colors.text }]}
        onPress={() => navigation.navigate('MainTabs')}
      >
        <Text style={[styles.continueText, { color: theme.colors.background }]}>
          Continue
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => {/* Add share functionality */}}
      >
        <Text style={[styles.shareText, { color: theme.colors.textSecondary }]}>
          Share
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
}); 