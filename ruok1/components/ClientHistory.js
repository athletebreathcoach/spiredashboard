import React from 'react';
import BreathHistory from './BreathHistory';

export default function ClientHistory({ route }) {
  const { clientId } = route.params;
  
  // Extend BreathHistory to accept a userId prop
  return <BreathHistory userId={clientId} />;
} 