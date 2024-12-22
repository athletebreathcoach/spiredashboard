import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
} from 'firebase/firestore';

export default function Chat({ navigation, route }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { client } = route.params || {};

  useEffect(() => {
    if (client?.id) {
      const chatId = [auth.currentUser.uid, client.id].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));
        setMessages(newMessages);
      });

      return () => unsubscribe();
    }
  }, [client]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !client?.id) return;

    try {
      const chatId = [auth.currentUser.uid, client.id].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return 'Dec 19, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }) => {
    const isOwn = item.senderId === auth.currentUser.uid;
    const showAvatar = !isOwn && (!messages[index - 1] || messages[index - 1].senderId !== item.senderId);
    const showTime = !messages[index + 1] || messages[index + 1].senderId !== item.senderId;

    return (
      <View style={styles.messageRow}>
        {!isOwn && showAvatar && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{client?.initials || 'U'}</Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
          !isOwn && !showAvatar && { marginLeft: 50 }
        ]}>
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          {showTime && (
            <Text style={[
              styles.timeText,
              isOwn ? styles.ownTimeText : styles.otherTimeText
            ]}>
              {formatTime(item.timestamp)}
              {isOwn && ' ✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderDateSeparator = (date) => (
    <View style={styles.dateSeparator}>
      <Text style={styles.dateText}>{formatDate(date)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#6C5CE7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{client?.name || 'Chat'}</Text>
        <View style={styles.headerRight}>
          <View style={styles.dotContainer}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          inverted={false}
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarTextSmall}>ZK</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Message..."
                placeholderTextColor="#8E8E93"
                multiline
              />
              <View style={styles.inputButtons}>
                <TouchableOpacity style={styles.inputButton}>
                  <Text style={styles.gifText}>GIF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputButton}>
                  <Ionicons name="mic-outline" size={24} color="#6C5CE7" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputButton}>
                  <Ionicons name="camera-outline" size={24} color="#6C5CE7" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.sendButton, { opacity: newMessage.trim() ? 1 : 0.5 }]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6C5CE7',
    marginHorizontal: 2,
  },
  content: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  messageContainer: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 20,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6C5CE7',
    borderBottomRightRadius: 4,
    marginLeft: 50,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: '#8E8E93',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#98FB98',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarTextSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginRight: 8,
    padding: 8,
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 8,
  },
  inputButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
  },
  inputButton: {
    padding: 4,
    marginLeft: 8,
  },
  gifText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 