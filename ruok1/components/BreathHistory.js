import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function BreathHistory({ userId }) {
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use provided userId or fall back to current user
  const targetUserId = userId || auth.currentUser.uid;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setHistory(data.sessions || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history:', error);
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {history.map((session, index) => (
          <View 
            key={index}
            style={[styles.sessionCard, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.sessionHeader}>
              <Text style={[styles.sessionTitle, { color: theme.colors.text }]}>
                {session.presetName || 'Custom Breath Protocol'}
              </Text>
              <Text style={[styles.sessionDate, { color: theme.colors.textSecondary }]}>
                {formatDate(session.timestamp)}
              </Text>
            </View>
            
            <View style={styles.sessionDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.detailText, { color: theme.colors.text }]}>
                  {formatDuration(session.totalTime)}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="repeat-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.detailText, { color: theme.colors.text }]}>
                  {session.rounds} rounds
                </Text>
              </View>
            </View>

            <View style={styles.patternContainer}>
              <Text style={[styles.patternText, { color: theme.colors.textSecondary }]}>
                {`${session.inhaleTime}s - ${session.inhaleHoldTime}s - ${session.exhaleTime}s - ${session.exhaleHoldTime}s`}
              </Text>
            </View>
          </View>
        ))}
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
}); 