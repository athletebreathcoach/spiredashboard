import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { auth, db } from '../config/firebase';
import { collection, getDocs, getDoc, doc, query, where, updateDoc, arrayUnion, addDoc } from 'firebase/firestore';

export default function CoachDashboard({ navigation }) {
  const { theme } = useTheme();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      console.log('Loading clients...');
      const coachRef = doc(db, 'coaches', auth.currentUser.uid);
      const coachDoc = await getDoc(coachRef);
      const clientIds = coachDoc.data()?.clients || [];
      console.log('Found client IDs:', clientIds);
      
      // Filter out empty or invalid client IDs
      const validClientIds = clientIds.filter(id => id && id.length > 0);
      console.log('Valid client IDs:', validClientIds);
      
      // Clean up the clients array if there were invalid IDs
      if (validClientIds.length !== clientIds.length) {
        console.log('Cleaning up invalid client IDs...');
        await updateDoc(coachRef, {
          clients: validClientIds
        });
      }
      
      const clientData = [];
      for (const clientId of validClientIds) {
        console.log('Loading client data for ID:', clientId);
        const userRef = doc(db, 'users', clientId);
        const clientDoc = await getDoc(userRef);
        if (clientDoc.exists()) {
          console.log('Found client:', clientDoc.data().email);
          clientData.push({
            id: clientId,
            ...clientDoc.data()
          });
        } else {
          console.log('No client document found for ID:', clientId);
        }
      }
      
      console.log('Total clients loaded:', clientData.length);
      setClients(clientData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteClient = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setInviting(true);

      // Check if user exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', inviteEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'No user found with this email address');
        return;
      }

      const clientDoc = querySnapshot.docs[0];
      const clientId = clientDoc.id;

      // Check if already a client
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      const currentClients = coachDoc.data().clients || [];
      if (currentClients.includes(clientId)) {
        Alert.alert('Error', 'This user is already your client');
        return;
      }

      // Create invitation
      const invitationsRef = collection(db, 'coachInvitations');
      await addDoc(invitationsRef, {
        coachId: auth.currentUser.uid,
        coachEmail: auth.currentUser.email,
        clientId: clientId,
        clientEmail: inviteEmail.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      Alert.alert('Success', 'Invitation sent successfully');
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (error) {
      console.error('Error inviting client:', error);
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleClientPress = (clientId) => {
    navigation.navigate('ClientHistory', { clientId });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowInviteModal(true)}
      >
        <Ionicons name="person-add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Invite Client</Text>
      </TouchableOpacity>

      {loading ? (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>Loading...</Text>
      ) : clients.length > 0 ? (
        <ScrollView style={styles.clientList}>
          {clients.map(client => (
            <TouchableOpacity
              key={client.id}
              style={[styles.clientCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleClientPress(client.id)}
            >
              <Text style={[styles.clientEmail, { color: theme.colors.text }]}>
                {client.email}
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          No clients yet
        </Text>
      )}

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Invite Client
            </Text>
            
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              placeholder="Enter client's email"
              placeholderTextColor={theme.colors.textSecondary}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!inviting}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.border }]}
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleInviteClient}
                disabled={inviting}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {inviting ? 'Sending...' : 'Send Invite'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  message: {
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    textAlign: 'center',
    marginTop: Layout.spacing.xlarge,
  },
  clientList: {
    flex: 1,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  clientInfo: {
    flex: 1,
    marginLeft: Layout.spacing.medium,
  },
  clientName: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.large,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.small,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Layout.spacing.large,
  },
  modalContent: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.large,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: Layout.minTouchSize,
    borderWidth: 1,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
    fontFamily: Typography.fonts.regular,
    fontSize: Layout.text.medium,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Layout.spacing.medium,
  },
  modalButton: {
    flex: 1,
    height: Layout.minTouchSize,
    borderRadius: Layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
}); 