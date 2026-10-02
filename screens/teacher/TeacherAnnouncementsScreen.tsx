import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRealtimeData } from '../../hooks/useRealtimeData';

export default function TeacherAnnouncementsScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  
  const insets = useSafeAreaInsets();
  const { data: announcements, loading } = useRealtimeData<any>('school_announcements', teacher?.school_id, { column: 'created_at', ascending: false });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    let filtered = announcements;

    if (selectedDate) {
      filtered = filtered.filter((a: any) => {
        const itemDate = new Date(a.created_at);
        return (
          itemDate.getFullYear() === selectedDate.getFullYear() &&
          itemDate.getMonth() === selectedDate.getMonth() &&
          itemDate.getDate() === selectedDate.getDate()
        );
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a: any) => {
        const title = (a.title || '').toLowerCase();
        const content = (a.content || '').toLowerCase();
        return title.includes(q) || content.includes(q);
      });
    }

    return filtered;
  }, [announcements, selectedDate, searchQuery]);

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search announcements..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ marginTop: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.dateFilterBtn, { backgroundColor: selectedDate ? colors.primary : colors.surface, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Feather name="calendar" size={16} color={selectedDate ? '#fff' : colors.text} />
            <Text style={[styles.dateFilterText, { color: selectedDate ? '#fff' : colors.text }]}>
              {selectedDate ? selectedDate.toLocaleDateString() : 'Filter by Date'}
            </Text>
          </TouchableOpacity>

          {selectedDate && (
            <TouchableOpacity style={[styles.clearFilterBtn, { marginLeft: 12 }]} onPress={clearDateFilter}>
              <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear Filter</Text>
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAnnouncements}
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
              <Ionicons name="notifications-off-outline" size={48} color={colors.border} style={{ marginBottom: 10 }} />
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                {selectedDate || searchQuery ? 'No announcements match your search.' : 'No announcements found.'}
              </Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  clearSearchBtn: { padding: 4 },
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dateFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: { padding: 20, paddingTop: 5 },
  card: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  content: { fontSize: 14, marginBottom: 10, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  date: { fontSize: 12, marginRight: 10 },
  target: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }
});
