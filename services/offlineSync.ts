import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { TransportLog } from '../types';

const QUEUE_KEY = '@transport_sync_queue';

export type PendingTransportAction = {
  id: string; // unique offline id
  student_id: string;
  driver_id: string;
  school_id: string;
  type: 'pickup' | 'drop';
  status: 'waiting' | 'picked_up' | 'reached_school' | 'dropped';
  timestamp: string;
  student_name: string; // for local notification or display if needed
};

export const addToOfflineQueue = async (action: PendingTransportAction) => {
  try {
    const currentQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: PendingTransportAction[] = currentQueueStr ? JSON.parse(currentQueueStr) : [];
    queue.push(action);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to offline queue', error);
  }
};

export const getOfflineQueue = async (): Promise<PendingTransportAction[]> => {
  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (error) {
    console.error('Error getting offline queue', error);
    return [];
  }
};

export const clearOfflineQueue = async () => {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing offline queue', error);
  }
};

export const syncOfflineData = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  const failedItems: PendingTransportAction[] = [];

  for (const item of queue) {
    try {
      const { id, student_name, type, ...dbData } = item;
      const { error } = await supabase.from('transport_logs').insert([{ ...dbData, trip_type: type }]);
      if (error) {
        console.error('Failed to sync item', item, error);
        failedItems.push(item);
      }
    } catch (err) {
      console.error('Error during sync', err);
      failedItems.push(item);
    }
  }

  // Save any items that still failed back to the queue
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedItems));
};

// Start listening for network changes to auto-sync
export const initOfflineSyncListener = () => {
  NetInfo.addEventListener(state => {
    if (state.isConnected) {
      syncOfflineData();
    }
  });
};
