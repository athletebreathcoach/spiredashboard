import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function BreathHistory() {
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const breathingRef = collection(db, 'users', auth.currentUser.uid, 'breathingExercises');
      const breathingQuery = query(breathingRef, orderBy('completedAt', 'desc'));
      const snapshot = await getDocs(breathingQuery);
      
      const breathingData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().completedAt?.toDate?.() || new Date(doc.data().completedAt)
      }));
      
      setHistory(breathingData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching breathing history:', error);
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {history.length > 0 ? (
          history.map((session) => (
            <View 
              key={session.id}
              style={[styles.sessionCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.sessionHeader}>
                <Text style={[styles.sessionTitle, { color: colors.text }]}>
                  {session.presetName || 'Custom Breath Protocol'}
                </Text>
                <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                  {formatDate(session.timestamp)}
                </Text>
              </View>
              
              <View style={styles.sessionDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {formatDuration(session.duration)}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {session.rounds} rounds
                  </Text>
                </View>
              </View>

              <View style={styles.patternContainer}>
                <Text style={[styles.patternText, { color: colors.textSecondary }]}>
                  {`${session.inhaleTime}s - ${session.inhaleHoldTime}s - ${session.exhaleTime}s - ${session.exhaleHoldTime}s`}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            No breathing sessions recorded yet
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  sessionCard: {
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  sessionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
  },
  sessionDate: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  sessionDetails: {
    flexDirection: 'row',
    gap: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  detailText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  patternContainer: {
    paddingTop: Layout.spacing.small,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  patternText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  emptyMessage: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    textAlign: 'center',
    marginTop: Layout.spacing.xlarge,
  },
}); 