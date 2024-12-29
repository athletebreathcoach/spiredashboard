import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { createSession, updateSession } from '../firebase/sessions';
import { auth } from '../config/firebase';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
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
    color: '#fff',
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
    backgroundColor: '#1C1C1E',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
  },
  titleInput: {
    fontSize: 24,
    fontFamily: Typography.fonts.semibold,
    color: '#fff',
    marginBottom: Layout.spacing.small,
  },
  descriptionInput: {
    fontSize: 16,
    fontFamily: Typography.fonts.regular,
    color: '#fff',
    minHeight: 60,
  },
  sectionGroup: {
    backgroundColor: '#1C1C1E',
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: Typography.fonts.medium,
    color: '#fff',
  },
  sectionContent: {
    padding: Layout.spacing.medium,
  },
  activityCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.small,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.small,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3C3C3E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.small,
  },
  activityTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
    color: '#fff',
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
  menuButton: {
    padding: 8,
  },
  menuOptions: {
    position: 'absolute',
    right: 0,
    top: 40,
    backgroundColor: '#2C2C2E',
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.small,
    zIndex: 2,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.small,
    gap: Layout.spacing.small,
  },
  menuOptionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  menuOptionDelete: {
    color: '#FF453A',
  },
});

export default function SessionDetail({ navigation, route }) {
  const theme = useTheme();
  const [session, setSession] = useState(route.params.session || { title: '', description: '' });
  const [items, setItems] = useState(
    route.params.session?.items || route.params.selectedItems || []
  );
  const [expandedSections, setExpandedSections] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    if (route.params?.selectedItems) {
      setItems(current => [...current, ...route.params.selectedItems]);
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
        userId: route.params.clientId || auth.currentUser.uid,
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
              updated.splice(index, 1);
              return updated;
            });
            setMenuOpen(null);
          }
        }
      ]
    );
  };

  const toggleSectionExpanded = (sectionId) => {
    setExpandedSections(current => ({
      ...current,
      [sectionId]: !current[sectionId]
    }));
  };

  const renderItem = (item, index) => {
    if (item.type === 'section') {
      return (
        <View key={item.id} style={styles.sectionGroup}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSectionExpanded(item.id)}
          >
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setMenuOpen(menuOpen === index ? null : index)}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
            </TouchableOpacity>
            <Ionicons 
              name={expandedSections[item.id] ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
          {expandedSections[item.id] && (
            <View style={styles.sectionContent}>
              {item.activities?.map((group) => 
                group.items?.map((activity) => (
                  <View key={activity.id} style={styles.activityCard}>
                    <View style={styles.activityHeader}>
                      <View style={styles.activityIcon}>
                        <Ionicons name="fitness" size={16} color="#666" />
                      </View>
                      <Text style={styles.activityTitle}>
                        {activity.title || activity.name}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
          {menuOpen === index && (
            <View style={styles.menuOptions}>
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
    }

    return (
      <View key={item.id} style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={styles.activityIcon}>
            <Ionicons name="fitness" size={16} color="#666" />
          </View>
          <Text style={styles.activityTitle}>
            {item.title || item.name}
          </Text>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setMenuOpen(menuOpen === index ? null : index)}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        {menuOpen === index && (
          <View style={styles.menuOptions}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
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
        <View style={styles.sessionInfoContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Session Title"
            placeholderTextColor="#666"
            value={session.title}
            onChangeText={(text) => setSession(prev => ({ ...prev, title: text }))}
          />
          <TextInput
            style={styles.descriptionInput}
            placeholder="Description (optional)"
            placeholderTextColor="#666"
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
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
} 