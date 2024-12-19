import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function CoachDashboard() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    // Query users where coachId matches current coach's ID
    const clientsQuery = query(
      collection(db, 'users'),
      where('coachId', '==', auth.currentUser.uid)
    );
    
    const clientsSnapshot = await getDocs(clientsQuery);
    const clientsList = [];
    
    clientsSnapshot.forEach((doc) => {
      clientsList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    setClients(clientsList);
  };

  // Render client list with their session histories
  return (
    <View>
      <FlatList
        data={clients}
        renderItem={({ item }) => (
          <ClientCard 
            client={item}
            onPress={() => navigation.navigate('ClientHistory', { clientId: item.id })}
          />
        )}
      />
    </View>
  );
} 