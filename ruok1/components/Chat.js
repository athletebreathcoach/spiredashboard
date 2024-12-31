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
  Modal,
  FlatList,
  Image,
  TextInput,
  Alert,
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
  getDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { GiphyFetch } from '@giphy/js-fetch-api';

// Initialize Giphy API
const gf = new GiphyFetch('bjb9eQhsXLSG4kh6h6wlDtImisFJW6lP');

const { height: screenHeight } = Dimensions.get('window');

export default function Chat({ navigation, route, hideHeader }) {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [isGiphyModalVisible, setIsGiphyModalVisible] = useState(false);
  const [giphyResults, setGiphyResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const { client } = route.params || {};

  useEffect(() => {
    loadCurrentUserName();
  }, []);

  const loadCurrentUserName = async () => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const fullName = data.firstName && data.lastName 
          ? `${data.firstName} ${data.lastName}`
          : auth.currentUser.email?.split('@')[0];
        setCurrentUserName(fullName);
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  useEffect(() => {
    if (client?.id) {
      const chatId = [auth.currentUser.uid, client.id].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const newMessages = [];
        for (const docSnapshot of snapshot.docs) {
          const messageData = docSnapshot.data();
          let senderName = messageData.senderId === auth.currentUser.uid 
            ? currentUserName 
            : client.name;

          // If we don't have the sender's name, try to get it from their user document
          if (!senderName || senderName === messageData.senderId) {
            try {
              const userRef = doc(db, 'users', messageData.senderId);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                senderName = userData.firstName && userData.lastName 
                  ? `${userData.firstName} ${userData.lastName}`
                  : messageData.senderId;
              }
            } catch (error) {
              console.error('Error loading sender name:', error);
            }
          }

          newMessages.push({
            _id: docSnapshot.id,
            text: messageData.text,
            image: messageData.image,
            createdAt: messageData.timestamp?.toDate(),
            user: {
              _id: messageData.senderId,
              name: senderName,
            },
          });
        }
        setMessages(newMessages);
      });

      return () => unsubscribe();
    }
  }, [client, currentUserName]);

  const onSend = useCallback((newMessages = []) => {
    if (!client?.id) return;

    const chatId = [auth.currentUser.uid, client.id].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const message = newMessages[0];
    
    const messageData = {
      senderId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
    };

    if (message.text) {
      messageData.text = message.text;
    }

    if (message.image) {
      messageData.image = message.image;
    }
    
    addDoc(messagesRef, messageData);
  }, [client]);

  const searchGiphy = async (query) => {
    try {
      const { data } = await gf.search(query, { limit: 20 });
      setGiphyResults(data);
    } catch (error) {
      console.error('Error searching Giphy:', error);
    }
  };

  const handleGiphySelect = (gif) => {
    const message = {
      _id: Math.random().toString(),
      createdAt: new Date(),
      user: {
        _id: auth.currentUser.uid,
        name: auth.currentUser.email?.split('@')[0],
      },
      image: gif.images.original.url,
    };
    onSend([message]);
    setIsGiphyModalVisible(false);
  };

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

  const renderActions = (props) => {
    return (
      <TouchableOpacity
        style={styles.giphyButton}
        onPress={() => setIsGiphyModalVisible(true)}
      >
        <Ionicons name="images" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
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
        renderActions={renderActions}
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

  const onLongPress = useCallback((context, message) => {
    // Only allow deletion of own messages
    if (message.user._id === auth.currentUser.uid) {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const chatId = [auth.currentUser.uid, client.id].sort().join('_');
                await deleteDoc(doc(db, 'chats', chatId, 'messages', message._id));
              } catch (error) {
                console.error('Error deleting message:', error);
                Alert.alert('Error', 'Failed to delete message');
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  }, [client]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? (hideHeader ? 60 : 110) : 0}
    >
      {!hideHeader && (
        <SafeAreaView>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {client?.firstName && client?.lastName 
                ? `${client.firstName} ${client.lastName}`
                : client?.name || 'Chat'}
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
          name: currentUserName,
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
        bottomOffset={Platform.OS === 'ios' ? 0 : 0}
        onLongPress={onLongPress}
      />

      <Modal
        visible={isGiphyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsGiphyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsGiphyModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select a GIF
              </Text>
              <View style={styles.headerRight} />
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                placeholder="Search GIFs..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.trim()) {
                    searchGiphy(text);
                  }
                }}
              />
            </View>
            <FlatList
              data={giphyResults}
              keyExtractor={(item) => item.id}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.gifContainer}
                  onPress={() => handleGiphySelect(item)}
                >
                  <Image
                    source={{ uri: item.images.fixed_height.url }}
                    style={styles.gifImage}
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.giphyList}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  giphyButton: {
    marginLeft: 8,
    marginRight: 8,
    alignSelf: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  giphyList: {
    padding: 8,
  },
  gifContainer: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
}); 