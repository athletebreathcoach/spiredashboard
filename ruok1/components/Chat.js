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
import { GiftedChat, Bubble, InputToolbar, Composer, Send, Day } from 'react-native-gifted-chat';
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

export default function Chat({ navigation, route, hideHeader }) {
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
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginVertical: 3,
          },
          left: {
            backgroundColor: '#1C1C1E',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginVertical: 3,
          },
        }}
        textStyle={{
          right: {
            color: '#FFFFFF',
            fontSize: 16,
          },
          left: {
            color: '#FFFFFF',
            fontSize: 16,
          },
        }}
      />
    );
  };

  const renderInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: '#000000',
          borderTopWidth: 0,
          padding: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          marginBottom: Platform.OS === 'ios' ? 80 : 90,
        }}
        primaryStyle={{ alignItems: 'center' }}
      />
    );
  };

  const renderComposer = (props) => {
    return (
      <Composer
        {...props}
        textInputStyle={{
          backgroundColor: '#1C1C1E',
          borderRadius: 20,
          paddingHorizontal: 15,
          paddingTop: 10,
          paddingBottom: 10,
          marginLeft: 0,
          marginRight: 4,
          color: '#FFFFFF',
          fontSize: 16,
        }}
        placeholderTextColor="#8E8E93"
        placeholder="Message..."
      />
    );
  };

  const renderSend = (props) => {
    return (
      <Send {...props} containerStyle={{ justifyContent: 'center', height: 44, marginRight: 4 }}>
        <View style={{ padding: 8 }}>
          <Ionicons name="send" size={24} color="#00B5E0" />
        </View>
      </Send>
    );
  };

  const renderDay = (props) => {
    return (
      <Day
        {...props}
        textStyle={{
          color: '#8E8E93',
          fontSize: 12,
          fontWeight: '500',
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {!hideHeader && (
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#6C5CE7" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{client?.name || 'Chat'}</Text>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      )}

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
        renderDay={renderDay}
        renderAvatar={null}
        showUserAvatar={false}
        alwaysShowSend
        renderUsernameOnMessage={false}
        maxComposerHeight={80}
        minInputToolbarHeight={44}
        listViewProps={{
          style: { backgroundColor: '#000000' },
          contentContainerStyle: { paddingBottom: 8 },
        }}
        timeTextStyle={{
          right: { color: 'rgba(255,255,255,0.5)' },
          left: { color: 'rgba(255,255,255,0.5)' },
        }}
        dateFormat="MMM D, YYYY"
        timeFormat="h:mm A"
        inverted={true}
        infiniteScroll={true}
        bottomOffset={Platform.OS === 'ios' ? 80 : 90}
      />
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
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
  },
}); 