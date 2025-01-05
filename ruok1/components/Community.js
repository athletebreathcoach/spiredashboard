import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { auth, db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Forum from './Forum';
import Chat from './Chat';
import { format } from 'date-fns';

const ChatPreview = ({ client, lastMessage, onPress, theme }) => {
  const getPreviewText = () => {
    if (!lastMessage) return 'No messages yet';
    if (lastMessage.image) return '🖼️ Image';
    return lastMessage.text || 'No messages yet';
  };

  const getTimeString = () => {
    if (!lastMessage?.timestamp) return '';
    const date = lastMessage.timestamp.toDate();
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMM d');
    }
    return format(date, 'MM/dd/yy');
  };

  return (
    <TouchableOpacity
      style={[styles.chatPreview, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.avatarText, { color: theme.colors.background }]}>
            {(client.firstName?.[0] || client.name?.[0] || 'C').toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.previewContent}>
        <View style={styles.previewHeader}>
          <Text style={[styles.clientName, { color: theme.colors.text }]} numberOfLines={1}>
            {client.firstName && client.lastName 
              ? `${client.firstName} ${client.lastName}`
              : client.name}
          </Text>
          <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
            {getTimeString()}
          </Text>
        </View>
        <Text 
          style={[styles.previewText, { color: theme.colors.textSecondary }]} 
          numberOfLines={1}
        >
          {getPreviewText()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function Community() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('forum');
  const [clients, setClients] = useState([]);
  const [isCoach, setIsCoach] = useState(false);
  const [coachData, setCoachData] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientMessages, setClientMessages] = useState({});

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

  useEffect(() => {
    if (!isCoach || clients.length === 0) return;

    const unsubscribes = clients.map(client => {
      const chatId = [auth.currentUser.uid, client.id].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));

      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const messageData = snapshot.docs[0].data();
          setClientMessages(prev => ({
            ...prev,
            [client.id]: messageData
          }));
        }
      });
    });

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [isCoach, clients]);

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
              Messages
            </Text>
            <ScrollView>
              {clients.map((client) => (
                <ChatPreview
                  key={client.id}
                  client={client}
                  lastMessage={clientMessages[client.id]}
                  onPress={() => handleClientSelect(client)}
                  theme={theme}
                />
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
  chatPreview: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: Typography.fonts.medium,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  previewText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
}); 