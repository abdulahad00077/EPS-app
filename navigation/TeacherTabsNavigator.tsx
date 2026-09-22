import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import TeacherStudentsScreen from '../screens/teacher/TeacherStudentsScreen';
import TeacherAttendanceScreen from '../screens/teacher/TeacherAttendanceScreen';
import TeacherSettingsScreen from '../screens/teacher/TeacherSettingsScreen';

const Tab = createBottomTabNavigator();

export default function TeacherTabsNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'TeacherDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TeacherStudents') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'TeacherAttendance') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'TeacherSettings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="TeacherDashboard" 
        component={TeacherDashboardScreen} 
        options={{ title: 'Dashboard' }} 
      />
      <Tab.Screen 
        name="TeacherStudents" 
        component={TeacherStudentsScreen} 
        options={{ title: 'Students' }} 
      />
      <Tab.Screen 
        name="TeacherAttendance" 
        component={TeacherAttendanceScreen} 
        options={{ title: 'Attendance' }} 
      />
      <Tab.Screen 
        name="TeacherSettings" 
        component={TeacherSettingsScreen} 
        options={{ title: 'Settings' }} 
      />
    </Tab.Navigator>
  );
}
