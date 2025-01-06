import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { auth, db } from '../config/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutHistory({ navigation }) {
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Default theme colors to use when theme isn't ready
  const defaultColors = {
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#00B5E0',
    border: '#2C2C2E'
  };

  // Use theme colors if available, otherwise fall back to defaults
  const colors = {
    background: theme?.colors?.background || defaultColors.background,
    surface: theme?.colors?.surface || defaultColors.surface,
    text: theme?.colors?.text || defaultColors.text,
    textSecondary: theme?.colors?.textSecondary || defaultColors.textSecondary,
    primary: theme?.colors?.primary || defaultColors.primary,
    border: theme?.colors?.border || defaultColors.border
  };

  const fetchHistory = async () => {
    try {
      const historyRef = collection(db, 'users', auth.currentUser.uid, 'exerciseHistory');
      const q = query(historyRef, orderBy('completedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const historyData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate()
      }));
      
      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching workout history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Workout History
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No workout history yet
          </Text>
        ) : (
          history.map((item) => (
            <View
              key={item.id}
              style={[styles.historyItem, { backgroundColor: colors.surface }]}
            >
              <View style={styles.historyHeader}>
                <View style={styles.titleContainer}>
                  <Ionicons 
                    name="barbell-outline" 
                    size={20} 
                    color={colors.primary} 
                    style={styles.titleIcon}
                  />
                  <Text style={[styles.title, { color: colors.text }]}>
                    {item.title}
                  </Text>
                </View>
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                  {formatDate(item.completedAt)}
                </Text>
              </View>

              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metrics, { color: colors.text }]}>
                    {item.metrics?.sets?.length || 0} sets
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Ionicons name="repeat-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metrics, { color: colors.text }]}>
                    {item.metrics?.sets?.[0]?.reps || 0} reps
                  </Text>
                </View>

                {item.metrics?.sets?.[0]?.weight && (
                  <View style={styles.metricItem}>
                    <Ionicons name="barbell-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.metrics, { color: colors.text }]}>
                      {item.metrics.sets[0].weight} lbs
                    </Text>
                  </View>
                )}

                {item.metrics?.eachSide && (
                  <View style={styles.metricItem}>
                    <Ionicons name="swap-horizontal-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.metrics, { color: colors.text }]}>
                      Each side
                    </Text>
                  </View>
                )}
              </View>

              {item.metrics?.notes && (
                <Text style={[styles.notes, { color: colors.textSecondary }]}>
                  Notes: {item.metrics.notes}
                </Text>
              )}

              {/* Show all sets if they're different */}
              {item.metrics?.sets?.length > 1 && !item.metrics.sets.every(set => 
                set.reps === item.metrics.sets[0].reps && 
                set.weight === item.metrics.sets[0].weight
              ) && (
                <View style={styles.setsContainer}>
                  {item.metrics.sets.map((set, index) => (
                    <Text key={index} style={[styles.setDetails, { color: colors.textSecondary }]}>
                      Set {index + 1}: {set.reps} reps @ {set.weight}lb
                    </Text>
                  ))}
                </View>
              )}

              {/* Show section or session context if available */}
              {(item.sectionTitle || item.sessionTitle) && (
                <View style={[styles.contextContainer, { borderTopColor: colors.border }]}>
                  <Ionicons 
                    name={item.sectionTitle ? "layers-outline" : "calendar-outline"} 
                    size={16} 
                    color={colors.textSecondary} 
                  />
                  <Text style={[styles.contextText, { color: colors.textSecondary }]}>
                    From {item.sectionTitle ? "section" : "session"}: {item.sectionTitle || item.sessionTitle}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.large,
    paddingVertical: Layout.spacing.medium,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: Layout.spacing.medium,
    padding: Layout.spacing.small,
  },
  headerTitle: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
  },
  scrollView: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Layout.spacing.xlarge,
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
  historyItem: {
    padding: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
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
  title: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
    flex: 1,
  },
  date: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  metrics: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  notes: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.small,
  },
  setsContainer: {
    marginBottom: Layout.spacing.medium,
  },
  setDetails: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.xsmall,
  },
  contextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
    paddingTop: Layout.spacing.medium,
    marginTop: Layout.spacing.medium,
    borderTopWidth: 1,
  },
  contextText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
}); 