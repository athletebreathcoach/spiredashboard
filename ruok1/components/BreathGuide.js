import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import BreathSetup from './BreathSetup';
import BreathAnimation from './BreathAnimation';

export default function BreathGuide({ navigation, route }) {
  const theme = useTheme();
  const [showSetup, setShowSetup] = useState(true);
  const [currentSettings, setCurrentSettings] = useState(null);
  const presetSettings = route.params?.settings;
  const presetName = route.params?.presetName;

  const handleStart = (settings) => {
    const sessionSettings = {
      ...settings,
      presetName: presetName || 'Custom Breath Protocol',
      inhaleTime: settings.inhaleTime,
      inhaleHoldTime: settings.inhaleHoldTime,
      exhaleTime: settings.exhaleTime,
      exhaleHoldTime: settings.exhaleHoldTime,
      rounds: settings.rounds,
      totalTime: settings.totalTime
    };
    setCurrentSettings(sessionSettings);
    setShowSetup(false);
  };

  if (!theme) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]} />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {showSetup ? (
        <BreathSetup 
          onStart={handleStart} 
          initialSettings={presetSettings}
        />
      ) : (
        <BreathAnimation 
          pattern={currentSettings}
          navigation={navigation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 