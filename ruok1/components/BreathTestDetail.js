import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import * as Haptics from 'expo-haptics';
import { Pedometer } from 'expo-sensors';
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

const getTestConfig = (testId) => {
  switch (testId) {
    case 'exhale-test':
      return {
        title: 'Exhale Test',
        type: 'timer',
        description: 'Take a deep breath in to your maximum capacity, then exhale slowly and steadily through your nose for as long as you can. This test measures your exhale control and lung capacity.',
        instructions: [
          'Sit in a comfortable position',
          'Take a deep breath in through your nose to maximum capacity',
          'Once you\'ve inhaled fully, press start',
          'Exhale slowly through your nose',
          'Continue until you need to breathe in'
        ],
        duration: 80000,
        initialScale: 1.2,
        finalScale: 0.4,
        referenceCircles: [
          { scale: 1.2, label: '0s' },
          { scale: 1.1, label: '10s' },
          { scale: 1.0, label: '20s' },
          { scale: 0.9, label: '30s' },
          { scale: 0.8, label: '40s' },
          { scale: 0.7, label: '50s' },
          { scale: 0.6, label: '60s' },
          { scale: 0.5, label: '70s' },
          { scale: 0.4, label: '80s' },
        ],
        getScore: (seconds) => {
          if (seconds < 10) return 'Beginner';
          if (seconds < 20) return 'Intermediate';
          if (seconds < 30) return 'Advanced';
          return 'Expert';
        }
      };
    case 'co2-walking-test':
      return {
        title: 'CO2 Walking Test',
        type: 'steps',
        description: 'This test measures your CO2 tolerance by counting how many steps you can take while holding your breath. A higher step count indicates better CO2 tolerance.',
        instructions: [
          'Stand in a clear area where you can walk safely',
          'Take a normal breath in and out through your nose',
          'Pinch your nose closed',
          'Press start and begin walking',
          'Count your steps as you walk',
          'When you need to breathe, stop walking',
          'Enter your step count'
        ],
        getScore: (steps) => {
          if (steps < 20) return 'Beginner';
          if (steps < 40) return 'Intermediate';
          if (steps < 60) return 'Advanced';
          return 'Expert';
        }
      };
    case 'bolt-test':
      return {
        title: 'BOLT Test',
        type: 'timer',
        description: 'The Body Oxygen Level Test (BOLT) measures your CO2 tolerance. Stop at your FIRST natural urge to breathe - this is not a maximum breath hold test.',
        instructions: [
          'Sit quietly and breathe normally for about 1 minute',
          'Take a normal breath in and out through your nose',
          'After a normal exhale, press start',
          'Hold your breath',
          'Stop at your FIRST definite desire to breathe',
          'Press stop immediately when you feel the urge'
        ],
        getScore: (seconds) => {
          if (seconds < 10) return 'Poor';
          if (seconds < 20) return 'Below Average';
          if (seconds < 30) return 'Average';
          if (seconds < 40) return 'Good';
          return 'Excellent';
        }
      };
    case 'tap-test':
      return {
        title: 'Tap Test',
        type: 'tap',
        description: 'The Tap Test measures your central nervous system readiness and fatigue level by counting how many times you can tap in 10 seconds.',
        instructions: [
          'Find a comfortable position',
          'Hold your device steady',
          'When ready, press start',
          'Tap the circle as rapidly as possible',
          'Continue for 10 seconds until the test ends'
        ],
        duration: 10000,
        getScore: (taps) => {
          if (taps < 40) return 'Fatigued';
          if (taps < 50) return 'Below Average';
          if (taps < 60) return 'Average';
          if (taps < 70) return 'Good';
          return 'Excellent';
        }
      };
    case 'max-breath-hold':
      return {
        title: 'Max Breath Hold',
        type: 'timer',
        description: 'This test measures your maximum breath hold capacity after a full inhalation. A longer hold time indicates better breath hold capacity.',
        instructions: [
          'Find a comfortable seated position',
          'Take several normal breaths to prepare',
          'Take a deep breath in to maximum capacity',
          'When ready, press start',
          'Hold your breath as long as you can',
          'Press stop when you need to breathe'
        ],
        getScore: (seconds) => {
          if (seconds < 30) return 'Beginner';
          if (seconds < 60) return 'Intermediate';
          if (seconds < 120) return 'Advanced';
          return 'Expert';
        }
      };
    default:
      console.error('Unknown test ID:', testId);
      return null;
  }
};

