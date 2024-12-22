import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Composer, Send } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { 
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

const { height: screenHeight } = Dimensions.get('window');

export default function Chat({ navigation, route }) {
  const [messages, setMessages] = useState([]);
  const { client } = route.params || {};

  useEffect(() => {
    if (client?.id) {
      const chatId = [auth.currentUser.uid, client.id].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          _id: doc.id,
          text: doc.data().text,
          createdAt: doc.data().timestamp?.toDate(),
          user: {
            _id: doc.data().senderId,
            name: doc.data().senderId === auth.currentUser.uid ? 
              auth.currentUser.email?.split('@')[0] : client.name,
            avatar: null,
          },
        }));
        setMessages(newMessages);
      });

      return () => unsubscribe();
    }
  }, [client]);

  const onSend = useCallback((newMessages = []) => {
    if (!client?.id) return;

    const chatId = [auth.currentUser.uid, client.id].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const { text } = newMessages[0];
    
    addDoc(messagesRef, {
      text,
      senderId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
    });
  }, [client]);

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#00B5E0',
          },
          left: {
            backgroundColor: '#1C1C1E',
          },
        }}
        textStyle={{
          right: {
            color: '#FFFFFF',
          },
          left: {
            color: '#FFFFFF',
          },
        }}
      />
    );
  };

  const renderSend = (props) => {
    return (
      <Send {...props}>
        <View style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#00B5E0" />
        </View>
      </Send>
    );
  };

  const renderInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={styles.inputPrimary}
      />
    );
  };

  const renderComposer = (props) => {
    return (
      <Composer
        {...props}
        textInputStyle={styles.composer}
        placeholderTextColor="#8E8E93"
        multiline={true}
      />
    );
  };

  return (
    <View style={styles.container}>
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

      {/* Chat */}
      <View style={styles.chatContainer}>
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={{
            _id: auth.currentUser.uid,
            name: auth.currentUser.email?.split('@')[0],
          }}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderSend={renderSend}
          renderAvatar={null}
          showAvatarForEveryMessage={false}
          showUserAvatar={false}
          alwaysShowSend
          renderUsernameOnMessage
          parsePatterns={(linkStyle) => [
            { type: 'url', style: styles.link },
            { pattern: /#(\w+)/, style: styles.hashtag },
          ]}
          messagesContainerStyle={styles.messagesContainer}
          minInputToolbarHeight={60}
          maxComposerHeight={100}
          isKeyboardInternallyHandled={true}
          keyboardShouldPersistTaps="handled"
          bottomOffset={90}
          listViewProps={{
            style: { flex: 1 },
            contentContainerStyle: { paddingBottom: 20 }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
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
  chatContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  inputToolbar: {
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  inputPrimary: {
    alignItems: 'center',
  },
  composer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  sendButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  messagesContainer: {
    backgroundColor: '#000000',
  },
  link: {
    color: '#00B5E0',
    textDecorationLine: 'underline',
  },
  hashtag: {
    color: '#00B5E0',
  },
}); 