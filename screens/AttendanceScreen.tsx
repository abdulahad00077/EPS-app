import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  StatusBar, 
  StyleSheet, 
  Dimensions, 
  Platform 
} from 'react-native';
import { useStudent } from '../hooks/useStudent';
import { getStudentAttendance } from '../services/attendance';
import { AttendanceRecord } from '../types';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRealtimeData } from '../hooks/useRealtimeData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AttendanceScreen = () => {
  const navigation = useNavigation();
  const { selectedStudent } = useStudent();
  
  const { data: allAttendance, loading } = useRealtimeData<AttendanceRecord>('attendance_records', selectedStudent?.school_id);
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'morning' | 'verification'>('all');
  
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const transSelectedName = useTransliteration(selectedStudent?.name);

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#F1F5F9';

  // No longer need manual useEffect for fetching, useRealtimeData handles it.

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={[styles.loadingText, { color: subtextColor }]}>{t('loading')}</Text>
      </View>
    );
  }

  // Determine actual type column name if present
  const getType = (record: any) => record.type || record.attendance_type || record.attendance_system || 'morning';

  const filteredAttendance = allAttendance.filter(record => {
    // Only show records for the selected student
    if (record.student_id !== selectedStudent?.id && record.roll_id !== selectedStudent?.roll_id && record.student_name !== selectedStudent?.name) {
      // Sometimes it's matched by roll_id or name in a generic system, but we should primarily match student_id
      if (record.student_id && record.student_id !== selectedStudent?.id) return false;
    }

    // Date filter
    if (selectedDate) {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      const filterDate = selectedDate.toISOString().split('T')[0];
      if (recordDate !== filterDate) return false;
    }
    
    // Type filter
    if (selectedType !== 'all') {
      const recordType = getType(record).toLowerCase();
      if (recordType !== selectedType) return false;
    }
    
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.headerWrapper, { backgroundColor: headerBg }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#ffffff', '#F8FAFC']}
          style={[styles.headerGradient, { borderBottomColor: borderColor }]}
        >
          <View style={[styles.headerTop, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={{ padding: 8, marginRight: 12, borderRadius: 12, backgroundColor: 'rgba(148, 163, 184, 0.1)' }} 
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={24} color={textColor} />
              </TouchableOpacity>
              <View>
                <Text style={[styles.headerTitle, { color: textColor }]}>{t('attendance', 'Attendance')}</Text>
                <Text style={[styles.headerSubtitle, { color: subtextColor }]}>{t('historyFor', 'History for')} {transSelectedName}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Feather name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'space-between', zIndex: 5, borderBottomWidth: 1, borderBottomColor: borderColor }}>
        {/* Date Filter Button */}
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', flex: 1, marginRight: 10 }]} 
          onPress={() => setShowDatePicker(true)}
        >
          <Feather name="calendar" size={16} color={selectedDate ? '#0284C7' : subtextColor} />
          <Text style={[styles.filterText, { color: selectedDate ? '#0284C7' : subtextColor }]}>
            {selectedDate ? selectedDate.toLocaleDateString() : t('selectDate', 'Select Date')}
          </Text>
          {selectedDate && (
            <TouchableOpacity onPress={() => setSelectedDate(null)} style={{ marginLeft: 'auto' }}>
              <Feather name="x" size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Type Filter Buttons */}
        <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderRadius: 12, padding: 4 }}>
          <TouchableOpacity 
            style={[styles.typeTab, selectedType === 'all' && styles.typeTabActive]}
            onPress={() => setSelectedType('all')}
          >
            <Text style={[styles.typeTabText, selectedType === 'all' && styles.typeTabTextActive]}>{t('all', 'All')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeTab, selectedType === 'morning' && styles.typeTabActive]}
            onPress={() => setSelectedType('morning')}
          >
            <Text style={[styles.typeTabText, selectedType === 'morning' && styles.typeTabTextActive]}>{t('morning', 'Morning')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeTab, selectedType === 'verification' && styles.typeTabActive]}
            onPress={() => setSelectedType('verification')}
          >
            <Text style={[styles.typeTabText, selectedType === 'verification' && styles.typeTabTextActive]}>{t('verificationTab', 'Verif')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) setSelectedDate(date);
          }}
        />
      )}

      <ScrollView 
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredAttendance.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F8FAFC' }]}>
              <Feather name="calendar" size={64} color={isDark ? '#0284C7' : '#CBD5E1'} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>{t('noRecordsFound', 'No Records Found')}</Text>
            <Text style={[styles.emptyDesc, { color: subtextColor }]}>{t('attendanceRecordsWillAppear', 'Attendance records for this student will appear here once updated by the school.')}</Text>
          </View>
        ) : (
          <View>
            {filteredAttendance.map((item) => (
              <View key={item.id} style={[styles.recordCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={[
                    styles.statusIconBg, 
                    { backgroundColor: item.status === 'present' ? '#D1FAE5' : item.status === 'absent' ? '#FEE2E2' : '#FEF3C7' }
                  ]}>
                    <Feather 
                      name={item.status === 'present' ? "check" : item.status === 'absent' ? "x" : "clock"} 
                      size={24} 
                      color={item.status === 'present' ? '#10B981' : item.status === 'absent' ? '#EF4444' : '#F59E0B'} 
                    />
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={[styles.recordDate, { color: textColor }]}>
                      {new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Text style={[styles.recordStatus, { 
                        color: item.status === 'present' ? '#10B981' : item.status === 'absent' ? '#EF4444' : '#F59E0B'
                      }]}>
                        {t(item.status.toLowerCase() as any, item.status).toUpperCase()}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: subtextColor, marginLeft: 8, textTransform: 'uppercase' }}>
                        • {t(getType(item).toLowerCase() as any, getType(item))}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 15, fontWeight: '600' },
  flex1: { flex: 1 },
  headerWrapper: { zIndex: 10 },
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: 25, paddingHorizontal: 25, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  menuButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  emptyCard: { borderRadius: 40, padding: 40, justifyContent: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2, marginTop: 30, alignItems: 'center' },
  emptyIconBg: { padding: 24, borderRadius: 30, marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptyDesc: { fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  recordCard: { borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2, flexDirection: 'row', alignItems: 'center' },
  statusIconBg: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  recordInfo: { marginLeft: 15, flex: 1 },
  recordDate: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  recordStatus: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  filterButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  filterText: { fontSize: 13, fontWeight: '800', marginLeft: 8 },
  typeTab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  typeTabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  typeTabText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  typeTabTextActive: { color: '#0284C7' },
});

export default AttendanceScreen;
