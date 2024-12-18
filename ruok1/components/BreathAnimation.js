import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;

// Define our color scheme
const COLORS = {
  inhale: '#00B5E0',    // Your brand blue
  hold: '#015B98',      // Your medium blue
  exhale: '#0d2f4d',    // Your dark blue
};

export default function BreathAnimation({ pattern }) {
  const scale = useRef(new Animated.Value(0.2)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [currentPhase, setCurrentPhase] = useState('Inhale');

  const animatedColor = colorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [COLORS.inhale, COLORS.hold, COLORS.exhale],
  });

  const glowOpacity = opacity.interpolate({
    inputRange: [0.3, 0.8],
    outputRange: [0.3, 0.8],
  });

  useEffect(() => {
    const animate = () => {
      if (currentRound >= pattern.rounds) {
        return;
      }

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
      ]).start(() => {
        // Hold after inhale
        setCurrentPhase('Hold');
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
        
        setTimeout(() => {
          // Exhale
          setCurrentPhase('Exhale');
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 0.2,
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
          ]).start(() => {
            // Hold after exhale
            setCurrentPhase('Hold');
            setTimeout(() => {
              currentRound++;
              if (currentRound < pattern.rounds) {
                animate();
              }
            }, pattern.exhaleHoldTime * 1000);
          });
        }, pattern.inhaleHoldTime * 1000);
      });
    };

    let currentRound = 0;
    animate();
  }, [pattern]);

  return (
    <View style={styles.container}>
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
              shadowRadius: 20,
            },
          ]}
        />
        <Animated.View style={styles.textContainer}>
          <Animated.Text
            style={[
              styles.phaseText,
              {
                color: animatedColor,
                textShadowColor: animatedColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              },
            ]}
          >
            {currentPhase}
          </Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
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
    elevation: 5, // for Android
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 24,
    fontWeight: '600',
  },
}); 