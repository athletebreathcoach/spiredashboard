import React, { useState } from 'react';
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
const CONTAINER_PADDING = height * 0.03;
const ITEM_SPACING = height * 0.02;

export default function BreathSetup({ onStart }) {
  const { theme } = useTheme();
  const [settings, setSettings] = useState({
    inhaleTime: 4,
    inhaleHoldTime: 4,
    exhaleTime: 4,
    exhaleHoldTime: 4,
    rounds: 3,
  });

  const increment = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key] + 1
    }));
  };

  const decrement = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: Math.max(1, prev[key] - 1)
    }));
  };

  const TimerControl = ({ label, value, settingKey, style, textColor }) => (
    <View style={[styles.timerContainer, style]}>
      <Text style={[styles.timerLabel, { color: textColor }]}>{label}</Text>
      <View style={styles.controlRow}>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => decrement(settingKey)}
        >
          <Ionicons name="remove" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.timerValue, { color: textColor }]}>{value}s</Text>
        
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
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
          Customize your breathing exercise
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TimerControl 
          label="Inhale" 
          value={settings.inhaleTime}
          settingKey="inhaleTime"
          style={{ backgroundColor: theme.colors.surface }}
          textColor={theme.colors.text}
        />
        <TimerControl 
          label="Hold" 
          value={settings.inhaleHoldTime}
          settingKey="inhaleHoldTime"
          style={{ backgroundColor: theme.colors.surface }}
          textColor={theme.colors.text}
        />
        <TimerControl 
          label="Exhale" 
          value={settings.exhaleTime}
          settingKey="exhaleTime"
          style={{ backgroundColor: theme.colors.surface }}
          textColor={theme.colors.text}
        />
        <TimerControl 
          label="Hold" 
          value={settings.exhaleHoldTime}
          settingKey="exhaleHoldTime"
          style={{ backgroundColor: theme.colors.surface }}
          textColor={theme.colors.text}
        />
        <TimerControl 
          label="Rounds" 
          value={settings.rounds}
          settingKey="rounds"
          style={{ backgroundColor: theme.colors.surface }}
          textColor={theme.colors.text}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={() => onStart(settings)}
      >
        <Text style={styles.buttonText}>Begin Practice</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: CONTAINER_PADDING,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: ITEM_SPACING,
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
    justifyContent: 'center',
    gap: ITEM_SPACING,
  },
  timerContainer: {
    backgroundColor: '#111111',
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.large,
    minHeight: Layout.minTouchSize,
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
    width: Layout.minTouchSize,
    height: Layout.minTouchSize,
    borderRadius: Layout.minTouchSize / 2,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerValue: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    minWidth: 40,
    textAlign: 'center',
  },
  button: {
    padding: CONTAINER_PADDING,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    letterSpacing: 0.5,
  },
}); 