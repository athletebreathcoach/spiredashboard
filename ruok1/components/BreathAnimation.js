import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;

export default function BreathAnimation({ pattern, navigation }) {
  const theme = useTheme();

  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [currentPhase, setCurrentPhase] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [breathCount, setBreathCount] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const completionHandled = useRef(false);
  const roundCounter = useRef(0);

  const animatedColor = colorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      theme.colors.breathing.inhale,
      theme.colors.breathing.hold,
      theme.colors.breathing.exhale
    ],
  });

  const glowOpacity = opacity.interpolate({
    inputRange: [0.3, 0.8],
    outputRange: [0.3, 0.8],
  });

  const triggerHaptic = async (type) => {
    switch (type) {
      case 'tick':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'transition':
        // Double tap effect
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 150);
        break;
      case 'countdown':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'countdownTick':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  };

  // Add interval ref to clean up properly
  const tickInterval = useRef(null);

  const startTickingHaptics = () => {
    tickInterval.current = setInterval(() => {
      triggerHaptic('tick');
    }, 1000);
  };

  const stopTickingHaptics = () => {
    if (tickInterval.current) {
      clearInterval(tickInterval.current);
    }
  };

  useEffect(() => {
    return () => stopTickingHaptics(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsCountingDown(false);
          triggerHaptic('countdown');
          startBreathingAnimation();
          return 0;
        }
        triggerHaptic('countdownTick');
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  useEffect(() => {
    if (isComplete && !completionHandled.current) {
      completionHandled.current = true;
      navigation.replace('BreathingComplete', {
        totalBreaths: breathCount,
        streak: 1,
        totalSessions: 1,
        sessionData: {
          presetName: pattern.presetName || 'Custom Breath Protocol',
          inhaleTime: pattern.inhaleTime,
          inhaleHoldTime: pattern.inhaleHoldTime || 0,
          exhaleTime: pattern.exhaleTime,
          exhaleHoldTime: pattern.exhaleHoldTime || 0,
          rounds: pattern.rounds,
          totalTime: pattern.totalTime || 
            ((pattern.inhaleTime + (pattern.inhaleHoldTime || 0) + 
              pattern.exhaleTime + (pattern.exhaleHoldTime || 0)) * pattern.rounds)
        }
      });
    }
  }, [isComplete, pattern, breathCount, navigation]);

  const startBreathingAnimation = () => {
    const animate = () => {
      if (roundCounter.current >= pattern.rounds) {
        stopTickingHaptics();
        return;
      }

      startTickingHaptics();

      // Inhale
      setCurrentPhase('Inhale');
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: pattern.inhaleTime * 1000,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: pattern.inhaleTime * 1000,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: pattern.inhaleTime * 1000,
          useNativeDriver: false,
        }),
      ]).start(async () => {
        await triggerHaptic('transition');
        
        // Only do inhale hold if time > 0
        if (pattern.inhaleHoldTime > 0) {
          setCurrentPhase('Hold');
          Animated.timing(colorAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }).start();
          
          setTimeout(async () => {
            await triggerHaptic('transition');
            startExhale();
          }, pattern.inhaleHoldTime * 1000);
        } else {
          startExhale();
        }
      });

      const startExhale = () => {
        setCurrentPhase('Exhale');
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.4,
            duration: pattern.exhaleTime * 1000,
            useNativeDriver: false,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: pattern.exhaleTime * 1000,
            useNativeDriver: false,
          }),
          Animated.timing(colorAnim, {
            toValue: 2,
            duration: pattern.exhaleTime * 1000,
            useNativeDriver: false,
          }),
        ]).start(async () => {
          await triggerHaptic('transition');
          
          // Only do exhale hold if time > 0
          if (pattern.exhaleHoldTime > 0) {
            setCurrentPhase('Hold');
            setTimeout(async () => {
              await triggerHaptic('transition');
              completeRound();
            }, pattern.exhaleHoldTime * 1000);
          } else {
            completeRound();
          }
        });
      };

      const completeRound = () => {
        roundCounter.current++;
        setCurrentRound(roundCounter.current + 1);
        setBreathCount(prev => {
          const newCount = prev + 1;
          if (roundCounter.current >= pattern.rounds) {
            stopTickingHaptics();
            setIsComplete(true);
          }
          return newCount;
        });
        
        if (roundCounter.current < pattern.rounds) {
          animate();
        }
      };
    };

    animate();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isCountingDown ? (
        <View style={styles.countdownContainer}>
          <Text style={[styles.roundText, { color: theme.colors.text }]}>
            Round 1 of {pattern.rounds}
          </Text>
          <View style={[styles.countdownCircle, { 
            borderColor: theme.colors.primary,
            shadowColor: theme.colors.primary 
          }]}>
            <Text style={[styles.countdownText, { color: theme.colors.primary }]}>
              {countdown}
            </Text>
            <Text style={[styles.startingText, { color: theme.colors.text }]}>
              Starting in...
            </Text>
          </View>
        </View>
      ) : (
        <>
          <Text style={[styles.roundText, { color: theme.colors.text }]}>
            Round {currentRound} of {pattern.rounds}
          </Text>
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.circleBackground,
                {
                  backgroundColor: animatedColor,
                  opacity: 0.1,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.circleBreathing,
                {
                  transform: [{ scale }],
                  opacity: glowOpacity,
                  backgroundColor: animatedColor,
                  shadowColor: animatedColor,
                  shadowOffset: {
                    width: 0,
                    height: 0,
                  },
                  shadowOpacity: glowOpacity,
                  shadowRadius: 30,
                },
              ]}
            />
            <Animated.View style={styles.textContainer}>
              <Animated.Text
                style={[
                  styles.phaseText,
                  {
                    color: theme.colors.text,
                  },
                ]}
              >
                {currentPhase}
              </Animated.Text>
            </Animated.View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.xlarge,
    letterSpacing: 0.5,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownCircle: {
    width: CIRCLE_SIZE * 0.8,
    height: CIRCLE_SIZE * 0.8,
    borderRadius: (CIRCLE_SIZE * 0.8) / 2,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  countdownText: {
    fontSize: Layout.text.xxlarge * 2,
    fontFamily: Typography.fonts.heavy,
    letterSpacing: 0.5,
  },
  startingText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.regular,
    marginTop: Layout.spacing.medium,
    letterSpacing: 0.25,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    position: 'absolute',
  },
  circleBreathing: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    position: 'absolute',
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    width: CIRCLE_SIZE * 0.4,
    height: CIRCLE_SIZE * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: {
    fontSize: Math.min(Layout.text.xxlarge, CIRCLE_SIZE * 0.15),
    fontFamily: Typography.fonts.medium,
    letterSpacing: 1,
    textAlign: 'center',
  },
}); 