import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SelectedClientContext = createContext();

export function SelectedClientProvider({ children }) {
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    // Load selected client from storage on mount
    const loadSelectedClient = async () => {
      try {
        const savedClient = await AsyncStorage.getItem('selectedClient');
        if (savedClient) {
          setSelectedClient(JSON.parse(savedClient));
        }
      } catch (error) {
        console.error('Error loading selected client:', error);
      }
    };
    loadSelectedClient();
  }, []);

  const updateSelectedClient = async (client) => {
    setSelectedClient(client);
    try {
      await AsyncStorage.setItem('selectedClient', JSON.stringify(client));
    } catch (error) {
      console.error('Error saving selected client:', error);
    }
  };

  return (
    <SelectedClientContext.Provider value={{ selectedClient, updateSelectedClient }}>
      {children}
    </SelectedClientContext.Provider>
  );
}

export function useSelectedClient() {
  const context = useContext(SelectedClientContext);
  if (!context) {
    throw new Error('useSelectedClient must be used within a SelectedClientProvider');
  }
  return context;
} 