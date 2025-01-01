import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import ApneaTableExecution from './ApneaTableExecution';

const { width } = Dimensions.get('window');

export default function ApneaTablePreview({ settings, onStart, onBack }) {
  const theme = useTheme();
  const [showExecution, setShowExecution] = useState(false);
  const {
    tableName,
    breathHolds,
    apneaTime,
    restStartTime,
    restDecrement,
    cooldownTime,
  } = settings;

  // Convert time strings to seconds for calculations
  const getSeconds = (timeString) => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate rest times for each round
  const generateTable = () => {
    const table = [];
    const apneaSeconds = getSeconds(apneaTime);
    let restSeconds = getSeconds(restStartTime);
    const decrementSeconds = getSeconds(restDecrement);

    for (let i = 0; i < breathHolds; i++) {
      table.push({
        round: i + 1,
        hold: apneaTime,
        rest: formatTime(Math.max(0, restSeconds))
      });
      restSeconds -= decrementSeconds;
    }

    return table;
  };

  const table = generateTable();
  const totalTime = table.reduce((acc, round) => {
    return acc + getSeconds(round.hold) + getSeconds(round.rest);
  }, getSeconds(cooldownTime));

  if (showExecution) {
    return (
      <ApneaTableExecution
        settings={settings}
        onClose={() => setShowExecution(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          Preview Table
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{tableName}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Total Time: {formatTime(totalTime)}
        </Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { color: theme.colors.textSecondary }]}>ROUND</Text>
          <Text style={[styles.headerCell, { color: theme.colors.textSecondary }]}>HOLD</Text>
          <Text style={[styles.headerCell, { color: theme.colors.textSecondary }]}>REST</Text>
        </View>

        {table.map((round, index) => (
          <View 
            key={index}
            style={[
              styles.tableRow,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={[styles.cell, { color: theme.colors.text }]}>
              {round.round}
            </Text>
            <Text style={[styles.cell, { color: '#FF6B6B' }]}>
              {round.hold}
            </Text>
            <Text style={[styles.cell, { color: '#4CD964' }]}>
              {round.rest}
            </Text>
          </View>
        ))}

        <View 
          style={[
            styles.tableRow,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text style={[styles.cell, { color: theme.colors.text }]}>
            COOLDOWN
          </Text>
          <Text style={[styles.cell, { color: '#4CD964' }]} numberOfLines={1}>
            {cooldownTime}
          </Text>
          <Text style={[styles.cell, { color: theme.colors.text }]}>
            -
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowExecution(true)}
      >
        <Text style={[styles.startButtonText, { color: theme.colors.background }]}>
          Start Table
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    marginTop: 40,
  },
  backButton: {
    padding: Layout.spacing.small,
    marginRight: Layout.spacing.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
    marginRight: Layout.spacing.xlarge,
  },
  scrollView: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
  },
  subtitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Layout.spacing.small,
    marginBottom: Layout.spacing.medium,
  },
  headerCell: {
    flex: 1,
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.small,
  },
  cell: {
    flex: 1,
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  startButton: {
    margin: Layout.spacing.large,
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
}); 