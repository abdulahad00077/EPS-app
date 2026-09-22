import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsType from 'expo-notifications';

const isAndroidExpoGo = 
  Platform.OS === 'android' && 
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof NotificationsType;

if (!isAndroidExpoGo) {
  Notifications = require('expo-notifications');
} else {
  // Mock for Android Expo Go to prevent runtime crash in SDK 53+
  Notifications = {
    addNotificationReceivedListener: () => ({ remove: () => {} }),
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
    setNotificationChannelAsync: async () => {},
    getPermissionsAsync: async () => ({ status: 'granted', granted: true, canAskAgain: true, expires: 'never' } as any),
    requestPermissionsAsync: async () => ({ status: 'granted', granted: true, canAskAgain: true, expires: 'never' } as any),
    getDevicePushTokenAsync: async () => ({ data: 'mock-token', type: 'android' } as any),
    scheduleNotificationAsync: async () => 'mock-id',
    registerTaskAsync: async () => {},
    setNotificationHandler: () => {},
    AndroidImportance: {
      DEFAULT: 3,
      HIGH: 4,
      MAX: 5,
      LOW: 2,
      MIN: 1,
      NONE: 0,
      UNSPECIFIED: -1000
    } as any,
    AndroidNotificationVisibility: {
      PRIVATE: 0,
      PUBLIC: 1,
      SECRET: -1
    } as any,
  } as any;
}

export default Notifications;
