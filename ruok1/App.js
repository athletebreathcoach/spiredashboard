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
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BreathGuide from './components/BreathGuide';

// Update the quotes to be more motivational/athletic
const quotes = [
  "Control your breath, control your game",
  "Champions breathe differently",
  "Power starts with breath",
  "Train your lungs like you train your muscles",
  "Breathe deep, push harder",
  "Mental toughness begins with breath control",
  "Master your breath, master yourself",
  "Breathing is your secret weapon"
];

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Update HomeScreen to use navigation
function HomeScreen({ navigation }) {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const handleBreathGuide = () => {
    navigation.navigate('BreathGuide');
  };

  return (
    <View style={styles.homeContainer}>
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

function TabNavigator() {
  return (
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
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          headerRight: () => null
        }}
      />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

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
          <Stack.Navigator>
            <Stack.Screen 
              name="MainTabs" 
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="BreathGuide" 
              component={BreathGuide}
              options={{
                title: 'BREATH GUIDE',
                headerStyle: {
                  backgroundColor: '#0d2f4d',
                },
                headerTintColor: '#00B5E0',
                headerTitleStyle: {
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                },
              }}
            />
          </Stack.Navigator>
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
    backgroundColor: '#000000',
    paddingVertical: 20,
  },
  homeContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingVertical: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  breathButton: {
    backgroundColor: '#00B5E0',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 12,
    shadowColor: '#00B5E0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  breathButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  quoteText: {
    fontSize: 28,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 60,
    color: '#FFFFFF',
    fontWeight: 'bold',
    paddingHorizontal: 20,
    lineHeight: 36,
    textTransform: 'uppercase',
  },
});
