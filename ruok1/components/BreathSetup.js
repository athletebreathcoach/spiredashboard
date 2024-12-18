import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');
const CONTAINER_PADDING = height * 0.03;
const ITEM_SPACING = height * 0.02;

export default function BreathSetup({ onStart }) {
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

  const TimerControl = ({ label, value, settingKey }) => (
    <View style={styles.timerContainer}>
      <Text style={styles.timerLabel}>{label}</Text>
      <View style={styles.controlRow}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => decrement(settingKey)}
        >
          <Ionicons name="remove" size={20} color="#00B5E0" />
        </TouchableOpacity>
        
        <Text style={styles.timerValue}>{value}s</Text>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => increment(settingKey)}
        >
          <Ionicons name="add" size={20} color="#00B5E0" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Breathing Pattern</Text>
        <Text style={styles.subtitle}>Customize your breathing exercise</Text>
      </View>

      <View style={styles.controlsContainer}>
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
        style={styles.beginButton}
        onPress={() => onStart(settings)}
      >
        <Text style={styles.beginButtonText}>Begin Practice</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: CONTAINER_PADDING,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: ITEM_SPACING,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: ITEM_SPACING,
  },
  timerContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: CONTAINER_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ITEM_SPACING,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  beginButton: {
    backgroundColor: '#00B5E0',
    padding: CONTAINER_PADDING,
    borderRadius: 12,
    alignItems: 'center',
  },
  beginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
}); 