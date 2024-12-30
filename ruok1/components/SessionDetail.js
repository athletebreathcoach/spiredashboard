import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { createSession, updateSession } from '../firebase/sessions';
import { auth } from '../config/firebase';

const ACTIVITY_TYPES = [
  { id: 'exercises', icon: 'barbell' },
  { id: 'habitstasks', icon: 'checkbox' },
  { id: 'breathingTests', icon: 'fitness' },
  { id: 'breathProtocols', icon: 'pulse' },
  { id: 'guidedSessions', icon: 'play-circle' },
  { id: 'section', icon: 'layers' },
];

export default function SessionDetail({ navigation, route }) {
  const theme = useTheme();
  const [session, setSession] = useState(route.params.session || { title: '', description: '' });
  const [items, setItems] = useState(
    route.params.session?.items?.map(item => ({
      ...item,
      supersetWith: item.supersetWith !== undefined ? item.supersetWith : null,
      metrics: {
        sets: Array.isArray(item.metrics?.sets) ? item.metrics.sets.map(set => ({
          reps: set.reps || '',
          weight: set.weight || '',
          rest: set.rest || '00:00'
        })) : [{
          reps: '',
          weight: '',
          rest: '00:00'
        }],
        eachSide: item.metrics?.eachSide || false,
        notes: item.metrics?.notes || ''
      }
    })) || route.params.selectedItems?.map(item => ({
      ...item,
      supersetWith: null,
      metrics: {
        sets: [{
          reps: '',
          weight: '',
          rest: '00:00'
        }],
        eachSide: false,
        notes: ''
      }
    })) || []
  );
  const [expandedSections, setExpandedSections] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    if (route.params?.selectedItems) {
      setItems(current => [
        ...current,
        ...route.params.selectedItems.map(item => ({
          ...item,
          supersetWith: null,
          metrics: {
            sets: [{
              reps: '',
              weight: '',
              rest: '00:00'
            }],
            eachSide: false,
            notes: ''
          }
        }))
      ]);
      navigation.setParams({ selectedItems: undefined });
    }
  }, [route.params?.selectedItems]);

  const handleSave = async () => {
    try {
      if (!session.title.trim()) {
        Alert.alert('Error', 'Please enter a title for the session');
        return;
      }

      const sessionData = {
        title: session.title,
        description: session.description,
        items,
        userId: auth.currentUser.uid,
        createdBy: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      };

      if (session.id) {
        await updateSession(session.id, {
          title: session.title,
          description: session.description,
          items,
          updatedBy: auth.currentUser.uid,
          updatedAt: new Date().toISOString()
        });
      } else {
        await createSession(sessionData);
      }

      navigation.navigate('Search', {
        screen: 'Programs',
        params: {
          screen: 'Sessions'
        }
      });
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  };

  const handleAddItem = () => {
    navigation.navigate('ActivitySelector');
  };

  const handleDeleteItem = (index) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setItems(current => {
              const updated = [...current];
              const item = updated[index];
              
              // If this item is part of a superset, unlink the other item
              if (item.supersetWith !== null) {
                const linkedItem = updated[item.supersetWith];
                if (linkedItem) {
                  linkedItem.supersetWith = null;
                }
              }
              
              // If another item is linked to this one, unlink it
              const linkedItemIndex = updated.findIndex(i => i.supersetWith === index);
              if (linkedItemIndex !== -1) {
                updated[linkedItemIndex].supersetWith = null;
              }
              
              updated.splice(index, 1);
              
              // Update superset indices after deletion
              return updated.map((item, i) => ({
                ...item,
                supersetWith: item.supersetWith === null ? null :
                  item.supersetWith === index ? null :
                  item.supersetWith > index ? item.supersetWith - 1 :
                  item.supersetWith
              }));
            });
            setMenuOpen(null);
          }
        }
      ]
    );
  };

  const handleToggleSuperset = (index) => {
    setItems(current => {
      const updated = [...current];
      const currentItem = updated[index];
      const nextItem = updated[index + 1];

      if (!nextItem) return updated;

      if (currentItem.supersetWith === null) {
        // Link the items
        currentItem.supersetWith = index + 1;
        nextItem.supersetWith = index;
        
        // Sync the number of sets
        const maxSets = Math.max(
          currentItem.metrics.sets.length,
          nextItem.metrics.sets.length
        );
        
        // Add sets to current item if needed
        while (currentItem.metrics.sets.length < maxSets) {
          currentItem.metrics.sets.push({
            reps: '',
            weight: '',
            rest: '00:00'
          });
        }
        
        // Add sets to next item if needed
        while (nextItem.metrics.sets.length < maxSets) {
          nextItem.metrics.sets.push({
            reps: '',
            weight: '',
            rest: '00:00'
          });
        }
      } else {
        // Unlink the items
        currentItem.supersetWith = null;
        nextItem.supersetWith = null;
      }

      return updated;
    });
  };

  const handleUpdateMetrics = (index, metrics) => {
    setItems(current => {
      const updated = [...current];
      const item = updated[index];
      item.metrics = metrics;

      // If this is part of a superset, sync the number of sets
      if (item.supersetWith !== null) {
        const linkedItem = updated[item.supersetWith];
        if (linkedItem) {
          while (linkedItem.metrics.sets.length < metrics.sets.length) {
            linkedItem.metrics.sets.push({
              reps: '',
              weight: '',
              rest: '00:00'
            });
          }
          while (linkedItem.metrics.sets.length > metrics.sets.length) {
            linkedItem.metrics.sets.pop();
          }
        }
      }

      return updated;
    });
  };

  const handleMoveItem = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === items.length - 1)) {
      return;
    }

    setItems(current => {
      const updated = [...current];
      const item = updated[index];
      
      // If this item is part of a superset, move both items together
      if (item.supersetWith !== null || (index > 0 && updated[index - 1]?.supersetWith === index)) {
        const firstIndex = item.supersetWith !== null ? index : index - 1;
        const secondIndex = item.supersetWith !== null ? item.supersetWith : index;
        
        if (direction === 'up') {
          if (firstIndex <= 0) return current;
          
          // Move both items up
          const temp = updated[firstIndex - 1];
          updated[firstIndex - 1] = updated[firstIndex];
          updated[firstIndex] = updated[secondIndex];
          updated[secondIndex] = temp;
          
          // Update superset references
          updated[firstIndex - 1].supersetWith = firstIndex;
          updated[firstIndex].supersetWith = firstIndex - 1;
        } else {
          if (secondIndex >= updated.length - 1) return current;
          
          // Move both items down
          const temp = updated[secondIndex + 1];
          updated[secondIndex + 1] = updated[secondIndex];
          updated[secondIndex] = updated[firstIndex];
          updated[firstIndex] = temp;
          
          // Update superset references
          updated[secondIndex].supersetWith = secondIndex + 1;
          updated[secondIndex + 1].supersetWith = secondIndex;
        }
      } else {
        // Normal swap for non-superset items
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Check if we're trying to move into the middle of a superset
        if (updated[newIndex]?.supersetWith !== null || 
            (newIndex > 0 && updated[newIndex - 1]?.supersetWith === newIndex)) {
          // Skip over the superset pair
          const skipIndex = direction === 'up' ? newIndex - 1 : newIndex + 1;
          if (skipIndex < 0 || skipIndex >= updated.length) return current;
          
          [updated[index], updated[skipIndex]] = [updated[skipIndex], updated[index]];
        } else {
          [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        }
      }
      
      return updated;
    });
  };

  const renderItem = (item, index) => {
    const isSuperset = item.supersetWith !== null;
    const isSectionType = item.type === 'section';

    return (
      <View 
        key={`item-${item.id}-${index}`} 
        style={[
          styles.activityCard, 
          { 
            backgroundColor: theme.colors.surface,
            borderLeftColor: isSuperset ? theme.colors.primary : 'transparent',
            borderLeftWidth: isSuperset ? 3 : 0,
          }
        ]}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityIcon}>
            <Ionicons 
              name={ACTIVITY_TYPES.find(t => t.id === item.type)?.icon || 'fitness'} 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          <View style={styles.activityTitleContainer}>
            <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
              {item.title || item.name}
            </Text>
            {item.description && (
              <Text style={[styles.activityDescription, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
          <View style={styles.activityControls}>
            <TouchableOpacity 
              style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
              onPress={() => handleMoveItem(index, 'up')}
              disabled={index === 0}
            >
              <Ionicons 
                name="chevron-up" 
                size={20} 
                color={index === 0 ? theme.colors.textTertiary : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.moveButton, index === items.length - 1 && styles.moveButtonDisabled]}
              onPress={() => handleMoveItem(index, 'down')}
              disabled={index === items.length - 1}
            >
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={index === items.length - 1 ? theme.colors.textTertiary : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setMenuOpen(menuOpen === index ? null : index)}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {!isSectionType && (
          <View style={styles.metricsContainer}>
            {item.metrics.sets.map((set, setIndex) => (
              <View 
                key={`${index}-set-${setIndex}`} 
                style={styles.metricsRow}
              >
                <TextInput
                  style={[styles.metricInput, { color: theme.colors.text }]}
                  placeholder="Reps"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={set.reps}
                  onChangeText={(text) => {
                    const updatedMetrics = { ...item.metrics };
                    updatedMetrics.sets[setIndex].reps = text;
                    handleUpdateMetrics(index, updatedMetrics);
                  }}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.metricInput, { color: theme.colors.text }]}
                  placeholder="Weight"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={set.weight}
                  onChangeText={(text) => {
                    const updatedMetrics = { ...item.metrics };
                    updatedMetrics.sets[setIndex].weight = text;
                    handleUpdateMetrics(index, updatedMetrics);
                  }}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.metricInput, { color: theme.colors.text }]}
                  placeholder="Rest"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={set.rest}
                  onChangeText={(text) => {
                    const updatedMetrics = { ...item.metrics };
                    updatedMetrics.sets[setIndex].rest = text;
                    handleUpdateMetrics(index, updatedMetrics);
                  }}
                />
              </View>
            ))}
            <View style={styles.metricsControls}>
              <TouchableOpacity
                style={[styles.metricsButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  const updatedMetrics = { ...item.metrics };
                  updatedMetrics.sets.push({
                    reps: '',
                    weight: '',
                    rest: '00:00'
                  });
                  handleUpdateMetrics(index, updatedMetrics);
                }}
              >
                <Text style={[styles.metricsButtonText, { color: theme.colors.white }]}>
                  Add Set
                </Text>
              </TouchableOpacity>
              {index < items.length - 1 && !isSuperset && (
                <TouchableOpacity
                  style={[styles.metricsButton, { backgroundColor: isSuperset ? theme.colors.border : theme.colors.primary }]}
                  onPress={() => handleToggleSuperset(index)}
                >
                  <Text style={[styles.metricsButtonText, { color: theme.colors.white }]}>
                    {isSuperset ? 'Unlink' : 'Superset'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {menuOpen === index && (
          <View style={[styles.menuOptions, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity 
              style={styles.menuOption}
              onPress={() => handleDeleteItem(index)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF453A" />
              <Text style={[styles.menuOptionText, styles.menuOptionDelete]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {session.id ? 'Edit Session' : 'Create Session'}
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.sessionInfoContainer, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.titleInput, { color: theme.colors.text }]}
            placeholder="Session Title"
            placeholderTextColor={theme.colors.textSecondary}
            value={session.title}
            onChangeText={(text) => setSession(prev => ({ ...prev, title: text }))}
          />
          <TextInput
            style={[styles.descriptionInput, { color: theme.colors.text }]}
            placeholder="Description (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            value={session.description}
            onChangeText={(text) => setSession(prev => ({ ...prev, description: text }))}
            multiline
          />
        </View>

        {items.map((item, index) => renderItem(item, index))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddItem}
        >
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    borderBottomWidth: 1,
    marginTop: 40,
  },
  backButton: {
    padding: Layout.spacing.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.medium,
  },
  saveButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.medium,
  },
  sessionInfoContainer: {
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
  },
  titleInput: {
    fontSize: 24,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.small,
  },
  descriptionInput: {
    fontSize: 16,
    fontFamily: Typography.fonts.regular,
    minHeight: 60,
  },
  activityCard: {
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.small,
    padding: Layout.spacing.medium,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.small,
  },
  activityTitleContainer: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    marginTop: 2,
  },
  activityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveButton: {
    padding: 8,
  },
  moveButtonDisabled: {
    opacity: 0.5,
  },
  menuButton: {
    padding: 8,
  },
  menuOptions: {
    position: 'absolute',
    right: Layout.spacing.medium,
    top: Layout.spacing.xlarge,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.small,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.small,
    gap: Layout.spacing.small,
  },
  menuOptionText: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  menuOptionDelete: {
    color: '#FF453A',
  },
  bottomBar: {
    position: 'absolute',
    right: Layout.spacing.medium,
    bottom: Layout.spacing.medium,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricsContainer: {
    marginTop: Layout.spacing.medium,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.small,
    marginBottom: Layout.spacing.small,
  },
  metricInput: {
    flex: 1,
    height: 40,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.small,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    fontSize: 16,
    fontFamily: Typography.fonts.regular,
  },
  metricsControls: {
    flexDirection: 'row',
    gap: Layout.spacing.small,
    marginTop: Layout.spacing.small,
  },
  metricsButton: {
    flex: 1,
    height: 40,
    borderRadius: Layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsButtonText: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
}); 