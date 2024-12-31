import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Forum from './Forum';
import Chat from './Chat';

export default function Community() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('forum');
  const [clients, setClients] = useState([]);
  const [isCoach, setIsCoach] = useState(false);
  const [coachData, setCoachData] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
        setIsCoach(coachDoc.exists());

        if (!coachDoc.exists()) {
          // If user is a client, get their coach's data
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          const coachId = userDoc.data()?.coachId;
          
          if (coachId) {
            const coachUserDoc = await getDoc(doc(db, 'users', coachId));
            if (coachUserDoc.exists()) {
              setCoachData({
                id: coachId,
                name: coachUserDoc.data().email?.split('@')[0] || 'Coach',
                email: coachUserDoc.data().email,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    const loadClients = async () => {
      if (!isCoach) return;
      
      try {
        // Get the coach document
        const coachRef = doc(db, 'coaches', auth.currentUser.uid);
        const coachDoc = await getDoc(coachRef);
        
        if (!coachDoc.exists()) {
          console.log('No coach document found');
          return;
        }

        const clientIds = coachDoc.data()?.clients || [];
        console.log('Found client IDs:', clientIds);

        // Get user data for each client
        const clientData = [];
        for (const clientId of clientIds) {
          const userRef = doc(db, 'users', clientId);
          const clientDoc = await getDoc(userRef);
          if (clientDoc.exists()) {
            const data = clientDoc.data();
            clientData.push({
              id: clientId,
              name: data.firstName && data.lastName 
                ? `${data.firstName} ${data.lastName}`
                : data.email?.split('@')[0] || 'Client',
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName
            });
          }
        }
        
        console.log('Loaded client data:', clientData);
        setClients(clientData);
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };

    if (auth.currentUser && isCoach) {
      loadClients();
    }
  }, [isCoach]);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  const handleChatTab = () => {
    setActiveTab('chat');
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'forum':
        return <Forum />;
      case 'chat':
        if (!isCoach) {
          if (!coachData) {
            return (
              <View style={styles.clientList}>
                <Text style={[styles.noClientsText, { color: theme.colors.textSecondary }]}>
                  No coach assigned
                </Text>
              </View>
            );
          }
          return <Chat 
            navigation={navigation} 
            route={{ params: { client: coachData } }}
            hideHeader={true}
          />;
        }
        if (selectedClient) {
          return <Chat 
            navigation={{ ...navigation, goBack: handleBackToClients }} 
            route={{ params: { client: selectedClient } }} 
          />;
        }
        return (
          <View style={[styles.clientList, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.clientListTitle, { color: theme.colors.text }]}>
              Select a Client
            </Text>
            <ScrollView>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[styles.clientItem, { backgroundColor: theme.colors.surface }]}
                  onPress={() => handleClientSelect(client)}
                >
                  <Text style={[styles.clientName, { color: theme.colors.text }]}>
                    {client.firstName && client.lastName 
                      ? `${client.firstName} ${client.lastName}`
                      : client.name}
                  </Text>
                  <Text style={[styles.clientEmail, { color: theme.colors.textSecondary }]}>
                    {client.email}
                  </Text>
                </TouchableOpacity>
              ))}
              {clients.length === 0 && (
                <Text style={[styles.noClientsText, { color: theme.colors.textSecondary }]}>
                  No clients found
                </Text>
              )}
            </ScrollView>
          </View>
        );
      default:
        return <Forum />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.tabBar, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'forum' && styles.activeTab,
            activeTab === 'forum' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('forum')}
        >
          <Text style={[
            styles.tabText, 
            { color: theme.colors.textSecondary },
            activeTab === 'forum' && { color: theme.colors.primary }
          ]}>
            Forum
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'chat' && styles.activeTab,
            activeTab === 'chat' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={handleChatTab}
        >
          <Text style={[
            styles.tabText, 
            { color: theme.colors.textSecondary },
            activeTab === 'chat' && { color: theme.colors.primary }
          ]}>
            Chat
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  content: {
    flex: 1,
  },
  clientList: {
    flex: 1,
    padding: 16,
  },
  clientListTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: 16,
  },
  clientItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  clientName: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: Layout.text.small,
  },
  noClientsText: {
    fontSize: Layout.text.medium,
    textAlign: 'center',
    marginTop: 24,
  },
}); 