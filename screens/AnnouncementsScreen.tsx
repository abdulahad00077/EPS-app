import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, DrawerActions } from '@react-navigation/native';

import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStudent } from '../hooks/useStudent';
import { useRealtimeData } from '../hooks/useRealtimeData';

export default function AnnouncementsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { selectedStudent } = useStudent();
  const navigation = useNavigation();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: announcements, loading } = useRealtimeData<any>('school_announcements', selectedStudent?.school_id, { column: 'created_at', ascending: false });

  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    let filtered = announcements.filter((a: any) => {
      // Filter out announcements specifically targeted to teachers if target_type is available
      if (a.target_type === 'teachers') return false;
      return true;
    });

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

    return filtered;
  }, [announcements, selectedDate]);

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
      <View style={[styles.header, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('announcements', 'Announcements')}</Text>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ padding: 8, marginRight: -8 }}>
            <Feather name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
          <TouchableOpacity 
            style={[styles.dateFilterBtn, { backgroundColor: selectedDate ? colors.primary : colors.surface, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Feather name="calendar" size={16} color={selectedDate ? '#fff' : colors.text} />
            <Text style={[styles.dateFilterText, { color: selectedDate ? '#fff' : colors.text }]}>
              {selectedDate ? selectedDate.toLocaleDateString() : t('filterByDate', 'Filter by Date')}
            </Text>
          </TouchableOpacity>

          {selectedDate && (
            <TouchableOpacity style={[styles.clearFilterBtn, { marginTop: 0, marginLeft: 12 }]} onPress={clearDateFilter}>
              <Text style={[styles.clearFilterText, { color: colors.primary }]}>{t('clearFilter', 'Clear Filter')}</Text>
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
                {item.target_type && item.target_type !== 'all' && (
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
                {selectedDate 
                  ? t('noAnnouncementsForDate', 'No announcements for this date.') 
                  : t('noAnnouncements', 'No announcements found.')}
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
  header: { 
    padding: 16, 
    borderBottomWidth: 1 
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
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
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: { padding: 16 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  content: { fontSize: 15, marginBottom: 12, lineHeight: 22 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontSize: 13, marginRight: 10 },
  target: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }
});
