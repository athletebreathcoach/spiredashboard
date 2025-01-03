import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function SessionDetail({ route, navigation }) {
  const theme = useTheme();
  const { session, isNew } = route.params;
  const [expandedItems, setExpandedItems] = useState({});
  const [title, setTitle] = useState(session.title || 'New Session');
  const [items, setItems] = useState(session.items || []);

  // Auto-expand all items initially if it's a new session
  useEffect(() => {
    if (isNew) {
      const expanded = {};
      items.forEach(item => {
        expanded[item.id] = true;
      });
      setExpandedItems(expanded);
    }
  }, [isNew]);

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleAddActivity = () => {
    navigation.navigate('ActivitySelector', {
      type: 'session',
      multiSelect: true,
      onSelect: (selectedItems) => {
        setItems(current => [
          ...current,
          ...selectedItems.map(item => ({
            ...item,
            id: Math.random().toString(), // Temporary ID for new items
            metrics: item.type === 'exercise' ? {
              sets: [{
                reps: '',
                weight: '',
                rest: '00:00'
              }],
              eachSide: false
            } : undefined
          }))
        ]);
      }
    });
  };

  const handleSave = async () => {
    // TODO: Implement save functionality
    navigation.goBack();
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
        {item.metrics.eachSide && (
          <View style={styles.eachSideContainer}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
            <Text style={[styles.eachSideText, { color: theme.colors.text }]}>Each side</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSectionItems = (section) => {
    if (!section.items || !expandedItems[section.id]) return null;

    return section.items.map((item, index) => (
      <View key={index} style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity 
          style={styles.itemHeader}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.itemTitleContainer}>
            <Ionicons name="barbell-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.title}</Text>
          </View>
          <Ionicons 
            name={expandedItems[item.id] ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={theme.colors.textSecondary} 
          />
        </TouchableOpacity>
        {expandedItems[item.id] && renderMetricsTable(item)}
      </View>
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveButton, { color: theme.colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {items.map((item, index) => (
          <View key={index}>
            {item.type === 'section' ? (
              <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => toggleExpand(item.id)}
                >
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="layers-outline" size={24} color={theme.colors.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{item.title}</Text>
                  </View>
                  <Ionicons 
                    name={expandedItems[item.id] ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
                {renderSectionItems(item)}
              </View>
            ) : (
              <View style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity 
                  style={styles.itemHeader}
                  onPress={() => toggleExpand(item.id)}
                >
                  <View style={styles.itemTitleContainer}>
                    <Ionicons 
                      name={
                        item.type === 'exercise' ? 'barbell-outline' :
                        item.type === 'breathingTests' ? 'fitness-outline' :
                        item.type === 'breathProtocols' ? 'pulse-outline' :
                        item.type === 'habitstasks' ? 'checkbox-outline' :
                        item.type === 'guidedSessions' ? 'play-circle-outline' :
                        'document-text-outline'
                      } 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                    <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.title}</Text>
                  </View>
                  <Ionicons 
                    name={expandedItems[item.id] ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
                {expandedItems[item.id] && renderMetricsTable(item)}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddActivity}
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
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  sectionCard: {
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.medium,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginLeft: Layout.spacing.small,
  },
  itemCard: {
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.small,
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