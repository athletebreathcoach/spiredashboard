import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Login from './components/Login';
import Profile from './components/Profile';
import { Ionicons } from '@expo/vector-icons';

// Add this array near the top of your file, after imports
const quotes = [
  "Breathe in peace, breathe out stress",
  "Your breath is your anchor to the present moment",
  "Each breath is a fresh beginning",
  "The way you breathe is the way you live",
  "Breathing is the greatest pleasure in life",
  "Take a deep breath, it's a new day",
  "Your breath is your superpower",
  "Mindful breathing, mindful living"
];

// Placeholder for Home screen
function HomeScreen() {
  // Add this line to get a random quote
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const handleBreathGuide = () => {
    // Placeholder for future breathing exercise navigation/activation
    console.log('Breath Guide pressed');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.quoteText}>{randomQuote}</Text>
      
      <TouchableOpacity 
        style={styles.breathButton}
        onPress={handleBreathGuide}
      >
        <Text style={styles.breathButtonText}>Breath Guide</Text>
      </TouchableOpacity>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return null;
  }

  return (
    <>
      {user ? (
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Profile') {
                  iconName = focused ? 'person' : 'person-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Profile" component={Profile} />
          </Tab.Navigator>
        </NavigationContainer>
      ) : (
        <View style={styles.container}>
          <Login />
          <StatusBar style="auto" />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  breathButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  breathButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  quoteText: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 60,
    color: '#333',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    lineHeight: 32,
  },
});
