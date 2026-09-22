import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useStudent } from '../hooks/useStudent';
import LoginScreen from '../screens/LoginScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './DrawerNavigator';
import DriverNavigator from './DriverNavigator';
import TeacherDrawerNavigator from './TeacherDrawerNavigator';

import SettingsScreen from '../screens/SettingsScreen';
import SecurityPrivacyScreen from '../screens/SecurityPrivacyScreen';
import AboutScreen from '../screens/AboutScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          userRole === 'teacher' ? (
            <Stack.Screen name="TeacherMain" component={TeacherDrawerNavigator} />
          ) : userRole === 'driver' ? (
            <Stack.Screen name="DriverMain" component={DriverNavigator} />
          ) : (
            <>
              <Stack.Screen name="Main" component={DrawerNavigator} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="SecurityPrivacy" component={SecurityPrivacyScreen} />
              <Stack.Screen name="About" component={AboutScreen} />
            </>
          )
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default RootNavigator;
