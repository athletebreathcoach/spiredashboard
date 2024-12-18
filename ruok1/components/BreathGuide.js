import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BreathSetup from './BreathSetup';
import BreathAnimation from './BreathAnimation';

export default function BreathGuide() {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [breathPattern, setBreathPattern] = useState(null);

  const handleStart = (pattern) => {
    setBreathPattern(pattern);
    setIsSetupComplete(true);
  };

  if (!isSetupComplete) {
    return <BreathSetup onStart={handleStart} />;
  }

  return (
    <View style={styles.container}>
      <BreathAnimation pattern={breathPattern} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
}); 