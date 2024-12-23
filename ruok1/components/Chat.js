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
import { useTheme } from '../theme/ThemeContext';
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
  const theme = useTheme();
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
            backgroundColor: theme.colors.messageBubbleOwn,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginVertical: 3,
          },
          left: {
            backgroundColor: theme.colors.messageBubbleOther,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginVertical: 3,
          },
        }}
        textStyle={{
          right: {
            color: theme.colors.messageTextOwn,
            fontSize: 16,
          },
          left: {
            color: theme.colors.messageTextOther,
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
          backgroundColor: theme.colors.background,
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
          backgroundColor: theme.colors.surface,
          borderRadius: 20,
          paddingHorizontal: 15,
          paddingTop: 10,
          paddingBottom: 10,
          marginLeft: 0,
          marginRight: 4,
          color: theme.colors.text,
          fontSize: 16,
        }}
        placeholderTextColor={theme.colors.textSecondary}
        placeholder="Message..."
      />
    );
  };

  const renderSend = (props) => {
    return (
      <Send {...props} containerStyle={{ justifyContent: 'center', height: 44, marginRight: 4 }}>
        <View style={{ padding: 8 }}>
          <Ionicons name="send" size={24} color={theme.colors.primary} />
        </View>
      </Send>
    );
  };

  const renderDay = (props) => {
    return (
      <Day
        {...props}
        textStyle={{
          color: theme.colors.textSecondary,
          fontSize: 12,
          fontWeight: '500',
        }}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!hideHeader && (
        <SafeAreaView>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {client?.name || 'Chat'}
            </Text>
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
          style: { backgroundColor: theme.colors.background },
          contentContainerStyle: { paddingBottom: 8 },
        }}
        timeTextStyle={{
          right: { color: theme.colors.textSecondary },
          left: { color: theme.colors.textSecondary },
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
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
  },
}); 