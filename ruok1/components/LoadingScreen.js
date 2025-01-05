import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Default colors that match your app's theme
const defaultColors = {
  background: '#000000',
  primary: '#00B5E0'
};

// Create an array of wind lines with different properties
const WIND_LINES = Array(6).fill(0).map((_, index) => ({
  id: index,
  width: Math.random() * 100 + 50, // Random width between 50 and 150
  delay: index * 400, // Stagger the animations
  duration: Math.random() * 1000 + 2000, // Random duration between 2000 and 3000ms
  top: Math.random() * 70 + 15 // Random vertical position between 15% and 85%
}));

export default function LoadingScreen() {
  // Create animated values for each wind line
  const windLines = WIND_LINES.map(() => ({
    position: useSharedValue(-200),
    opacity: useSharedValue(0)
  }));

  useEffect(() => {
    // Animate each wind line
    windLines.forEach((line, index) => {
      const startAnimation = () => {
        // Reset position and opacity
        line.position.value = -200;
        line.opacity.value = 0;

        // Animate position from left to right
        line.position.value = withDelay(
          WIND_LINES[index].delay,
          withTiming(SCREEN_WIDTH + 200, {
            duration: WIND_LINES[index].duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          })
        );

        // Fade in and out
        line.opacity.value = withDelay(
          WIND_LINES[index].delay,
          withSequence(
            withTiming(0.7, { duration: 500 }),
            withTiming(0.7, { duration: WIND_LINES[index].duration - 1000 }),
            withTiming(0, { duration: 500 })
          )
        );

        // Repeat the animation after it completes
        setTimeout(() => {
          startAnimation();
        }, WIND_LINES[index].duration + WIND_LINES[index].delay);
      };

      startAnimation();
    });
  }, []);

  return (
    <View style={[
      styles.container,
      { backgroundColor: defaultColors.background }
    ]}>
      {WIND_LINES.map((line, index) => {
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [{ translateX: windLines[index].position.value }],
          opacity: windLines[index].opacity.value,
        }));

        return (
          <Animated.View
            key={line.id}
            style={[
              styles.windLine,
              {
                width: line.width,
                top: `${line.top}%`,
              },
              animatedStyle
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  windLine: {
    height: 2,
    backgroundColor: defaultColors.primary,
    position: 'absolute',
    borderRadius: 1,
  }
}); 