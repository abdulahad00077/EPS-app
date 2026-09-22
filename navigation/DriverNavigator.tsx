import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import DriverDashboardScreen from '../screens/DriverDashboardScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import DriverSettingsScreen from '../screens/DriverSettingsScreen';

import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const Tab = createBottomTabNavigator();

const DriverNavigator = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
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
        component={DriverDashboardScreen}
        options={{
          tabBarLabel: t('dashboard'),
          tabBarIcon: ({ color, size }) => <Feather name="layout" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DriverProfileScreen}
        options={{
          tabBarLabel: t('profile'),
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={DriverSettingsScreen}
        options={{
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default DriverNavigator;
