import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { getTodaysTraining } from '../firebase/programs';
import { auth } from '../config/firebase';

export default function Training({ navigation }) {
  const [todaysExercises, setTodaysExercises] = useState([]);
  
  useEffect(() => {
    loadTodaysTraining();
  }, []);

  const loadTodaysTraining = async () => {
    const exercises = await getTodaysTraining(auth.currentUser.uid);
    setTodaysExercises(exercises);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Training</Text>
      <ScrollView>
        {todaysExercises.map((exercise, index) => (
          <TouchableOpacity 
            key={index}
            onPress={() => navigation.navigate('LogExercise', { exercise })}
          >
            {/* Exercise card UI */}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
}; 