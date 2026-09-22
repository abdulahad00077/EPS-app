import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getResolvedClient, resolveAndSetDatabase, clearDatabaseConfig } from './databaseResolver';

import { coreSupabase } from './coreClient';
export { coreSupabase };

export const resolveSchoolDatabase = async (schoolId: string) => {
  await resolveAndSetDatabase(schoolId);
  return getResolvedClient();
};

export const resetSchoolDatabase = async () => {
  await clearDatabaseConfig();
};

export const supabase = new Proxy(coreSupabase, {
  get(target, prop, receiver) {
    const clientToUse = getResolvedClient();
    const value = Reflect.get(clientToUse, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(clientToUse);
    }
    return value;
  }
});
