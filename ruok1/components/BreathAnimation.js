import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;

const getAnimationStyle = (animationType, {
  scale,
  opacity,
  glowOpacity,
  animatedColor,
  spin,
  theme
}) => {
  const baseStyle = {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    position: 'absolute',
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: glowOpacity,
    backgroundColor: animatedColor,
    shadowColor: animatedColor,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: glowOpacity,
    shadowRadius: 30,
  };

  switch (animationType) {
    case 'spiral':
      return {
        ...baseStyle,
        transform: [
          { scale },
          { rotate: spin },
        ],
        borderRadius: CIRCLE_SIZE * 0.3,
        borderWidth: CIRCLE_SIZE * 0.05,
        borderColor: theme.colors.primary,
      };
    case 'wave':
      return {
        ...baseStyle,
        transform: [{ scale }],
        borderRadius: CIRCLE_SIZE * 0.2,
        height: CIRCLE_SIZE * 0.5,
      };
    default: // 'pulse'
      return {
        ...baseStyle,
        transform: [{ scale }],
        borderRadius: CIRCLE_SIZE / 2,
      };
  }
};

const getBackgroundStyle = (animationType, {
  animatedColor,
  spin,
}) => {
  const baseStyle = {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    position: 'absolute',
    opacity: 0.1,
    backgroundColor: animatedColor,
  };

  switch (animationType) {
    case 'spiral':
      return {
        ...baseStyle,
        transform: [{ rotate: spin }],
        borderRadius: CIRCLE_SIZE * 0.3,
        borderWidth: CIRCLE_SIZE * 0.05,
      };
    case 'wave':
      return {
        ...baseStyle,
        borderRadius: CIRCLE_SIZE * 0.2,
        height: CIRCLE_SIZE * 0.5,
      };
    default: // 'pulse'
      return {
        ...baseStyle,
        borderRadius: CIRCLE_SIZE / 2,
      };
  }
};

export default function BreathAnimation({ pattern, navigation }) {
  const theme = useTheme();
  const [isMuted, setIsMuted] = useState(false);
  const soundRef = useRef(null);

  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [currentPhase, setCurrentPhase] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [breathCount, setBreathCount] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const completionHandled = useRef(false);
  const roundCounter = useRef(0);

  const animationType = pattern.animationType || 'pulse'; // default to pulse if not specified

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

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
      stopTickingHaptics();
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

  useEffect(() => {
    return () => {
      stopTickingHaptics();
      completionHandled.current = true;
    };
  }, []);

  useEffect(() => {
    loadAndPlayAudio();
    return () => {
      stopAudio();
    };
  }, []);

  const loadAndPlayAudio = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/meditationbackground.mp3'),
        { 
          isLooping: true,
          volume: 0.5,
          shouldPlay: !isMuted 
        }
      );
      soundRef.current = sound;
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  };

  const toggleMute = async () => {
    if (soundRef.current) {
      try {
        if (isMuted) {
          await soundRef.current.playAsync();
        } else {
          await soundRef.current.pauseAsync();
        }
        setIsMuted(!isMuted);
      } catch (error) {
        console.error('Error toggling audio:', error);
      }
    }
  };

  const startBreathingAnimation = () => {
    const animate = () => {
      if (roundCounter.current >= pattern.rounds) {
        stopTickingHaptics();
        return;
      }

      startTickingHaptics();

      // Inhale animation based on type
      setCurrentPhase('Inhale');
      const inhaleAnimations = [
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: pattern.inhaleTime * 1000,
          useNativeDriver: false,
        })
      ];

      switch (animationType) {
        case 'spiral':
          inhaleAnimations.push(
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: pattern.inhaleTime * 1000,
              useNativeDriver: false,
            })
          );
          break;
        case 'wave':
          inhaleAnimations.push(
            Animated.sequence([
              Animated.timing(scale, {
                toValue: 0.8,
                duration: pattern.inhaleTime * 500,
                useNativeDriver: false,
              }),
              Animated.timing(scale, {
                toValue: 1,
                duration: pattern.inhaleTime * 500,
                useNativeDriver: false,
              })
            ])
          );
          break;
        default: // 'pulse'
          inhaleAnimations.push(
            Animated.timing(scale, {
              toValue: 1,
              duration: pattern.inhaleTime * 1000,
              useNativeDriver: false,
            })
          );
      }

      inhaleAnimations.push(
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: pattern.inhaleTime * 1000,
          useNativeDriver: false,
        })
      );

      Animated.parallel(inhaleAnimations).start(async () => {
        await triggerHaptic('transition');
        
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
        const exhaleAnimations = [
          Animated.timing(colorAnim, {
            toValue: 2,
            duration: pattern.exhaleTime * 1000,
            useNativeDriver: false,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: pattern.exhaleTime * 1000,
            useNativeDriver: false,
          })
        ];

        switch (animationType) {
          case 'spiral':
            exhaleAnimations.push(
              Animated.timing(rotateAnim, {
                toValue: 0,
                duration: pattern.exhaleTime * 1000,
                useNativeDriver: false,
              })
            );
            break;
          case 'wave':
            exhaleAnimations.push(
              Animated.sequence([
                Animated.timing(scale, {
                  toValue: 0.6,
                  duration: pattern.exhaleTime * 500,
                  useNativeDriver: false,
                }),
                Animated.timing(scale, {
                  toValue: 0.4,
                  duration: pattern.exhaleTime * 500,
                  useNativeDriver: false,
                })
              ])
            );
            break;
          default: // 'pulse'
            exhaleAnimations.push(
              Animated.timing(scale, {
                toValue: 0.4,
                duration: pattern.exhaleTime * 1000,
                useNativeDriver: false,
              })
            );
        }

        Animated.parallel(exhaleAnimations).start(async () => {
          await triggerHaptic('transition');
          
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

  // Add cleanup function
  const cleanup = () => {
    stopTickingHaptics();
    stopAudio();
    completionHandled.current = true;
    // Stop all running animations
    scale.stopAnimation();
    opacity.stopAnimation();
    colorAnim.stopAnimation();
    // Clear any running timeouts
    if (tickInterval.current) {
      clearInterval(tickInterval.current);
    }
  };

  // Handle back button press
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Prevent default behavior
      e.preventDefault();
      
      // Run cleanup
      cleanup();
      
      // Navigate back
      navigation.dispatch(e.data.action);
    });

    // Handle hardware back button (Android)
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      cleanup();
      navigation.goBack();
      return true;
    });

    return () => {
      unsubscribe();
      backHandler.remove();
      cleanup();
    };
  }, [navigation]);

  // Update the existing cleanup useEffect
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity 
        style={styles.muteButton}
        onPress={toggleMute}
      >
        <Ionicons 
          name={isMuted ? "volume-mute" : "volume-medium"} 
          size={24} 
          color={theme.colors.primary}
        />
      </TouchableOpacity>

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
                getBackgroundStyle(animationType, {
                  animatedColor,
                  spin,
                })
              ]}
            />
            <Animated.View
              style={[
                styles.circleBreathing,
                getAnimationStyle(animationType, {
                  scale,
                  opacity,
                  glowOpacity,
                  animatedColor,
                  spin,
                  theme
                })
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
    position: 'absolute',
  },
  circleBreathing: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
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
  muteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 1,
  },
}); 