import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { coreSupabase } from './coreClient';

let resolvedClient: SupabaseClient | null = null;
let currentSchoolId: string | null = null;

const DB_CONFIG_KEY = 'Mera Elegant_db_config';

interface DatabaseConfig {
  type: string;
  url: string | null;
  anonKey: string | null;
}

// Safe storage check (prevents crashes in Node/CLI environments)
const isNative = typeof globalThis !== 'undefined' && 
  ((globalThis as any).window !== undefined || (globalThis as any).HermesInternal !== undefined);
const storage = isNative ? AsyncStorage : undefined;

export async function resolveAndSetDatabase(schoolId: string, schoolData?: any): Promise<void> {
  let dbConfig: DatabaseConfig;

  if (schoolData && schoolData.database_mode) {
    // Optimization: If we already fetched the school configuration during login, use it.
    dbConfig = {
      type: schoolData.database_mode,
      url: schoolData.supabase_url,
      anonKey: schoolData.supabase_anon_key
    };
  } else {
    // 1. Fetch from core client if not provided
    const { data: school, error } = await coreSupabase
      .from('schools')
      .select('database_mode, supabase_url, supabase_anon_key')
      .eq('id', schoolId)
      .single();

    if (error || !school) throw new Error('Failed to fetch school database configuration');

    dbConfig = {
      type: school.database_mode || 'core',
      url: school.supabase_url,
      anonKey: school.supabase_anon_key
    };
  }

  await AsyncStorage.setItem(DB_CONFIG_KEY, JSON.stringify(dbConfig));
  await initializeResolvedClient(dbConfig);
  currentSchoolId = schoolId;
}

export async function initializeFromCache(): Promise<boolean> {
  const cached = await AsyncStorage.getItem(DB_CONFIG_KEY);
  if (cached) {
    try {
      const config: DatabaseConfig = JSON.parse(cached);
      await initializeResolvedClient(config);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function initializeResolvedClient(config: DatabaseConfig) {
  if ((config.type === 'dedicated' || config.type === 'own') && config.url && config.anonKey) {
    resolvedClient = createClient(config.url, config.anonKey, {
      auth: {
        storage: storage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      }
    });
  } else {
    // We use the coreClient (which uses the ANON key of core)
    resolvedClient = coreSupabase;
  }
}

export function getResolvedClient(): SupabaseClient {
  if (!resolvedClient) {
     // fallback to core if not logged in yet
     return coreSupabase;
  }
  return resolvedClient;
}

export async function clearDatabaseConfig() {
  await AsyncStorage.removeItem(DB_CONFIG_KEY);
  resolvedClient = null;
  currentSchoolId = null;
}
