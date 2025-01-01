import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;
const INNER_CIRCLE_SIZE = CIRCLE_SIZE * 0.8;

export default function ApneaTableExecution({ settings, onClose }) {
  const theme = useTheme();
  const [currentRound, setCurrentRound] = useState(1);
  const [isHoldPhase, setIsHoldPhase] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Animation values
  const phaseProgress = useRef(new Animated.Value(0)).current;
  const totalProgress = useRef(new Animated.Value(0)).current;

  // Convert time strings to seconds
  const getSeconds = (timeString) => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate table data
  const generateTable = () => {
    const table = [];
    const apneaSeconds = getSeconds(settings.apneaTime);
    let restSeconds = getSeconds(settings.restStartTime);
    const decrementSeconds = getSeconds(settings.restDecrement);

    for (let i = 0; i < settings.breathHolds; i++) {
      table.push({
        round: i + 1,
        holdTime: apneaSeconds,
        restTime: Math.max(0, restSeconds)
      });
      restSeconds -= decrementSeconds;
    }

    return table;
  };

  const table = generateTable();
  const totalTime = table.reduce((acc, round) => {
    return acc + round.holdTime + round.restTime;
  }, getSeconds(settings.cooldownTime));

  // Initialize timers
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            // Switch phases or rounds
            if (isHoldPhase) {
              // Switch to rest phase
              const currentRoundData = table[currentRound - 1];
              setIsHoldPhase(false);
              startPhaseAnimation(currentRoundData.restTime);
              return currentRoundData.restTime;
            } else if (currentRound < settings.breathHolds) {
              // Start next round
              setCurrentRound(prev => prev + 1);
              setIsHoldPhase(true);
              const nextRoundData = table[currentRound];
              startPhaseAnimation(nextRoundData.holdTime);
              return nextRoundData.holdTime;
            } else {
              // Start cooldown
              clearInterval(interval);
              return 0;
            }
          }
          return prev - 1;
        });

        setTotalTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPaused, currentRound, isHoldPhase]);

  // Start initial animations
  useEffect(() => {
    const firstRound = table[0];
    setTimeLeft(firstRound.holdTime);
    setTotalTimeLeft(totalTime);
    startPhaseAnimation(firstRound.holdTime);
    startTotalAnimation(totalTime);
  }, []);

  const startPhaseAnimation = (duration) => {
    phaseProgress.setValue(0);
    Animated.timing(phaseProgress, {
      toValue: 1,
      duration: duration * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const startTotalAnimation = (duration) => {
    totalProgress.setValue(0);
    Animated.timing(totalProgress, {
      toValue: 1,
      duration: duration * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const currentPhase = isHoldPhase ? 'HOLD' : 'BREATHE';
  const currentColor = isHoldPhase ? '#FF6B6B' : '#4CD964';

  const spin = totalProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const phaseSpin = phaseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.roundText, { color: theme.colors.textSecondary }]}>
          ROUND: {currentRound} / {settings.breathHolds}
        </Text>
        <Text style={[styles.timeLeftText, { color: theme.colors.textSecondary }]}>
          LEFT: {formatTime(totalTimeLeft)}
        </Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close-circle-outline" size={32} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tablePreview}>
        {table.slice(0, 2).map((round, index) => (
          <View key={index} style={styles.previewRow}>
            <Text style={[styles.previewNumber, { 
              color: currentRound === round.round ? theme.colors.text : theme.colors.textSecondary 
            }]}>
              {round.round}
            </Text>
            <Text style={[styles.previewTime, { 
              color: '#FF6B6B',
              opacity: currentRound === round.round && isHoldPhase ? 1 : 0.5
            }]}>
              {formatTime(round.holdTime)}
            </Text>
            <Text style={[styles.previewTime, { 
              color: '#4CD964',
              opacity: currentRound === round.round && !isHoldPhase ? 1 : 0.5
            }]}>
              {formatTime(round.restTime)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.circleContainer}>
        <Animated.View style={[styles.circle, {
          borderColor: theme.colors.textSecondary,
          transform: [{ rotate: spin }]
        }]}>
          <View style={[styles.progressMark, { backgroundColor: theme.colors.primary }]} />
        </Animated.View>

        <Animated.View style={[styles.innerCircle, {
          borderColor: currentColor,
          transform: [{ rotate: phaseSpin }]
        }]}>
          <View style={[styles.progressMark, { backgroundColor: currentColor }]} />
        </Animated.View>

        <View style={styles.timerContainer}>
          <Text style={[styles.phaseText, { color: currentColor }]}>
            {currentPhase}
          </Text>
          <Text style={[styles.timerText, { color: theme.colors.text }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.pauseButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setIsPaused(!isPaused)}
      >
        <Text style={[styles.pauseButtonText, { color: theme.colors.background }]}>
          {isPaused ? 'Resume' : 'Pause'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Layout.spacing.large,
    paddingTop: 60,
    paddingBottom: Layout.spacing.large,
  },
  roundText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  timeLeftText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  closeButton: {
    padding: Layout.spacing.small,
  },
  tablePreview: {
    marginBottom: Layout.spacing.xlarge,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.small,
  },
  previewNumber: {
    width: 30,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginRight: Layout.spacing.large,
  },
  previewTime: {
    width: 80,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginRight: Layout.spacing.medium,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    position: 'absolute',
  },
  innerCircle: {
    width: INNER_CIRCLE_SIZE,
    height: INNER_CIRCLE_SIZE,
    borderRadius: INNER_CIRCLE_SIZE / 2,
    borderWidth: 2,
    position: 'absolute',
  },
  progressMark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -4,
  },
  timerContainer: {
    alignItems: 'center',
  },
  phaseText: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
  },
  timerText: {
    fontSize: 64,
    fontFamily: Typography.fonts.medium,
  },
  pauseButton: {
    paddingHorizontal: Layout.spacing.xlarge,
    paddingVertical: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    position: 'absolute',
    bottom: 50,
  },
  pauseButtonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
}); 