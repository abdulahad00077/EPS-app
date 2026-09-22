import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const coreUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const coreKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

// Safe storage check
const isNative = typeof globalThis !== 'undefined' && 
  ((globalThis as any).window !== undefined || (globalThis as any).HermesInternal !== undefined);
const storage = isNative ? AsyncStorage : undefined;

export const coreSupabase = createClient(coreUrl, coreKey, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
