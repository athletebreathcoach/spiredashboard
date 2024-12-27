import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
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
import Chat from './components/Chat';
import CategorySelector from './components/CategorySelector';
import Sections from './components/Sections';
import CreateSection from './components/CreateSection';
import AddSectionActivities from './components/AddSectionActivities';
import FeaturedVideos from './components/FeaturedVideos';
import FeaturedProtocols from './components/FeaturedProtocols';
import BlogReader from './components/BlogReader';
import FeaturedBlogs from './components/FeaturedBlogs';
import GuidedSessionDetail from './components/GuidedSessionDetail';
import HabitTaskDetail from './components/HabitTaskDetail';
import HabitTaskHistory from './components/HabitTaskHistory';
import WorkoutHistory from './components/WorkoutHistory';
import BreathTestDetail from './components/BreathTestDetail';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Update HomeScreen to use navigation
function HomeScreen({ navigation }) {
  const theme = useTheme();

  const handleBreathGuide = () => {
    navigation.navigate('BreathGuide');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme?.colors?.background }]}
      showsVerticalScrollIndicator={false}
    >
      <FeaturedVideos />
      <FeaturedProtocols />
      <FeaturedBlogs />
      <View style={styles.breathGuideContainer}>
        <TouchableOpacity 
          style={[styles.breathButton, { backgroundColor: theme?.colors?.primary }]}
          onPress={handleBreathGuide}
        >
          <Text style={[styles.breathButtonText, { color: theme?.colors?.background }]}>
            Breath Guide
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 40,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 0,
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
        name="Training" 
        component={Training}
        options={{
          headerStyle: {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          },
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
        name="Community" 
        component={Community}
        options={{
          headerStyle: {
            backgroundColor: theme.colors.background,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          },
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
  const [userRole, setUserRole] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const coachDoc = await getDoc(doc(db, 'coaches', user.uid));
      setUserRole(coachDoc.exists() ? 'coach' : 'client');
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('client');
    }
  };

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
          headerShown: false,
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
        name="ExerciseDetail" 
        component={ExerciseDetail}
        options={{
          title: 'Exercise Details',
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
        name="GuidedSessionDetail" 
        component={GuidedSessionDetail}
        options={{
          headerShown: false
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
      <Stack.Screen 
        name="Chat" 
        component={Chat}
        options={{
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="CategorySelector" 
        component={CategorySelector}
        options={{
          title: 'Add to Schedule',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen 
        name="Sections" 
        component={Sections}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateSection" 
        component={CreateSection}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddSectionActivities" 
        component={AddSectionActivities}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SectionDetail" 
        component={SectionDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BlogReader" 
        component={BlogReader}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="HabitTaskDetail" 
        component={HabitTaskDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="HabitTaskHistory" 
        component={HabitTaskHistory}
        options={{
          title: 'Habit & Task History',
          headerTitleStyle: {
            fontFamily: Typography.fonts.bold,
            fontSize: Layout.text.large,
          }
        }}
      />
      <Stack.Screen
        name="WorkoutHistory"
        component={WorkoutHistory}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BreathTestDetail"
        component={BreathTestDetail}
        options={{
          title: 'Exhale Test',
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
  },
  breathGuideContainer: {
    padding: Layout.spacing.large,
  },
  breathButton: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathButtonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
});
