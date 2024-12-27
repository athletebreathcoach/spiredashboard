import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { auth, db } from '../config/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function BreathTestHistory() {
  const theme = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Default colors to use when theme isn't ready
  const defaultColors = {
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#00B5E0'
  };

  // Use theme colors if available, otherwise fall back to defaults
  const colors = theme?.colors || defaultColors;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const breathTestRef = collection(db, 'breathingTests');
      const q = query(
        breathTestRef,
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const testData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
      }));

      setHistory(testData);
    } catch (error) {
      console.error('Error fetching breath test history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
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

  const formatResult = (result, resultType) => {
    if (resultType === 'timer') {
      const mins = Math.floor(result / 60);
      const secs = result % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${result} steps`;
  };

  const getChartData = () => {
    // Group tests by type
    const testTypes = {};
    history.forEach(test => {
      if (!testTypes[test.testName]) {
        testTypes[test.testName] = [];
      }
      testTypes[test.testName].push({
        result: test.result,
        timestamp: test.timestamp
      });
    });

    // Create datasets for each test type
    const datasets = Object.entries(testTypes).map(([testName, tests]) => {
      const sortedTests = tests.sort((a, b) => a.timestamp - b.timestamp);
      return {
        data: sortedTests.map(test => test.result),
        color: (opacity = 1) => colors.primary,
        strokeWidth: 2,
        testName
      };
    });

    // Get all timestamps for labels
    const allDates = history
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(test => test.timestamp);

    return {
      labels: allDates.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets
    };
  };

  const renderChart = () => {
    if (history.length === 0) return null;

    const chartData = getChartData();
    const chartConfig = {
      backgroundColor: colors.surface,
      backgroundGradientFrom: colors.surface,
      backgroundGradientTo: colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => colors.primary,
      labelColor: (opacity = 1) => colors.textSecondary,
      style: {
        borderRadius: Layout.borderRadius.medium,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: colors.primary
      },
      propsForBackgroundLines: {
        stroke: colors.border,
        strokeDasharray: [], // Solid line
      },
      propsForLabels: {
        fill: colors.textSecondary,
      }
    };

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Progress Over Time</Text>
        {chartData.datasets.map((dataset, index) => (
          <View key={index} style={styles.chartSection}>
            <Text style={[styles.chartSubtitle, { color: colors.text }]}>{dataset.testName}</Text>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [{
                  ...dataset,
                  color: (opacity = 1) => colors.primary,
                }]
              }}
              width={width - Layout.spacing.large * 2}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: Layout.spacing.medium,
                borderRadius: Layout.borderRadius.medium,
              }}
            />
          </View>
        ))}
      </View>
    );
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderChart()}
        
        {history.length > 0 ? (
          history.map((test) => (
            <View 
              key={test.id}
              style={[styles.historyCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.historyHeader}>
                <View style={styles.titleContainer}>
                  <Ionicons 
                    name={test.resultType === 'timer' ? 'timer-outline' : 'walk-outline'} 
                    size={20} 
                    color={colors.primary} 
                    style={styles.titleIcon}
                  />
                  <Text style={[styles.historyTitle, { color: colors.text }]}>
                    {test.testName}
                  </Text>
                </View>
                <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                  {formatDate(test.timestamp)}
                </Text>
              </View>

              <View style={styles.historyDetails}>
                <View style={styles.detailItem}>
                  <Ionicons 
                    name={test.resultType === 'timer' ? 'time-outline' : 'footsteps-outline'} 
                    size={16} 
                    color={colors.textSecondary} 
                  />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {formatResult(test.result, test.resultType)}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name="trophy-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {test.level}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            No breath tests completed yet
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
  chartContainer: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.large,
  },
  chartTitle: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.medium,
  },
  chartSection: {
    marginBottom: Layout.spacing.large,
  },
  chartSubtitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.small,
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