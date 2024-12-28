import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function ClientBreathTestHistory({ route }) {
  const { theme } = useTheme();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { clientId } = route.params;

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
    fetchTests();
  }, [clientId]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const testsRef = collection(db, 'breathingTests');
      const testsQuery = query(testsRef, 
        where('userId', '==', clientId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(testsQuery);
      
      const testsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
      }));
      
      setTests(testsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching client breathing tests:', error);
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

  const formatTestResult = (test) => {
    if (test.resultType === 'timer') {
      const mins = Math.floor(test.result / 60);
      const secs = test.result % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } else if (test.resultType === 'steps') {
      return `${test.result} steps`;
    }
    return test.result.toString();
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
        {tests.length > 0 ? (
          tests.map((test) => (
            <View 
              key={test.id}
              style={[styles.testCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.testHeader}>
                <Text style={[styles.testTitle, { color: colors.text }]}>
                  {test.testName}
                </Text>
                <Text style={[styles.testDate, { color: colors.textSecondary }]}>
                  {formatDate(test.timestamp)}
                </Text>
              </View>
              
              <View style={styles.testDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="trophy-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {test.level}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="stats-chart-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {formatTestResult(test)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            No breathing tests recorded yet
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
  testCard: {
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  testTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
  },
  testDate: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  testDetails: {
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
  emptyMessage: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    textAlign: 'center',
    marginTop: Layout.spacing.xlarge,
  },
}); 