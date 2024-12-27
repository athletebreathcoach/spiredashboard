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

export default function HabitTaskHistory() {
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
      // Fetch habit history
      const habitRef = collection(db, 'users', auth.currentUser.uid, 'habitHistory');
      const habitQuery = query(habitRef, orderBy('completedAt', 'desc'));
      const habitSnapshot = await getDocs(habitQuery);
      
      const habitData = habitSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().completedAt?.toDate?.() || new Date(doc.data().completedAt)
      }));

      // Fetch task history
      const taskRef = collection(db, 'users', auth.currentUser.uid, 'taskHistory');
      const taskQuery = query(taskRef, orderBy('completedAt', 'desc'));
      const taskSnapshot = await getDocs(taskQuery);
      
      const taskData = taskSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().completedAt?.toDate?.() || new Date(doc.data().completedAt)
      }));

      // Combine and sort all history by timestamp
      const allHistory = [...habitData, ...taskData].sort((a, b) => b.timestamp - a.timestamp);
      setHistory(allHistory);
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

  const renderHistoryItem = (item) => (
    <View 
      key={item.id}
      style={[styles.historyCard, { backgroundColor: colors.surface }]}
    >
      <View style={styles.historyHeader}>
        <View style={styles.titleContainer}>
          <Ionicons 
            name={item.type === 'habit' ? 'repeat' : 'checkmark-circle'} 
            size={20} 
            color={colors.primary} 
            style={styles.titleIcon}
          />
          <Text style={[styles.historyTitle, { color: colors.text }]}>
            {item.title}
          </Text>
        </View>
        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
          {formatDate(item.timestamp)}
        </Text>
      </View>

      <View style={styles.historyDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="folder-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.categoryId}
          </Text>
        </View>

        {item.metrics && Object.entries(item.metrics).map(([key, value]) => (
          <View key={key} style={styles.detailItem}>
            <Ionicons name="stats-chart" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {`${key}: ${value}`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

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
          history.map(item => renderHistoryItem(item))
        ) : (
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            No habits or tasks completed yet
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
  historyCard: {
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Layout.spacing.medium,
  },
  titleIcon: {
    marginRight: Layout.spacing.small,
  },
  historyTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
    flex: 1,
  },
  historyDate: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  historyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.medium,
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
  emptyMessage: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    textAlign: 'center',
    marginTop: Layout.spacing.xlarge,
  },
}); 