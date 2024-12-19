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
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import Layout from './constants/Layout';
import Typography from './constants/Typography';
import BreathingComplete from './components/BreathingComplete';
import Settings from './components/Settings';
import Search from './components/Search';
import BreathProtocols from './components/BreathProtocols';
import BreathHistory from './components/BreathHistory';
import { getDoc, doc } from 'firebase/firestore';
import CoachDashboard from './components/CoachDashboard';
import ClientHistory from './components/ClientHistory';
import Exercises from './components/Exercises';
import ExerciseDetail from './components/ExerciseDetail';
import BreathingTests from './components/BreathingTests';
import GuidedSessions from './components/GuidedSessions';
import HabitsTasks from './components/HabitsTasks';
import Programs from './components/Programs';
import SectionDetail from './components/SectionDetail';
import AddSectionItem from './components/AddSectionItem';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Update HomeScreen to use navigation
function HomeScreen({ navigation }) {
  const { theme } = useTheme();

  const handleBreathGuide = () => {
    navigation.navigate('BreathGuide');
  };

  return (
    <View style={[styles.homeContainer, { backgroundColor: theme.colors.background }]}>
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
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          headerStyle: {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          },
          headerRight: () => null
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={Search}
        options={{
          headerStyle: {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'search' : 'search-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile}
        options={({ navigation }) => ({
          headerStyle: {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: Layout.spacing.medium }}
            >
              <Ionicons 
                name="settings-outline" 
                size={24} 
                color={theme.colors.text}
              />
            </TouchableOpacity>
          ),
        })}
      />
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
    <ThemeProvider>
      <AppContent user={user} />
    </ThemeProvider>
  );
}

// Separate component to use theme after provider is initialized
function AppContent({ user }) {
  const { theme } = useTheme();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Fetch user role from Firebase
    const fetchRole = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const coachDoc = await getDoc(doc(db, 'coaches', user.uid));
      
      if (coachDoc.exists()) {
        setUserRole('coach');
      } else {
        setUserRole('client');
      }
    };
    
    fetchRole();
  }, [user]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontFamily: Typography.fonts.medium,
          },
        }}
      >
        {userRole === 'coach' ? (
          // Coach screens
          <>
            <Stack.Screen 
              name="CoachDashboard" 
              component={CoachDashboard}
              options={{
                title: 'Coach Dashboard',
                headerTitleStyle: {
                  fontFamily: Typography.fonts.bold,
                  fontSize: Layout.text.large,
                }
              }}
            />
            <Stack.Screen name="ClientHistory" component={ClientHistory} />
          </>
        ) : (
          // Client screens
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={TabNavigator}
              options={{ 
                headerShown: false 
              }}
            />
            <Stack.Screen 
              name="BreathGuide" 
              component={BreathGuide}
              options={{
                title: 'BREATH GUIDE',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                },
              }}
            />
            <Stack.Screen 
              name="BreathingComplete" 
              component={BreathingComplete}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Settings" 
              component={Settings}
              options={{
                title: 'Settings',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              }}
            />
            <Stack.Screen 
              name="Breath Protocols" 
              component={BreathProtocols}
              options={{
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              }}
            />
            <Stack.Screen 
              name="BreathHistory" 
              component={BreathHistory}
              options={{
                title: 'Breathing History',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              }}
            />
            <Stack.Screen 
              name="Exercises" 
              component={Exercises}
              options={{
                title: 'Exercises',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              }}
            />
            <Stack.Screen 
              name="ExerciseDetail" 
              component={ExerciseDetail}
              options={{
                headerShown: true,
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="BreathingTests" 
              component={BreathingTests}
              options={{
                title: 'Breathing Tests',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              }}
            />
            <Stack.Screen 
              name="GuidedSessions" 
              component={GuidedSessions}
              options={{
                title: 'Guided Sessions',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              }}
            />
            <Stack.Screen 
              name="HabitsTasks" 
              component={HabitsTasks}
              options={{
                title: 'Habits & Tasks',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              }}
            />
            <Stack.Screen 
              name="Programs" 
              component={Programs}
              options={{
                title: 'Programs',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              }}
            />
            <Stack.Screen 
              name="SectionDetail" 
              component={SectionDetail}
              options={{
                title: 'Section Details',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              }}
            />
            <Stack.Screen 
              name="AddSectionItem" 
              component={AddSectionItem}
              options={{
                title: 'Add Item',
                headerBackTitle: 'Back',
                headerStyle: {
                  backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.primary,
                headerTitleStyle: {
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
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
    fontFamily: Typography.fonts.bold,
    fontSize: Layout.text.large,
    letterSpacing: 1,
  },
});
