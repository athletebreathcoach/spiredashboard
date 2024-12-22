import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { auth, db } from '../config/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Set up real-time listener for messages
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map(doc => ({
          _id: doc.id,
          text: doc.data().text,
          createdAt: doc.data().createdAt?.toDate(),
          user: {
            _id: doc.data().user._id,
            name: doc.data().user.name,
            avatar: doc.data().user.avatar,
          },
        }))
      );
    });

    return () => unsubscribe();
  }, []);

  const onSend = useCallback((newMessages = []) => {
    const { _id, createdAt, text, user } = newMessages[0];

    addDoc(collection(db, 'messages'), {
      _id,
      createdAt: serverTimestamp(),
      text,
      user: {
        _id: auth.currentUser.uid,
        name: auth.currentUser.email?.split('@')[0] || 'Anonymous',
        avatar: null, // You can add avatar URL here if you have one
      },
    });
  }, []);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: auth.currentUser.uid,
          name: auth.currentUser.email?.split('@')[0] || 'Anonymous',
        }}
        renderAvatar={null}
        showAvatarForEveryMessage={false}
        showUserAvatar={false}
        alwaysShowSend
        scrollToBottom
        inverted={true}
        textInputStyle={styles.textInput}
        timeTextStyle={{
          left: styles.timeText,
          right: styles.timeText,
        }}
        renderUsernameOnMessage
        parsePatterns={(linkStyle) => [
          { type: 'url', style: styles.link },
          { pattern: /#(\w+)/, style: styles.hashtag },
        ]}
        messagesContainerStyle={styles.messagesContainer}
        bottomOffset={Platform.OS === 'ios' ? 90 : 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  textInput: {
    color: '#FFFFFF',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 5,
    marginBottom: 5,
    fontSize: 16,
  },
  timeText: {
    color: '#8E8E93',
  },
  link: {
    color: '#00B5E0',
    textDecorationLine: 'underline',
  },
  hashtag: {
    color: '#00B5E0',
  },
  messagesContainer: {
    backgroundColor: '#000000',
  },
});