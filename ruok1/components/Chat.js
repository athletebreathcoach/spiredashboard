import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { auth, db } from '../config/firebase';
import { 
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  limit,
  getDocs,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

export default function Chat() {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      subscribeToMessages();
    }
  }, [selectedClient]);

  const checkUserRole = async () => {
    try {
      // Check if user is a coach
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      const isUserCoach = coachDoc.exists();
      setIsCoach(isUserCoach);

      if (isUserCoach) {
        // Load all clients for coach
        const clientIds = coachDoc.data().clients || [];
        const clientData = [];
        for (const clientId of clientIds) {
          const clientDoc = await getDoc(doc(db, 'users', clientId));
          if (clientDoc.exists()) {
            const chatId = [auth.currentUser.uid, clientId].sort().join('_');
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
            const messageSnap = await getDocs(q);
            const lastMessage = messageSnap.docs[0]?.data() || null;
            
            clientData.push({
              uid: clientId,
              email: clientDoc.data().email,
              name: clientDoc.data().email.split('@')[0],
              lastMessage: lastMessage?.text || '',
              timestamp: lastMessage?.timestamp?.toDate() || null
            });
          }
        }
        setClients(clientData);
      } else {
        // Client: Get their coach
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().coachId) {
          const coachId = userDoc.data().coachId;
          const coachDoc = await getDoc(doc(db, 'coaches', coachId));
          if (coachDoc.exists()) {
            setSelectedClient({
              uid: coachId,
              email: coachDoc.data().email,
              name: coachDoc.data().email.split('@')[0]
            });
            setShowChat(true);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking user role:', error);
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const diff = now.getTime() - messageDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 1) return 'Yesterday';
    if (days < 7) return messageDate.toLocaleDateString([], { weekday: 'long' });
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderClientItem = ({ item }) => {
    const initials = getInitials(item.name);
    const colors = ['#FFD700', '#98FB98', '#87CEEB', '#DDA0DD', '#F08080'];
    const colorIndex = initials.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];

    return (
      <TouchableOpacity
        style={styles.clientItem}
        onPress={() => {
          console.log('Client selected:', item);
          setSelectedClient(item);
          setShowChat(true);
          console.log('ShowChat set to:', true);
        }}
      >
        <View style={[styles.initialsCircle, { backgroundColor }]}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={[styles.clientName, theme?.colors?.text && { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text 
            style={[styles.lastMessage, theme?.colors?.textSecondary && { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
        <Text style={[styles.timestamp, theme?.colors?.textSecondary && { color: theme.colors.textSecondary }]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </TouchableOpacity>
    );
  };

  const subscribeToMessages = () => {
    const chatId = [auth.currentUser.uid, selectedClient.uid].sort().join('_');
    console.log('Subscribing to chat:', {
      chatId,
      currentUser: auth.currentUser.uid,
      selectedClient: selectedClient.uid,
      isCoach
    });
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      console.log('Received messages:', newMessages.length);
      setMessages(newMessages);
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const chatId = [auth.currentUser.uid, selectedClient.uid].sort().join('_');
      console.log('Sending message:', {
        chatId,
        currentUser: auth.currentUser.uid,
        selectedClient: selectedClient.uid,
        isCoach
      });
      
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: auth.currentUser.uid,
        senderEmail: auth.currentUser.email,
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Add debug logs to track component state
  useEffect(() => {
    console.log('Current state:', {
      isCoach,
      showChat,
      selectedClient,
      messagesCount: messages.length
    });
  }, [isCoach, showChat, selectedClient, messages]);

  if (loading) {
    return (
      <View style={[styles.container, theme?.colors?.background && { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme?.colors?.primary} />
      </View>
    );
  }

  // Add debug log for render conditions
  console.log('Render conditions:', {
    isCoach,
    shouldShowInbox: isCoach && !showChat,
    showChat
  });

  // Show inbox for coaches when not in a chat
  if (isCoach && !showChat) {
    return (
      <View style={[styles.container, theme?.colors?.background && { backgroundColor: theme.colors.background }]}>
        <View style={styles.inboxHeader}>
          <Text style={[styles.inboxTitle, theme?.colors?.text && { color: theme.colors.text }]}>
            Inbox
          </Text>
          <TouchableOpacity style={styles.composeButton}>
            <Ionicons name="create-outline" size={24} color={theme?.colors?.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme?.colors?.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme?.colors?.text }]}
            placeholder="Search clients..."
            placeholderTextColor={theme?.colors?.textSecondary}
          />
        </View>
        <FlatList
          data={clients}
          renderItem={renderClientItem}
          keyExtractor={item => item.uid}
          contentContainerStyle={styles.clientsList}
        />
      </View>
    );
  }

  // Show chat window when a client is selected or user is not a coach
  if (selectedClient) {
    return (
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme?.colors?.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Simple header */}
        <View style={[styles.chatHeader, { 
          borderBottomColor: theme?.colors?.border || '#2C2C2E',
          backgroundColor: theme?.colors?.background
        }]}>
          <TouchableOpacity 
            onPress={() => {
              setShowChat(false);
              setSelectedClient(null);
            }}
          >
            <Text style={[styles.backButton, { color: theme?.colors?.primary }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: theme?.colors?.text }]}>{selectedClient.name}</Text>
        </View>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          <FlatList
            data={messages}
            renderItem={({ item }) => (
              <View style={[
                styles.messageContainer,
                item.senderId === auth.currentUser.uid ? styles.ownMessage : styles.otherMessage
              ]}>
                <Text style={[
                  styles.messageText,
                  { color: item.senderId === auth.currentUser.uid ? '#FFFFFF' : theme?.colors?.text }
                ]}>
                  {item.text}
                </Text>
              </View>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
          />
        </View>

        {/* Input */}
        <SafeAreaView style={[styles.inputContainer, { 
          borderTopColor: theme?.colors?.border || '#2C2C2E',
          backgroundColor: theme?.colors?.background
        }]}>
          <TextInput
            style={[styles.input, { 
              color: theme?.colors?.text,
              backgroundColor: theme?.colors?.surface || '#1C1C1E',
              borderColor: theme?.colors?.border || '#2C2C2E'
            }]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Message..."
            placeholderTextColor={theme?.colors?.textSecondary}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { 
              backgroundColor: newMessage.trim() ? '#6C5CE7' : theme?.colors?.border || '#2C2C2E'
            }]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={[styles.sendButtonText, { color: '#FFFFFF' }]}>Send</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  // If no client is selected and not showing inbox, show empty state
  return (
    <View style={[styles.container, theme?.colors?.background && { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.noChat, { color: theme?.colors?.textSecondary }]}>
        Select a client to start chatting
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.large,
    paddingBottom: Layout.spacing.medium,
  },
  inboxTitle: {
    fontSize: 34,
    fontFamily: Typography.fonts.bold,
  },
  composeButton: {
    padding: Layout.spacing.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Layout.spacing.medium,
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
  },
  searchInput: {
    flex: 1,
    marginLeft: Layout.spacing.small,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  initialsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.medium,
  },
  initialsText: {
    color: '#000000',
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
  clientInfo: {
    flex: 1,
    marginRight: Layout.spacing.medium,
  },
  clientName: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  timestamp: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  chatHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    color: 'blue',
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageContainer: {
    padding: 10,
    margin: 5,
    maxWidth: '80%',
    borderRadius: 20,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6C5CE7',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2C2C2E',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 10,
    fontSize: 16,
    minHeight: 40,
  },
  sendButton: {
    padding: 10,
    borderRadius: 20,
    height: 40,
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noChat: {
    textAlign: 'center',
    marginTop: Layout.spacing.xlarge,
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
  clientsList: {
    paddingVertical: Layout.spacing.small,
  },
  emptyChat: {
    alignItems: 'center',
    padding: Layout.spacing.xlarge,
  },
  emptyChatText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: Layout.spacing.medium,
  },
}); 