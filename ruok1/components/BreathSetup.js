import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

const { height } = Dimensions.get('window');
const CONTAINER_PADDING = height * 0.02;
const ITEM_SPACING = height * 0.012;

export default function BreathSetup({ onStart, initialSettings, isScheduling }) {
  const theme = useTheme();
  const [settings, setSettings] = useState(initialSettings || {
    inhaleTime: 4,
    inhaleHoldTime: 4,
    exhaleTime: 4,
    exhaleHoldTime: 4,
    rounds: 3,
    totalTime: 48,
  });

  useEffect(() => {
    if (initialSettings) {
      const roundTime = 
        initialSettings.inhaleTime + 
        initialSettings.inhaleHoldTime + 
        initialSettings.exhaleTime + 
        initialSettings.exhaleHoldTime;
      setSettings({
        ...initialSettings,
        totalTime: roundTime * initialSettings.rounds
      });
    }
  }, [initialSettings]);

  const getRoundTime = () => {
    return settings.inhaleTime + 
           settings.inhaleHoldTime + 
           settings.exhaleTime + 
           settings.exhaleHoldTime;
  };

  const updateRoundsFromTime = (totalTime) => {
    const roundTime = getRoundTime();
    const newRounds = Math.max(1, Math.floor(totalTime / roundTime));
    setSettings(prev => ({
      ...prev,
      rounds: newRounds,
      totalTime: newRounds * roundTime
    }));
  };

  const updateTimeFromRounds = (rounds) => {
    const roundTime = getRoundTime();
    setSettings(prev => ({
      ...prev,
      rounds,
      totalTime: rounds * roundTime
    }));
  };

  const increment = (key) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: prev[key] + 1
      };
      
      if (key !== 'rounds') {
        const newRoundTime = 
          (key === 'inhaleTime' ? newSettings.inhaleTime : prev.inhaleTime) +
          (key === 'inhaleHoldTime' ? newSettings.inhaleHoldTime : prev.inhaleHoldTime) +
          (key === 'exhaleTime' ? newSettings.exhaleTime : prev.exhaleTime) +
          (key === 'exhaleHoldTime' ? newSettings.exhaleHoldTime : prev.exhaleHoldTime);
        
        newSettings.totalTime = newRoundTime * prev.rounds;
      } else {
        newSettings.totalTime = newSettings.rounds * getRoundTime();
      }
      
      return newSettings;
    });
  };

  const decrement = (key) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: key.includes('Hold') ? Math.max(0, prev[key] - 1) : Math.max(1, prev[key] - 1)
      };
      
      if (key !== 'rounds') {
        const newRoundTime = 
          (key === 'inhaleTime' ? newSettings.inhaleTime : prev.inhaleTime) +
          (key === 'inhaleHoldTime' ? newSettings.inhaleHoldTime : prev.inhaleHoldTime) +
          (key === 'exhaleTime' ? newSettings.exhaleTime : prev.exhaleTime) +
          (key === 'exhaleHoldTime' ? newSettings.exhaleHoldTime : prev.exhaleHoldTime);
        
        newSettings.totalTime = newRoundTime * prev.rounds;
      } else {
        newSettings.totalTime = newSettings.rounds * getRoundTime();
      }
      
      return newSettings;
    });
  };

  const formatTimeMMSS = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const TimeControl = ({ label, value, onIncrement, onDecrement, style, textColor, isTotal = false }) => (
    <View style={[styles.timerContainer, style]}>
      <Text style={[styles.timerLabel, { color: theme.colors.text }]}>{label}</Text>
      <View style={styles.controlRow}>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={onDecrement}
        >
          <Ionicons name="remove" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.timerValue, { color: theme.colors.text }]}>
          {isTotal ? formatTimeMMSS(value) : `${value}s`}
        </Text>
        
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={onIncrement}
        >
          <Ionicons name="add" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const TimerControl = ({ label, value, settingKey, style }) => (
    <View style={[styles.timerContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.timerLabel, { color: theme.colors.text }]}>{label}</Text>
      <View style={styles.controlRow}>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.background }]}
          onPress={() => decrement(settingKey)}
        >
          <Ionicons name="remove" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.timerValue, { color: theme.colors.text }]}>{value}s</Text>
        
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.background }]}
          onPress={() => increment(settingKey)}
        >
          <Ionicons name="add" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Breathing Pattern</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {isScheduling ? 'Adjust protocol settings before scheduling' : 'Customize your breathing exercise'}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TimeControl 
          label="Total Time" 
          value={settings.totalTime}
          onIncrement={() => {
            const newTime = settings.totalTime + getRoundTime();
            updateRoundsFromTime(newTime);
          }}
          onDecrement={() => {
            const newTime = Math.max(getRoundTime(), settings.totalTime - getRoundTime());
            updateRoundsFromTime(newTime);
          }}
          style={{ backgroundColor: theme.colors.surface }}
          isTotal={true}
        />

        <TimerControl 
          label="Inhale" 
          value={settings.inhaleTime}
          settingKey="inhaleTime"
        />
        <TimerControl 
          label="Hold" 
          value={settings.inhaleHoldTime}
          settingKey="inhaleHoldTime"
        />
        <TimerControl 
          label="Exhale" 
          value={settings.exhaleTime}
          settingKey="exhaleTime"
        />
        <TimerControl 
          label="Hold" 
          value={settings.exhaleHoldTime}
          settingKey="exhaleHoldTime"
        />
        <TimerControl 
          label="Rounds" 
          value={settings.rounds}
          settingKey="rounds"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={() => onStart(settings)}
      >
        <Text style={[styles.buttonText, { color: theme.colors.white }]}>
          {isScheduling ? 'Schedule Protocol' : 'Start Exercise'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: CONTAINER_PADDING,
  },
  header: {
    marginTop: CONTAINER_PADDING,
    marginBottom: CONTAINER_PADDING * 2,
  },
  title: {
    fontSize: Layout.text.xxlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
    letterSpacing: 0.35,
  },
  subtitle: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    letterSpacing: 0.25,
    lineHeight: Layout.text.small * 1.4,
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: ITEM_SPACING,
    paddingVertical: ITEM_SPACING,
    paddingBottom: ITEM_SPACING * 4,
  },
  timerContainer: {
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.medium,
    minHeight: Layout.minTouchSize * 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerLabel: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    flex: 1,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ITEM_SPACING,
  },
  controlButton: {
    width: Layout.minTouchSize * 0.8,
    height: Layout.minTouchSize * 0.8,
    borderRadius: (Layout.minTouchSize * 0.8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerValue: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    minWidth: 35,
    textAlign: 'center',
  },
  button: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    alignItems: 'center',
    position: 'absolute',
    bottom: CONTAINER_PADDING * 4,
    left: CONTAINER_PADDING,
    right: CONTAINER_PADDING,
  },
  buttonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    letterSpacing: 0.5,
  },
}); 