import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

export default function BreathTestDetail({ navigation, route }) {
  const { test } = route.params;
  const theme = useTheme();
  const [phase, setPhase] = useState('ready'); // ready, testing, complete
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);
  const startTime = useRef(null);

  const scale = useRef(new Animated.Value(1.2)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;

  const referenceCircles = [
    { scale: 1.2, label: '0s' },
    { scale: 1.1, label: '10s' },
    { scale: 1.0, label: '20s' },
    { scale: 0.9, label: '30s' },
    { scale: 0.8, label: '40s' },
    { scale: 0.7, label: '50s' },
    { scale: 0.6, label: '60s' },
    { scale: 0.5, label: '70s' },
    { scale: 0.4, label: '80s' },
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTest = () => {
    setPhase('testing');
    startTime.current = Date.now();
    
    // Start the timer
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    // Start the shrinking animation
    Animated.timing(scale, {
      toValue: 0.4,
      duration: 80000, // 80 seconds animation
      useNativeDriver: false,
    }).start();

    // Fade animation
    Animated.timing(opacity, {
      toValue: 0.4,
      duration: 80000, // 80 seconds animation
      useNativeDriver: false,
    }).start();
  };

  const stopTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime.current) / 1000);
    
    setResult(duration);
    setPhase('complete');
    
    // Stop animations
    scale.stopAnimation();
    opacity.stopAnimation();
    
    // Reset scale for next time
    scale.setValue(1.2);
    opacity.setValue(0.9);
    
    // Trigger success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScore = (seconds) => {
    if (seconds < 10) return 'Beginner';
    if (seconds < 20) return 'Intermediate';
    if (seconds < 30) return 'Advanced';
    return 'Expert';
  };

  const renderContent = () => {
    switch (phase) {
      case 'ready':
        return (
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Exhale Test
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              Take a deep breath in to your maximum capacity, then exhale slowly and steadily through your nose for as long as you can.
              This test measures your exhale control and lung capacity.
            </Text>
            <View style={styles.instructionsContainer}>
              <Text style={[styles.instructionTitle, { color: theme.colors.text }]}>
                Instructions:
              </Text>
              <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
                1. Sit in a comfortable position
              </Text>
              <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
                2. Take a deep breath in through your nose to maximum capacity
              </Text>
              <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
                3. Once you've inhaled fully, press start
              </Text>
              <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
                4. Exhale slowly through your nose
              </Text>
              <Text style={[styles.instruction, { color: theme.colors.textSecondary }]}>
                5. Continue until you need to breathe in
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={startTest}
            >
              <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                Start Test
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'testing':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.animationContainer}>
              {/* Reference circles */}
              {referenceCircles.map((circle, index) => (
                <View
                  key={index}
                  style={[
                    styles.referenceCircle,
                    {
                      transform: [{ scale: circle.scale }],
                      borderColor: theme.colors.primary,
                    },
                  ]}
                >
                  <Text style={[styles.referenceLabel, { color: theme.colors.textSecondary }]}>
                    {circle.label}
                  </Text>
                </View>
              ))}
              {/* Animated circle */}
              <Animated.View
                style={[
                  styles.circle,
                  {
                    backgroundColor: theme.colors.primary,
                    transform: [{ scale }],
                    opacity,
                  },
                ]}
              />
            </View>
            <View style={styles.controlsContainer}>
              <Text style={[styles.timer, { color: theme.colors.text }]}>
                {formatTime(timer)}
              </Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.error }]}
                onPress={stopTest}
              >
                <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                  Stop
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Test Complete
            </Text>
            <View style={styles.resultsContainer}>
              <View style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>
                  Duration
                </Text>
                <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                  {formatTime(result)}
                </Text>
              </View>
              <View style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>
                  Level
                </Text>
                <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                  {getScore(result)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.xlarge * 2,
  },
  title: {
    fontSize: Layout.text.xxlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.medium,
    textAlign: 'center',
  },
  description: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    textAlign: 'center',
    marginBottom: Layout.spacing.xlarge,
    lineHeight: Layout.text.medium * 1.4,
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: Layout.spacing.xlarge,
  },
  instructionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.medium,
  },
  instruction: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.small,
    lineHeight: Layout.text.medium * 1.4,
  },
  animationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  controlsContainer: {
    alignItems: 'center',
    marginTop: Layout.spacing.xlarge * 2,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    position: 'absolute',
  },
  referenceCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceLabel: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    position: 'absolute',
    bottom: -20,
  },
  timer: {
    fontSize: Layout.text.xxxlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.large,
  },
  button: {
    paddingVertical: Layout.spacing.medium,
    paddingHorizontal: Layout.spacing.xlarge,
    borderRadius: Layout.borderRadius.large,
    marginTop: Layout.spacing.large,
  },
  buttonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
  resultsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.large,
    marginVertical: Layout.spacing.xlarge,
  },
  resultCard: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    minWidth: width * 0.35,
  },
  resultLabel: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
  },
  resultValue: {
    fontSize: Layout.text.xxlarge,
    fontFamily: Typography.fonts.bold,
  },
}); 