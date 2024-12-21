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
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

export default function Chat() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCoach, setIsCoach] = useState(false);
  const [chatPartner, setChatPartner] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  useEffect(() => {
    if (chatPartner) {
      subscribeToMessages();
    }
  }, [chatPartner]);

  const checkUserRole = async () => {
    try {
      // Check if user is a coach
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      const isUserCoach = coachDoc.exists();
      setIsCoach(isUserCoach);

      if (isUserCoach) {
        // Coach: Get their first client
        const clientIds = coachDoc.data().clients || [];
        if (clientIds.length > 0) {
          const clientDoc = await getDoc(doc(db, 'users', clientIds[0]));
          if (clientDoc.exists()) {
            setChatPartner({
              uid: clientIds[0],
              ...clientDoc.data()
            });
          }
        }
      } else {
        // Client: Get their coach
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().coachId) {
          const coachId = userDoc.data().coachId;
          const coachDoc = await getDoc(doc(db, 'coaches', coachId));
          if (coachDoc.exists()) {
            setChatPartner({
              uid: coachId,
              ...coachDoc.data()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const subscribeToMessages = () => {
    const chatId = getChatId();
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
    });
  };

  const getChatId = () => {
    const ids = [auth.currentUser.uid, chatPartner.uid].sort();
    return `${ids[0]}_${ids[1]}`;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatPartner) return;

    try {
      const chatId = getChatId();
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: newMessage.trim(),
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === auth.currentUser.uid;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
        { backgroundColor: isOwnMessage ? theme.colors.primary : '#2C2C2E' }
      ]}>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={[styles.timestamp, { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }]}>
          {item.timestamp?.toDate?.() ? 
            new Date(item.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : ''}
        </Text>
      </View>
    );
  };

  if (!chatPartner) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.noChat, { color: theme.colors.textSecondary }]}>
          {isCoach ? "No clients found" : "No coach assigned"}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.colors.text }]}>
          {chatPartner.email}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={styles.messagesList}
      />

      <View style={[styles.inputContainer, { backgroundColor: '#2C2C2E' }]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
          onPress={sendMessage}
        >
          <Ionicons name="send" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Layout.spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  headerText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
  },
  messagesList: {
    padding: Layout.spacing.medium,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    marginVertical: Layout.spacing.small,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  timestamp: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Layout.spacing.medium,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  input: {
    flex: 1,
    padding: Layout.spacing.medium,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Layout.spacing.medium,
  },
  noChat: {
    textAlign: 'center',
    marginTop: Layout.spacing.xlarge,
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
}); 