import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import ClientSelector from './ClientSelector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelectedClient } from '../context/SelectedClientContext';

export default function Profile({ navigation }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const { selectedClient, updateSelectedClient } = useSelectedClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');

  useEffect(() => {
    checkCoachStatus();
    loadPendingInvites();
    ensureUserFields();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const ensureUserFields = async () => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const updates = {};
        
        if (!data.hasOwnProperty('coachId')) {
          updates.coachId = null;
        }
        if (!data.hasOwnProperty('firstName')) {
          updates.firstName = '';
        }
        if (!data.hasOwnProperty('lastName')) {
          updates.lastName = '';
        }
        
        if (Object.keys(updates).length > 0) {
          await updateDoc(userRef, updates);
        }
      }
    } catch (error) {
      console.error('Error ensuring user fields:', error);
    }
  };

  const handleEditProfile = () => {
    setEditFirstName(firstName);
    setEditLastName(lastName);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        updatedAt: new Date().toISOString()
      });
      
      setFirstName(editFirstName.trim());
      setLastName(editLastName.trim());
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const checkCoachStatus = async () => {
    try {
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      setIsCoach(coachDoc.exists());
    } catch (error) {
      console.error('Error checking coach status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const invitesRef = collection(db, 'coachInvitations');
      const q = query(
        invitesRef,
        where('clientId', '==', auth.currentUser.uid),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      setPendingInvites(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  };

  const handleInviteResponse = async (invite, accept) => {
    try {
      if (accept) {
        // Update coach's clients array
        const coachRef = doc(db, 'coaches', invite.coachId);
        await updateDoc(coachRef, {
          clients: arrayUnion(auth.currentUser.uid)
        });

        // Update client's coachId
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          coachId: invite.coachId
        });
      }

      // Delete the invitation
      await deleteDoc(doc(db, 'coachInvitations', invite.id));
      
      // Refresh invites
      loadPendingInvites();

      Alert.alert(
        'Success',
        accept ? 'You are now connected with your coach!' : 'Invitation declined'
      );
    } catch (error) {
      console.error('Error handling invite:', error);
      Alert.alert('Error', 'Failed to process invitation');
    }
  };

  const handleClientSelect = (client) => {
    updateSelectedClient(client);
  };

  // Load selected client on mount
  useEffect(() => {
    const loadSelectedClient = async () => {
      try {
        const savedClient = await AsyncStorage.getItem('selectedClient');
        if (savedClient) {
          updateSelectedClient(JSON.parse(savedClient));
        }
      } catch (error) {
        console.error('Error loading selected client:', error);
      }
    };
    loadSelectedClient();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={80} color={theme.colors.primary} />
          </View>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {firstName && lastName ? `${firstName} ${lastName}` : auth.currentUser?.email || 'User'}
          </Text>
          {isCoach && (
            <View style={[styles.coachBadge, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.coachText, { color: theme.colors.primary }]}>Coach</Text>
            </View>
          )}
        </View>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Profile</Text>
              
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>First Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="Enter first name"
                placeholderTextColor={theme.colors.text + '80'}
              />
              
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Last Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Enter last name"
                placeholderTextColor={theme.colors.text + '80'}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Client Selector for Coaches */}
        {isCoach && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Current Client
            </Text>
            <ClientSelector
              onClientSelect={handleClientSelect}
              selectedClientId={selectedClient?.id}
            />
          </View>
        )}

        {/* Pending Invites Section */}
        {pendingInvites.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Coach Invitations
            </Text>
            {pendingInvites.map(invite => (
              <View
                key={invite.id}
                style={[styles.inviteCard, { backgroundColor: theme.colors.surface }]}
              >
                <View style={styles.inviteInfo}>
                  <Text style={[styles.inviteText, { color: theme.colors.text }]}>
                    {invite.coachFirstName && invite.coachLastName
                      ? `${invite.coachFirstName} ${invite.coachLastName}`
                      : invite.coachEmail} wants to be your coach
                  </Text>
                </View>
                <View style={styles.inviteButtons}>
                  <TouchableOpacity
                    style={[styles.inviteButton, { backgroundColor: theme.colors.error }]}
                    onPress={() => handleInviteResponse(invite, false)}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.background} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.inviteButton, { backgroundColor: theme.colors.success }]}
                    onPress={() => handleInviteResponse(invite, true)}
                  >
                    <Ionicons name="checkmark" size={24} color={theme.colors.background} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Coach Section */}
        {isCoach && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Coach Tools
            </Text>
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('CoachDashboard')}
            >
              <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.menuText, { color: theme.colors.text }]}>
                Client Dashboard
              </Text>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* History Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            History
          </Text>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('BreathTestHistory')}
          >
            <Ionicons name="fitness-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              Breath Test History
            </Text>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('BreathHistory')}
          >
            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              Breathing History
            </Text>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('HabitTaskHistory')}
          >
            <Ionicons name="list-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              Habit & Task History
            </Text>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('WorkoutHistory')}
          >
            <Ionicons name="barbell-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              Workout History
            </Text>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: Layout.spacing.large,
  },
  avatarContainer: {
    marginBottom: Layout.spacing.medium,
  },
  name: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
  },
  coachBadge: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.small,
  },
  coachText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  section: {
    marginBottom: Layout.spacing.large,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginLeft: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    marginHorizontal: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
  },
  menuText: {
    flex: 1,
    marginLeft: Layout.spacing.medium,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    marginHorizontal: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  inviteButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.small,
  },
  inviteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  inputLabel: {
    marginBottom: 5,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 