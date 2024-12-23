import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { getExercises } from '../firebase/exercises';

export default function Exercises({ navigation }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const exerciseData = await getExercises();
      setExercises(exerciseData);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00B5E0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Exercises
      </Text>
      <Text style={styles.subtitle}>
        Choose an exercise to begin your workout
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[styles.card, { backgroundColor: '#2C2C2E' }]}
            onPress={() => navigation.navigate('ExerciseDetail', { exercise })}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="barbell-outline" size={24} color="#00B5E0" />
              <Text style={styles.cardTitle}>{exercise.title}</Text>
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.cardType}>{exercise.type.name}</Text>
              <Text style={styles.cardCategory}>#{exercise.primaryMuscleGroup.name}</Text>
            </View>
            <View style={styles.equipmentContainer}>
              {Object.values(exercise.equipment).map((equip) => (
                <View key={equip.id} style={styles.equipmentTag}>
                  <Text style={styles.equipmentText}>{equip.name}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
    backgroundColor: '#1C1C1E',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.large,
  },
  card: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    color: '#FFFFFF',
    marginLeft: Layout.spacing.medium,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardType: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#8E8E93',
    marginRight: Layout.spacing.medium,
  },
  cardCategory: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#00B5E0',
  },
  equipmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentTag: {
    backgroundColor: '#3A3A3C',
    paddingHorizontal: Layout.spacing.small,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.small,
  },
  equipmentText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
  },
}); 