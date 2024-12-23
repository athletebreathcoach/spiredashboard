import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const defaultTheme = {
  colors: {
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    primary: '#00B5E0'
  }
};

export default function ClientSelector({ onClientSelect, selectedClientId }) {
  const { theme = defaultTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      // First get the coach document to get the client IDs
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      if (!coachDoc.exists()) {
        console.error('Coach document not found');
        return;
      }

      const coachData = coachDoc.data();
      const clientIds = coachData.clients || [];

      // Then fetch each client's details from the users collection
      const clientsData = await Promise.all(
        clientIds.map(async (clientId) => {
          const clientDoc = await getDoc(doc(db, 'users', clientId));
          if (clientDoc.exists()) {
            return {
              id: clientDoc.id,
              ...clientDoc.data()
            };
          }
          return null;
        })
      );

      // Filter out any null values (in case a client document wasn't found)
      const validClients = clientsData.filter(client => client !== null);
      setClients(validClients);

      // If there's a selectedClientId, find and set that client
      if (selectedClientId) {
        if (selectedClientId === auth.currentUser.uid) {
          setSelectedClient({ id: auth.currentUser.uid, name: 'My Training' });
        } else {
          const client = validClients.find(c => c.id === selectedClientId);
          setSelectedClient(client);
        }
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (client) => {
    setSelectedClient(client);
    onClientSelect(client);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: theme.colors.surface }]}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.selectorContent}>
          <Ionicons name="person-circle-outline" size={24} color="#00B5E0" />
          <Text style={[styles.selectorText, { color: theme.colors.text }]}>
            {selectedClient ? selectedClient.name : 'Select Client'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Client
              </Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.clientList}>
              {loading ? (
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Loading clients...
                </Text>
              ) : (
                <>
                  {/* My Training Option */}
                  <TouchableOpacity
                    style={[
                      styles.clientItem,
                      { backgroundColor: theme.colors.surface },
                      selectedClient?.id === auth.currentUser.uid && styles.selectedItem
                    ]}
                    onPress={() => handleSelect({ id: auth.currentUser.uid, name: 'My Training' })}
                  >
                    <View style={styles.clientInfo}>
                      <Ionicons 
                        name="calendar-outline" 
                        size={24} 
                        color="#00B5E0" 
                      />
                      <Text style={[styles.clientName, { color: theme.colors.text }]}>
                        My Training
                      </Text>
                    </View>
                    {selectedClient?.id === auth.currentUser.uid && (
                      <Ionicons name="checkmark-circle" size={24} color="#00B5E0" />
                    )}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                  {/* Client List */}
                  {clients.length > 0 ? (
                    clients.map((client) => (
                      <TouchableOpacity
                        key={client.id}
                        style={[
                          styles.clientItem,
                          { backgroundColor: theme.colors.surface },
                          selectedClient?.id === client.id && styles.selectedItem
                        ]}
                        onPress={() => handleSelect(client)}
                      >
                        <View style={styles.clientInfo}>
                          <Ionicons 
                            name="person-circle-outline" 
                            size={24} 
                            color="#00B5E0" 
                          />
                          <Text style={[styles.clientName, { color: theme.colors.text }]}>
                            {client.name || client.email}
                          </Text>
                        </View>
                        {selectedClient?.id === client.id && (
                          <Ionicons name="checkmark-circle" size={24} color="#00B5E0" />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                      No clients found
                    </Text>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Layout.spacing.medium,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.medium,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
  },
  closeButton: {
    padding: Layout.spacing.small,
  },
  clientList: {
    padding: Layout.spacing.medium,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.medium,
  },
  selectedItem: {
    borderColor: '#00B5E0',
    borderWidth: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    padding: Layout.spacing.large,
  },
  divider: {
    height: 1,
    marginVertical: Layout.spacing.medium,
    opacity: 0.2,
  },
}); 