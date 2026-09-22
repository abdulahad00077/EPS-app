import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export function useRealtimeData<T>(tableName: string, schoolId?: string, orderBy?: { column: string, ascending?: boolean }) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from(tableName).select('*');
      
      // If schoolId is provided, filter by it.
      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: fetchResult, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setData(fetchResult as T[]);
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [tableName, schoolId, orderBy?.column, orderBy?.ascending]);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`public:${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (!schoolId || payload.new.school_id === schoolId) {
              setData((prev) => [payload.new as T, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) => prev.map((item: any) => (item.id === payload.new.id ? payload.new : item)));
          } else if (payload.eventType === 'DELETE') {
            setData((prev) => prev.filter((item: any) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, schoolId, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
