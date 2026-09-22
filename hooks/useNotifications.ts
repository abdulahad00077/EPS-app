import Notifications from '../utils/NotificationsWrapper';
import type * as NotificationsType from 'expo-notifications';
import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../services/supabase';

export const useNotifications = (userId?: string) => {
  const [devicePushToken, setDevicePushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<NotificationsType.Notification | undefined>(undefined);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setDevicePushToken(token);
      if (token && userId) {
        saveTokenToDatabase(userId, token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification tap — extract data for navigation
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      
      // Navigation will be handled by the app's navigation system
      // The data contains { type: 'homework' | 'attendance' | 'message' | 'fees' | 'marks' | 'exams', ... }
      // This can be used with a navigation ref to deep-link
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId]);

  return { devicePushToken, notification };
};

async function saveTokenToDatabase(userId: string, token: string) {
  try {
    // Check if userId is a valid UUID to avoid "invalid input syntax for type uuid" error
    // Manual phone logins use format "manual-XXXXXXXXXX" which is not a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(userId);

    if (!isUUID) {
      console.log('Skipping push token save: user_id is not a valid UUID (likely dev mode).');
      return;
    }

    const { error } = await supabase
      .from('push_tokens')
      .upsert({ 
        user_id: userId, 
        token: token,
        role: 'parent',
        updated_at: new Date().toISOString()
      }, { onConflict: 'token' });
    
    if (error) console.error('Error saving push token:', error);
    else console.log('Push token saved successfully for user:', userId);
  } catch (err) {
    console.error('Failed to save push token:', err);
  }
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    // Create multiple notification channels for different event types
    await Promise.all([
      Notifications.setNotificationChannelAsync('default', {
        name: 'General Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0284C7',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
      Notifications.setNotificationChannelAsync('homework', {
        name: 'Homework Notifications',
        description: 'Notifications for new homework assignments',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EA580C',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
      Notifications.setNotificationChannelAsync('attendance', {
        name: 'Attendance Notifications',
        description: 'Notifications for attendance updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16A34A',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
      Notifications.setNotificationChannelAsync('messages', {
        name: 'Teacher Messages',
        description: 'Notifications for messages from teachers',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
      Notifications.setNotificationChannelAsync('fees', {
        name: 'Fee Notifications',
        description: 'Notifications for fee updates and reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0EA5E9',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
      Notifications.setNotificationChannelAsync('marks', {
        name: 'Marks & Results',
        description: 'Notifications for exam results and marks',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC2626',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
      Notifications.setNotificationChannelAsync('exams', {
        name: 'Exam Notifications',
        description: 'Notifications for new exams scheduled',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
    ]);
  }

  if (Constants.appOwnership === 'expo') {
    console.log('Push notifications not supported in Expo Go SDK 53+');
    return undefined;
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive important updates about your child.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // For direct Firebase/FCM notifications, we use getDevicePushTokenAsync
    token = (await Notifications.getDevicePushTokenAsync()).data;
    console.log('Device push token obtained:', typeof token === 'string' ? token.substring(0, 20) + '...' : token);
  } else {
    // Running on emulator — skip push token registration
    console.log('Push notifications require a physical device.');
  }

  return token;
}
