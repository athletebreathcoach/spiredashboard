import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function SessionDetail({ route, navigation }) {
  const theme = useTheme();
  const { session } = route.params;
  const [expandedItems, setExpandedItems] = useState({});
  const [items] = useState(session.items || []);

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSave = async () => {
    try {
      const sessionData = {
        title: 'New Session',
        items,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'sessions'), sessionData);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const renderMetricsTable = (item) => {
    if (!item.metrics?.sets) return null;
    
    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricsHeader}>
          <Text style={[styles.metricsHeaderText, { color: theme.colors.textSecondary }]}>SET</Text>
          <Text style={[styles.metricsHeaderText, { color: theme.colors.textSecondary }]}>LB</Text>
          <Text style={[styles.metricsHeaderText, { color: theme.colors.textSecondary }]}>REPS</Text>
          <Text style={[styles.metricsHeaderText, { color: theme.colors.textSecondary }]}>REST</Text>
        </View>
        {item.metrics.sets.map((set, index) => (
          <View key={index} style={styles.metricsRow}>
            <Text style={[styles.metricsText, { color: theme.colors.text }]}>{index + 1}</Text>
            <Text style={[styles.metricsText, { color: theme.colors.text }]}>{set.weight || '-'}</Text>
            <Text style={[styles.metricsText, { color: theme.colors.text }]}>{set.reps || '-'}</Text>
            <Text style={[styles.metricsText, { color: theme.colors.text }]}>{set.rest || '00:00'}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.addSetButton}>
          <Ionicons name="add" size={16} color={theme.colors.primary} />
          <Text style={[styles.addSetText, { color: theme.colors.primary }]}>Add Set</Text>
        </TouchableOpacity>
        <View style={styles.eachSideContainer}>
          <TouchableOpacity>
            <Ionicons 
              name={item.metrics.eachSide ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
          <Text style={[styles.eachSideText, { color: theme.colors.textSecondary }]}>Each side</Text>
        </View>
        <TouchableOpacity style={styles.addNoteButton}>
          <Text style={[styles.addNoteText, { color: theme.colors.textSecondary }]}>Add note...</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>New Session</Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {items.map((item, index) => (
          <View key={index} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity 
              style={styles.itemHeader}
              onPress={() => toggleExpand(item.id)}
            >
              <View style={styles.itemTitleContainer}>
                <Ionicons 
                  name={item.type === 'section' ? 'layers-outline' : 'document-text-outline'} 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.title}</Text>
              </View>
              <View style={styles.itemControls}>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <Ionicons 
                  name={expandedItems[item.id] ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={theme.colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
            {expandedItems[item.id] && renderMetricsTable(item)}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('ActivitySelector', { 
          type: 'session',
          multiSelect: true
        })}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.medium,
    paddingTop: Layout.spacing.large * 2,
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
  },
  saveButton: {
    paddingHorizontal: Layout.spacing.large,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.medium,
  },
  saveButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  card: {
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.medium,
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  itemTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.small,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  metricsContainer: {
    padding: Layout.spacing.medium,
    paddingTop: 0,
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.small,
    marginBottom: Layout.spacing.small,
  },
  metricsHeaderText: {
    flex: 1,
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.small,
  },
  metricsText: {
    flex: 1,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    textAlign: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.medium,
    gap: Layout.spacing.small,
  },
  addSetText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  eachSideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
    marginTop: Layout.spacing.small,
  },
  eachSideText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  addNoteButton: {
    marginTop: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
  },
  addNoteText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  fab: {
    position: 'absolute',
    right: Layout.spacing.large,
    bottom: Layout.spacing.large,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 