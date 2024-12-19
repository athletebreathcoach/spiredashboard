import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BreathSetup from './BreathSetup';
import BreathAnimation from './BreathAnimation';

export default function BreathGuide({ navigation, route }) {
  const [showSetup, setShowSetup] = useState(true);
  const presetSettings = route.params?.settings;  // Get preset settings if they exist

  const handleStart = (settings) => {
    setShowSetup(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {showSetup ? (
        <BreathSetup 
          onStart={handleStart} 
          initialSettings={presetSettings}  // Pass preset settings
        />
      ) : (
        <BreathAnimation 
          pattern={presetSettings || defaultSettings} 
          navigation={navigation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
}); 