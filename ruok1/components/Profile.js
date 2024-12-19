import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Profile({ navigation }) {
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setMetrics({
          dailyBreaths: data.dailyBreaths || 0,
          totalBreaths: data.totalBreaths || 0,
          lastBreathDate: data.lastBreathDate || null,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Fetch when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMetrics();
    });

    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.email, { color: theme.colors.text }]}>
        {auth.currentUser?.email}
      </Text>

      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Breath Metrics
        </Text>
        <Ionicons 
          name="time-outline" 
          size={24} 
          color={theme.colors.textSecondary}
          style={styles.historyIcon}
          onPress={() => navigation.navigate('BreathHistory')}
        />
      </View>
      
      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.metricValue, { color: theme.colors.text }]}>
            {metrics?.dailyBreaths || 0}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
            Daily Breaths
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.metricValue, { color: theme.colors.text }]}>
            {metrics?.totalBreaths || 0}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
            All Time Breaths
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  email: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.xlarge,
    textAlign: 'center',
  },
  statsTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.medium,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.medium,
    marginBottom: Layout.spacing.large,
  },
  metricCard: {
    flex: 1,
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: Layout.text.xxlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.tiny,
  },
  metricLabel: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  sectionTitle: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginRight: Layout.spacing.small,
  },
  historyIcon: {
    marginTop: 2, // Small adjustment to align with text
  },
}); 