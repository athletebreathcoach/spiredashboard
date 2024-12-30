import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import BreathSetup from './BreathSetup';
import BreathAnimation from './BreathAnimation';
import { scheduleBreathProtocol } from '../firebase/scheduledExercises';

export default function BreathGuide({ navigation, route }) {
  const theme = useTheme();
  const [showSetup, setShowSetup] = useState(true);
  const [currentSettings, setCurrentSettings] = useState(null);
  const presetSettings = route.params?.settings;
  const presetName = route.params?.presetName;
  const schedulingInfo = route.params?.schedulingInfo;

  const handleStart = async (settings) => {
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

    if (schedulingInfo) {
      try {
        // Schedule the protocol for all selected dates
        for (const dateString of schedulingInfo.dates) {
          // Parse the date string components
          const [year, month, day] = dateString.split('-').map(Number);
          // Create date using local components to avoid timezone issues
          const date = new Date();
          date.setFullYear(year);
          date.setMonth(month - 1); // months are 0-based
          date.setDate(day);
          date.setHours(12, 0, 0, 0);
          
          console.log('Scheduling date in BreathGuide:', {
            originalDateString: dateString,
            year,
            month,
            day,
            parsedDate: date,
            parsedDateISO: date.toISOString(),
            parsedDateLocale: date.toLocaleString()
          });
          
          await scheduleBreathProtocol(
            schedulingInfo.userId,
            schedulingInfo.protocolId,
            date,
            {
              metrics: {
                timeOfDay: schedulingInfo.timeOfDay,
                completed: false,
                pattern: schedulingInfo.protocol.pattern,
                rounds: settings.rounds,
                duration: settings.totalTime
              },
              protocol: {
                ...schedulingInfo.protocol,
                pattern: {
                  ...schedulingInfo.protocol.pattern,
                  inhale: settings.inhaleTime,
                  inHold: settings.inhaleHoldTime,
                  exhale: settings.exhaleTime,
                  exHold: settings.exhaleHoldTime
                },
                rounds: settings.rounds,
                duration: settings.totalTime.toString()
              }
            }
          );
        }
        navigation.goBack();
        navigation.goBack(); // Go back twice to return to breath protocols list
        return;
      } catch (error) {
        console.error('Error scheduling protocol:', error);
        Alert.alert('Error', 'Failed to schedule protocol');
      }
    }

    // If not scheduling, proceed with the breath animation
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
          isScheduling={!!schedulingInfo}
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