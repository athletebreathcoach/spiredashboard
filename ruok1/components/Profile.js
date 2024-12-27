import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function Profile({ navigation }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);

  useEffect(() => {
    checkCoachStatus();
    loadPendingInvites();
    ensureUserFields();
  }, []);

  const ensureUserFields = async () => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && !userDoc.data().hasOwnProperty('coachId')) {
        await updateDoc(userRef, {
          coachId: null
        });
      }
    } catch (error) {
      console.error('Error ensuring user fields:', error);
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={80} color={theme.colors.primary} />
          </View>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {auth.currentUser?.email || 'User'}
          </Text>
          {isCoach && (
            <View style={[styles.coachBadge, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.coachText, { color: theme.colors.primary }]}>Coach</Text>
            </View>
          )}
        </View>

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
                    {invite.coachEmail} wants to be your coach
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
        </View>
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
}); 