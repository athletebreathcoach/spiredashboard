import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function SectionDetail({ route, navigation }) {
  const { theme } = useTheme();
  const { item } = route.params;
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState([]);

  // Example: check if user is coach (you'll need to implement this)
  const isCoach = true; // Replace with actual coach check
  const canEdit = isCoach || item.editable;

  const handleAddItem = (newItem) => {
    if (!isEditing) return;
    setItems([...items, newItem]);
  };

  // Add edit button to header
  React.useLayoutEffect(() => {
    if (canEdit) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => setIsEditing(!isEditing)}
            style={{ marginRight: 15 }}
          >
            <Text style={{ color: '#00B5E0', fontSize: 17 }}>
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, isEditing, canEdit]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header Section */}
        <View style={styles.header}>
          <Ionicons name={item.icon} size={40} color="#00B5E0" />
          <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.duration, { color: '#00B5E0' }]}>{item.duration}</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>

        {/* Items List */}
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: theme.colors.text }]}>Section Items</Text>
          {isEditing && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddSectionItem', {
                onAddItem: handleAddItem
              })}
            >
              <Ionicons name="add-circle-outline" size={24} color="#00B5E0" />
              <Text style={[styles.addButtonText, { color: '#00B5E0' }]}>Add Item</Text>
            </TouchableOpacity>
          )}
        </View>

        <DraggableFlatList
          data={items}
          onDragEnd={({ data }) => isEditing && setItems(data)}
          keyExtractor={(item) => item.id}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>
              <TouchableOpacity
                style={[
                  styles.itemCard, 
                  { backgroundColor: '#2C2C2E' },
                  isActive && { opacity: 0.5 }
                ]}
                onLongPress={isEditing ? drag : null}
                disabled={!isEditing || isActive}
              >
                <Ionicons name={item.icon} size={24} color="#00B5E0" />
                <View style={styles.itemContent}>
                  <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                    {item.title}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemType, { color: theme.colors.textSecondary }]}>
                      {item.type}
                    </Text>
                    <Text style={[styles.itemDuration, { color: '#00B5E0' }]}>
                      {item.duration}
                    </Text>
                  </View>
                </View>
                {isEditing && (
                  <TouchableOpacity style={styles.reorderHandle}>
                    <Ionicons name="reorder-two-outline" size={24} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </ScaleDecorator>
          )}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Layout.spacing.large,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: Typography.fonts.bold,
    marginTop: Layout.spacing.medium,
  },
  duration: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginTop: Layout.spacing.small,
  },
  description: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
    textAlign: 'center',
    marginTop: Layout.spacing.medium,
    lineHeight: 22,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.large,
    paddingVertical: Layout.spacing.medium,
  },
  listTitle: {
    fontSize: 22,
    fontFamily: Typography.fonts.semibold,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
  },
  itemsList: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  itemContent: {
    flex: 1,
    marginLeft: Layout.spacing.medium,
  },
  itemTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemType: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
    marginRight: Layout.spacing.medium,
  },
  itemDuration: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
  },
  reorderHandle: {
    padding: Layout.spacing.small,
  },
}); 