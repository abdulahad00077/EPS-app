import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeData } from '../../hooks/useRealtimeData';

export default function TeacherAnnouncementsScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  
  const insets = useSafeAreaInsets();
  const { data: announcements, loading } = useRealtimeData<any>('school_announcements', teacher?.school_id, { column: 'created_at', ascending: false });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.content, { color: colors.textSecondary }]}>{item.content}</Text>
              <View style={styles.meta}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.date, { color: colors.textSecondary }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                {item.target_type && (
                  <Text style={[styles.target, { color: colors.primary, backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' }]}>
                    {item.target_type} {item.target_class ? `(${item.target_class})` : ''}
                  </Text>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No announcements found.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  listContent: { padding: 20 },
  card: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  content: { fontSize: 14, marginBottom: 10, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  date: { fontSize: 12, marginRight: 10 },
  target: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }
});
