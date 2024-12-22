import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from './config/firebase';
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
import Training from './components/Training';
import Community from './components/Community';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ExerciseSelector from './components/ExerciseSelector';
import ProgramDetail from './components/ProgramDetail';
import ProgramDayEdit from './components/ProgramDayEdit';
import ClientBreathHistory from './components/ClientBreathHistory';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Update HomeScreen to use navigation
function HomeScreen({ navigation }) {
  const theme = useTheme();

  const handleBreathGuide = () => {
    navigation.navigate('BreathGuide');
  };

  return (
    <View style={[styles.homeContainer, theme?.colors?.background && { backgroundColor: theme.colors.background }]}>
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
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Training') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: 'rgba(0, 0, 0, 0.3)',
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 40,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: theme?.colors?.primary || '#6C5CE7',
        tabBarInactiveTintColor: theme?.colors?.textSecondary || '#A0A0A0',
        headerStyle: theme?.colors?.background ? {
          backgroundColor: theme.colors.background,
        } : undefined,
        headerTintColor: theme?.colors?.text,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          headerStyle: theme?.colors?.background ? {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          } : undefined,
          headerRight: () => null
        }}
      />
      <Tab.Screen 
        name="Training" 
        component={Training}
        options={{
          headerStyle: theme?.colors?.background ? {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          } : undefined,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'barbell' : 'barbell-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={Search}
        options={{
          headerStyle: theme?.colors?.background ? {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          } : undefined,
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
        name="Community" 
        component={Community}
        options={{
          headerStyle: theme?.colors?.background ? {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          } : undefined,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
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
          headerStyle: theme?.colors?.background ? {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          } : undefined,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: Layout.spacing.medium }}
            >
              <Ionicons 
                name="settings-outline" 
                size={24} 
                color={theme?.colors?.text || '#FFFFFF'}
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          {user ? <AuthenticatedStack user={user} /> : <UnauthenticatedStack />}
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// Unauthenticated stack
function UnauthenticatedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Login" 
        component={Login}
        initialParams={{ fromSettings: false }}
      />
    </Stack.Navigator>
  );
}

// Authenticated stack
function AuthenticatedStack({ user }) {
  const theme = useTheme();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        console.log('Checking role for user:', user.email);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const coachDoc = await getDoc(doc(db, 'coaches', user.uid));
        
        console.log('Coach doc exists:', coachDoc.exists());
        
        if (coachDoc.exists()) {
          console.log('Setting user role to coach');
          setUserRole('coach');
        } else {
          console.log('Setting user role to client');
          setUserRole('client');
        }
      }
    };
    
    fetchRole();
  }, [user]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: theme?.colors?.background ? {
          backgroundColor: theme.colors.background,
        } : undefined,
        headerTintColor: theme?.colors?.text,
        headerTitleStyle: {
          fontFamily: Typography.fonts.medium,
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      {userRole === 'coach' && (
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
      )}
      <Stack.Screen 
        name="Settings" 
        component={Settings}
        options={{
          presentation: 'modal',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="BreathHistory" 
        component={BreathHistory}
        options={{
          title: 'Breathing History',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="ClientHistory" 
        component={ClientHistory}
        options={{
          title: 'Client History',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="ClientBreathHistory" 
        component={ClientBreathHistory}
        options={{
          title: 'Breathing History',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="BreathGuide" 
        component={BreathGuide}
        options={{
          title: 'Breath Guide',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="BreathProtocols" 
        component={BreathProtocols}
        options={{
          title: 'Breath Protocols',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="BreathingComplete" 
        component={BreathingComplete}
        options={{
          title: 'Session Complete',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="Exercises" 
        component={Exercises}
        options={{
          title: 'Exercises',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="BreathingTests" 
        component={BreathingTests}
        options={{
          title: 'Breathing Tests',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="GuidedSessions" 
        component={GuidedSessions}
        options={{
          title: 'Guided Sessions',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="HabitsTasks" 
        component={HabitsTasks}
        options={{
          title: 'Habits & Tasks',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="Programs" 
        component={Programs}
        options={{
          title: 'Programs',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
    </Stack.Navigator>
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
