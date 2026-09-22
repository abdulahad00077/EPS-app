import './global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { StudentProvider } from './hooks/useStudent';
import RootNavigator from './navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Notifications from './utils/NotificationsWrapper';
import * as TaskManager from 'expo-task-manager';
import { useNotifications } from './hooks/useNotifications';
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications';
import { SchoolAccessBlocker } from './components/SchoolAccessBlocker';

import Constants from 'expo-constants';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

// Define background task for handling notifications when app is killed/backgrounded
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background notification error:', error);
    return;
  }
  if (data) {
    console.log('Background notification received!', data);
    // The notification will be shown automatically by the OS
    // This handler just logs it for debugging
  }
});

// Register the background task for notifications
// Remote push notifications are disabled in Expo Go SDK 53+
if (Constants.appOwnership !== 'expo') {
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(err => {
    console.log('Background task registration (may already be registered):', err);
  });
}

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,     // Show notification banner in-app
    shouldPlaySound: true,     // Play notification sound
    shouldSetBadge: true,      // Update app badge count
    shouldShowBanner: true,    // Show banner on top of screen
    shouldShowList: true,      // Show in notification center
  }),
});

import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';

const AppContent = () => {
  const { user } = useAuth();
  useNotifications(user?.id);
  useRealtimeNotifications();

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/AbdulAhad0007/edutrack-parents-main/releases/latest');
        const data = await response.json();
        
        if (data.tag_name) {
          const latestVersion = data.tag_name.replace('v', '');
          const currentVersion = Constants.expoConfig?.version || '1.0.0';
          
          const v1Parts = latestVersion.split('.').map(Number);
          const v2Parts = currentVersion.split('.').map(Number);
          
          let isNewer = false;
          for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const p1 = v1Parts[i] || 0;
            const p2 = v2Parts[i] || 0;
            if (p1 > p2) {
              isNewer = true;
              break;
            }
            if (p1 < p2) {
              break;
            }
          }
          
          if (isNewer) {
            Alert.alert(
              'Update Available',
              `A new version (${latestVersion}) of Skora Connect is available. Please update the app.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Update Now', 
                  onPress: () => {
                    const devStoreUrl = 'https://play-store-devfordevs.vercel.app/app/skora-connect-app'; 
                    Linking.openURL(devStoreUrl).catch(err => {
                      console.error("Couldn't open devstore:", err);
                      Linking.openURL('https://github.com/AbdulAhad0007/edutrack-parents-main/releases/latest');
                    });
                  }
                }
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    checkForUpdate();
  }, []);

  return (
    <>
      <SchoolAccessBlocker />
      <RootNavigator />
    </>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <StudentProvider>
                <AppContent />
              </StudentProvider>
              <StatusBar style="auto" />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