export default function BreathTestDetail({ navigation, route }) {
  const { test } = route.params;
  const testConfig = getTestConfig(test.id);
  const theme = useTheme();

  // Handle case where test config is not found
  if (!testConfig) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Test configuration not found
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: theme.colors.background }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [phase, setPhase] = useState('ready');
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);
  const startTime = useRef(null);
  const [steps, setSteps] = useState('');
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const subscription = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapCountRef = useRef(0);

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const [dots, setDots] = useState(Array(12).fill(0)); // 12 dots for the circle
  const dotScale = useRef(dots.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Create pulsing animation
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (phase === 'testing') {
          pulseAnimation();
        }
      });
    };

    if (phase === 'testing' && testConfig.type === 'timer') {
      pulseAnimation();
    }

    return () => {
      scale.setValue(1);
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (testConfig.type === 'steps') {
      checkPedometerAvailability();
    }
    return () => {
      if (subscription.current) {
        subscription.current.remove();
      }
    };
  }, []);

  const checkPedometerAvailability = async () => {
    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(isAvailable);
    } catch (error) {
      console.log('Pedometer not available:', error);
      setIsPedometerAvailable(false);
    }
  };

  const startTest = async () => {
    setPhase('testing');
    if (testConfig.type === 'tap') {
      setTapCount(0);
      tapCountRef.current = 0;
      setTimer(0);
    } else if (testConfig.type === 'timer') {
      startTime.current = Date.now();
      
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

      if (test.id === 'exhale-test') { // Only animate for Exhale Test
        Animated.timing(scale, {
          toValue: testConfig.finalScale,
          duration: testConfig.duration,
          useNativeDriver: false,
        }).start();

        Animated.timing(opacity, {
          toValue: 0.4,
          duration: testConfig.duration,
          useNativeDriver: false,
        }).start();
      }
    } else if (testConfig.type === 'steps' && isPedometerAvailable) {
      setCurrentStepCount(0);
      const start = new Date();
      try {
        subscription.current = Pedometer.watchStepCount(result => {
          setCurrentStepCount(result.steps);
        });
      } catch (error) {
        console.log('Error starting pedometer:', error);
      }
    }
  };

  const handleTap = () => {
    if (phase === 'testing' && testConfig.type === 'tap') {
      if (tapCountRef.current === 0 && !timerRef.current) {
        startTime.current = Date.now();
        timerRef.current = setInterval(() => {
          setTimer(prev => {
            if (prev >= 9) {
              stopTest();
              return prev;
            }
            return prev + 1;
          });
        }, 1000);
      }

      console.log('Tap registered');
      tapCountRef.current += 1;
      setTapCount(tapCountRef.current);
      console.log('Current tap count:', tapCountRef.current);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const stopTest = () => {
    if (testConfig.type === 'timer') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime.current) / 1000);
      
      setResult(duration);
      setPhase('complete');
      
      if (test.id === 1 && scale && opacity) {
        scale.stopAnimation();
        opacity.stopAnimation();
        
        scale.setValue(testConfig.initialScale);
        opacity.setValue(0.9);
      }
    } else if (testConfig.type === 'steps') {
      if (subscription.current) {
        subscription.current.remove();
      }
      if (isPedometerAvailable) {
        setResult(currentStepCount);
        setPhase('complete');
      } else {
        setPhase('input');
      }
    } else if (testConfig.type === 'tap') {
      console.log('Stopping tap test');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const finalCount = tapCountRef.current;
      console.log('Final tap count:', finalCount);
      setResult(finalCount);
      setPhase('complete');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleStepsSubmit = () => {
    const stepCount = parseInt(steps, 10);
    if (stepCount > 0) {
      setResult(stepCount);
      setPhase('complete');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveTestResult = async (testData) => {
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    try {
      console.log('Saving test result:', testData);
      // Save to the user's exerciseResults collection
      const resultRef = collection(db, 'users', auth.currentUser.uid, 'exerciseResults');
      await addDoc(resultRef, {
        exerciseId: test.id,
        exerciseType: 'test',
        testName: testConfig.title,
        result: testData.result,
        resultType: testConfig.type,
        level: testConfig.getScore(testData.result),
        completedAt: serverTimestamp(),
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving test result:', error);
      // Still allow going back even if save fails
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (phase === 'testing' && testConfig.type === 'timer') {
      const animateDots = () => {
        const currentSecond = timer % 15;
        const dotIndex = Math.floor((currentSecond / 15) * 12);
        
        // Reset all dots when starting a new cycle
        if (currentSecond === 0) {
          dotScale.forEach(scale => scale.setValue(0));
        }

        // Animate the current dot
        Animated.timing(dotScale[dotIndex], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      };

      // Start dot animation
      const interval = setInterval(animateDots, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, timer]);

  const renderContent = () => {
    switch (phase) {
      case 'ready':
        return (
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {testConfig.title}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {testConfig.description}
              {testConfig.type === 'steps' && !isPedometerAvailable && 
                '\n\nNote: Automatic step counting is not available on your device. You will need to count steps manually.'}
            </Text>
            <View style={styles.instructionsContainer}>
              <Text style={[styles.instructionTitle, { color: theme.colors.text }]}>
                Instructions:
              </Text>
              {testConfig.instructions.map((instruction, index) => (
                <Text 
                  key={index}
                  style={[styles.instruction, { color: theme.colors.textSecondary }]}
                >
                  {`${index + 1}. ${instruction}`}
                </Text>
              ))}
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
        if (test.id === 'tap-test') {
          return (
            <View style={styles.contentContainer}>
              <View style={styles.timerContainer}>
                <Text style={[styles.timer, { color: theme.colors.text }]}>
                  {tapCount === 0 ? 'Tap to start!' : `${10 - timer}s`}
                </Text>
                <Text style={[styles.tapInstructions, { color: theme.colors.textSecondary }]}>
                  {tapCount === 0 ? 'Timer starts on first tap' : 'Tap as fast as you can!'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleTap}
                style={[styles.tapCircle, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={[styles.tapCount, { color: theme.colors.background }]}>
                  {tapCount}
                </Text>
              </TouchableOpacity>
            </View>
          );
        } else if (test.id === 'bolt-test') {
          return (
            <View style={styles.contentContainer}>
              <View style={styles.timerContainer}>
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
        } else if (testConfig.type === 'timer') {
          return (
            <View style={styles.contentContainer}>
              <View style={styles.animationContainer}>
                <View style={styles.dotsContainer}>
                  {dots.map((_, index) => {
                    const angle = (index / 12) * 2 * Math.PI;
                    const radius = CIRCLE_SIZE / 2;
                    const x = Math.cos(angle - Math.PI / 2) * radius;
                    const y = Math.sin(angle - Math.PI / 2) * radius;
                    
                    return (
                      <Animated.View
                        key={index}
                        style={[
                          styles.dot,
                          {
                            transform: [
                              { translateX: x },
                              { translateY: y },
                              { scale: dotScale[index] }
                            ],
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
                <View style={styles.timerContainer}>
                  <Text style={[styles.timer, { color: theme.colors.text }]}>
                    {formatTime(timer)}
                  </Text>
                  <Text style={[styles.timerLabel, { color: theme.colors.textSecondary }]}>
                    {test.id === 'max-breath-hold' ? 'Hold Your Breath' : 'Keep Going'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.error }]}
                onPress={stopTest}
              >
                <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                  Stop
                </Text>
              </TouchableOpacity>
            </View>
          );
        } else {
          return (
            <View style={styles.contentContainer}>
              <View style={styles.walkingContainer}>
                <Ionicons name="walk" size={64} color={theme.colors.primary} />
                {isPedometerAvailable ? (
                  <View style={styles.stepCountContainer}>
                    <Text style={[styles.stepCount, { color: theme.colors.text }]}>
                      {currentStepCount}
                    </Text>
                    <Text style={[styles.stepLabel, { color: theme.colors.textSecondary }]}>
                      steps
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.walkingText, { color: theme.colors.text }]}>
                    Count your steps as you walk
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.error }]}
                onPress={stopTest}
              >
                <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                  I Need to Breathe
                </Text>
              </TouchableOpacity>
            </View>
          );
        }

      case 'input':
        return (
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Enter Step Count
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }]}
                value={steps}
                onChangeText={setSteps}
                keyboardType="number-pad"
                placeholder="Number of steps"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleStepsSubmit}
            >
              <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                Submit
              </Text>
            </TouchableOpacity>
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
                  {testConfig.type === 'timer' ? 'Duration' : testConfig.type === 'tap' ? 'Taps' : 'Steps'}
                </Text>
                <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                  {testConfig.type === 'timer' ? formatTime(result) : result}
                </Text>
              </View>
              <View style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>
                  Level
                </Text>
                <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                  {testConfig.getScore(result)}
                </Text>
              </View>
            </View>
            {isSaving ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.savingText, { color: theme.colors.textSecondary }]}>
                  Saving result...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={() => saveTestResult({ result })}
              >
                <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                  Save Result
                </Text>
              </TouchableOpacity>
            )}
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
  walkingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkingText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginTop: Layout.spacing.large,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: Layout.spacing.xlarge,
    marginVertical: Layout.spacing.xlarge,
  },
  input: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.medium,
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    borderWidth: 1,
    textAlign: 'center',
  },
  stepCountContainer: {
    alignItems: 'center',
    marginTop: Layout.spacing.large,
  },
  stepCount: {
    fontSize: Layout.text.xxxlarge,
    fontFamily: Typography.fonts.bold,
  },
  stepLabel: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginTop: Layout.spacing.small,
  },
  savingContainer: {
    alignItems: 'center',
    marginTop: Layout.spacing.large,
  },
  savingText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginTop: Layout.spacing.medium,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.xlarge,
  },
  errorText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
    marginBottom: Layout.spacing.large,
  },
  tapCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Layout.spacing.xlarge,
  },
  tapCount: {
    fontSize: Layout.text.xxxlarge,
    fontFamily: Typography.fonts.bold,
  },
  tapInstructions: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginTop: Layout.spacing.small,
  },
  timerCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timerLabel: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginTop: Layout.spacing.small,
  },
  dotsContainer: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 