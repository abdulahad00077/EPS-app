import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../screens/DashboardScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import HomeworkScreen from '../screens/HomeworkScreen';
import ExamsScreen from '../screens/ExamsScreen';
import FeesScreen from '../screens/FeesScreen';
import TimetableScreen from '../screens/TimetableScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const bgColor = isDark ? '#1E293B' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#f1f5f9';
  const inactiveColor = isDark ? '#64748b' : '#64748b';
  const activeColor = isDark ? '#38BDF8' : '#0ea5e9';

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarStyle: {
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 8,
          height: 64 + Math.max(0, insets.bottom - 8),
          borderTopWidth: 1,
          borderTopColor: borderColor,
          backgroundColor: bgColor,
          elevation: 0,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="layout" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Exams"
        component={ExamsScreen}
        options={{
          tabBarLabel: 'Exams',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="school" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
