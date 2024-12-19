import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BreathSetup from './BreathSetup';
import BreathAnimation from './BreathAnimation';

export default function BreathGuide({ navigation }) {
  const [showSetup, setShowSetup] = useState(true);
  const [pattern, setPattern] = useState(null);

  const handleStart = (settings) => {
    setPattern(settings);
    setShowSetup(false);
  };

  return (
    <>
      {showSetup ? (
        <BreathSetup onStart={handleStart} />
      ) : (
        <BreathAnimation 
          pattern={pattern} 
          navigation={navigation}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
}); 