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
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setMessages(newMessages);
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const chatId = [auth.currentUser.uid, selectedClient.uid].sort().join('_');
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

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === auth.currentUser.uid;
    const initials = getInitials(isOwnMessage ? auth.currentUser.email.split('@')[0] : selectedClient?.name);
    const colors = ['#FFD700', '#98FB98', '#87CEEB', '#DDA0DD', '#F08080'];
    const colorIndex = initials.charCodeAt(0) % colors.length;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <View style={[styles.messageInitialsCircle, { backgroundColor: colors[colorIndex] }]}>
            <Text style={styles.messageInitialsText}>{initials}</Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isOwnMessage ? '#6C5CE7' : '#F2F2F7',
            marginLeft: !isOwnMessage ? 8 : 0,
            marginRight: isOwnMessage ? 8 : 0,
          }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? '#FFFFFF' : theme?.colors?.text }
          ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
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
    showChat,
    shouldShowInbox: isCoach && !showChat
  });

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

  // Add debug log for chat view
  console.log('Rendering chat view with client:', selectedClient);

  return (
    <View style={[styles.container, theme?.colors?.background && { backgroundColor: theme.colors.background }]}>
      <View style={[styles.chatHeader, { 
        borderBottomColor: theme?.colors?.border,
        backgroundColor: theme?.colors?.background
      }]}>
        {isCoach && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              console.log('Back button pressed');
              setShowChat(false);
              setSelectedClient(null);
            }}
          >
            <Ionicons name="chevron-back" size={28} color={theme?.colors?.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={[styles.headerText, { color: theme?.colors?.text }]}>
            {selectedClient?.name || selectedClient?.email?.split('@')[0] || 'Chat'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme?.colors?.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          inverted
          contentContainerStyle={styles.messagesList}
          ListHeaderComponent={() => (
            messages.length > 0 && (
              <View style={styles.dateHeader}>
                <Text style={[styles.dateText, { color: theme?.colors?.textSecondary }]}>
                  {messages[0]?.timestamp?.toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            )
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyChat}>
              <Text style={[styles.emptyChatText, { color: theme?.colors?.textSecondary }]}>
                No messages yet
              </Text>
            </View>
          )}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { 
          backgroundColor: theme?.colors?.surface,
          borderTopColor: theme?.colors?.border
        }]}>
          <View style={styles.inputRow}>
            <View style={[styles.inputWrapper, { backgroundColor: theme?.colors?.background }]}>
              <TextInput
                style={[styles.input, { color: theme?.colors?.text }]}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Message..."
                placeholderTextColor={theme?.colors?.textSecondary}
                multiline
              />
            </View>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="image-outline" size={24} color={theme?.colors?.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="mic-outline" size={24} color={theme?.colors?.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sendButton, { 
                backgroundColor: newMessage.trim() ? '#6C5CE7' : theme?.colors?.border 
              }]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Layout.spacing.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 56,
  },
  backButton: {
    marginRight: Layout.spacing.medium,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  dateHeader: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.small,
  },
  dateText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: Layout.spacing.medium,
  },
  messageInitialsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageInitialsText: {
    color: '#000000',
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Layout.spacing.medium,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 16,
    fontFamily: Typography.fonts.regular,
    lineHeight: 22,
  },
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: Layout.spacing.medium,
    paddingBottom: Platform.OS === 'ios' ? 30 : 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    marginRight: Layout.spacing.small,
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    paddingTop: 0,
    paddingBottom: 0,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  messagesList: {
    paddingVertical: Layout.spacing.medium,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xlarge,
  },
  emptyChatText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
}); 