import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Dimensions, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Student, TransportException } from '../types';
import { getDriverAssignedStudents, logTransportAction, getTodayTransportLogs, getTransportExceptionsByDate } from '../services/transport';
import StudentTransportCard from '../components/StudentTransportCard';
import { transliterateToHindi } from '../services/transliteration';

const { width } = Dimensions.get('window');

const DriverDashboardScreen = () => {
  const { driver } = useAuth();
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, pickedUp: 0, dropped: 0 });
  const [studentStatuses, setStudentStatuses] = useState<Record<string, { pickedUp: boolean, dropped: boolean }>>({});
  const [exceptions, setExceptions] = useState<Record<string, TransportException>>({});
  const [displayVehicleName, setDisplayVehicleName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentHour = new Date().getHours();
  const [shift, setShift] = useState<'morning' | 'evening'>(currentHour < 12 ? 'morning' : 'evening');

  const bgColor = isDark ? '#020817' : '#F8FAFC';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';

  const fetchData = useCallback(async () => {
    if (!driver) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const assignedStudents = await getDriverAssignedStudents(driver.id, driver.school_id, driver.route_id);
      setStudents(assignedStudents);

      // Fetch ALL logs for the school today
      const dateStr = selectedDate.toISOString().split('T')[0];
      const todayLogs = await getTodayTransportLogs(driver.school_id, selectedDate);
      
      const dayExceptions = await getTransportExceptionsByDate(driver.school_id, dateStr);
      const exceptionsMap: Record<string, TransportException> = {};
      dayExceptions.forEach(e => exceptionsMap[e.student_id] = e);
      setExceptions(exceptionsMap);

      // Map to get latest log per student
      const latestLogsByStudent: Record<string, any> = {};
      for (const log of todayLogs) {
        const logHour = new Date(log.timestamp).getHours();
        const isLogMorning = logHour < 14; // Before 2 PM is morning shift
        if ((shift === 'morning' && !isLogMorning) || (shift === 'evening' && isLogMorning)) {
          continue;
        }

        if (!latestLogsByStudent[log.student_id]) {
           latestLogsByStudent[log.student_id] = log; // Because it's ordered by timestamp DESC
        }
      }

      // Fetch statuses
      let pickedUpCount = 0;
      let droppedCount = 0;
      const newStatuses: Record<string, { pickedUp: boolean, dropped: boolean }> = {};

      for (const student of assignedStudents) {
        const log = latestLogsByStudent[student.id];
        let pickedUp = false;
        let dropped = false;

        if (log) {
          if (log.status === 'picked_up' || log.status === 'reached_school' || log.status === 'dropped') pickedUp = true;
          if (log.status === 'dropped') dropped = true;
        }

        if (pickedUp) pickedUpCount++;
        if (dropped) droppedCount++;

        newStatuses[student.id] = { pickedUp, dropped };
      }

      setStats({ total: assignedStudents.length, pickedUp: pickedUpCount, dropped: droppedCount });
      setStudentStatuses(newStatuses);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driver, shift, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!driver?.vehicle_name) return;
    if (language === 'hi') {
      transliterateToHindi(driver.vehicle_name).then(setDisplayVehicleName);
    } else {
      setDisplayVehicleName(driver.vehicle_name);
    }
  }, [driver?.vehicle_name, language]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePickupConfirmed = async (student: Student) => {
    if (!driver) return;
    
    // Optimistic UI update
    setStats(prev => ({ ...prev, pickedUp: prev.pickedUp + 1 }));
    setStudentStatuses(prev => ({
      ...prev,
      [student.id]: { ...prev[student.id], pickedUp: true }
    }));

    await logTransportAction({
      id: Math.random().toString(36).substr(2, 9),
      student_id: student.id,
      driver_id: driver.id,
      school_id: driver.school_id,
      type: 'pickup',
      status: 'picked_up',
      timestamp: new Date().toISOString(),
      student_name: student.name,
    });
  };

  const handleDropConfirmed = async (student: Student) => {
    if (!driver) return;
    
    // Optimistic UI update
    setStats(prev => ({ ...prev, dropped: prev.dropped + 1 }));
    setStudentStatuses(prev => ({
      ...prev,
      [student.id]: { ...prev[student.id], dropped: true }
    }));

    await logTransportAction({
      id: Math.random().toString(36).substr(2, 9),
      student_id: student.id,
      driver_id: driver.id,
      school_id: driver.school_id,
      type: 'drop',
      status: 'dropped',
      timestamp: new Date().toISOString(),
      student_name: student.name,
    });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: textColor }]}>
            {selectedDate.toDateString() === new Date().toDateString() ? t('todaysRoute', "Today's Route") : selectedDate.toLocaleDateString()}
          </Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            {displayVehicleName || driver?.vehicle_name} • {driver?.vehicle_number}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ padding: 8 }}>
          <Feather name="calendar" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) {
              setSelectedDate(date);
            }
          }}
        />
      )}

      <View style={styles.switcherContainer}>
        <TouchableOpacity 
          style={[styles.switcherButton, { backgroundColor: cardBg, borderColor: isDark ? '#334155' : '#E2E8F0' }, shift === 'morning' && { backgroundColor: '#0284C7', borderColor: '#0284C7' }]} 
          onPress={() => setShift('morning')}
        >
          <Feather name="sunrise" size={16} color={shift === 'morning' ? '#FFF' : subtextColor} />
          <Text style={[styles.switcherText, { color: shift === 'morning' ? '#FFF' : subtextColor }]}>{t('morning', 'Morning')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.switcherButton, { backgroundColor: cardBg, borderColor: isDark ? '#334155' : '#E2E8F0' }, shift === 'evening' && { backgroundColor: '#0284C7', borderColor: '#0284C7' }]} 
          onPress={() => setShift('evening')}
        >
          <Feather name="sunset" size={16} color={shift === 'evening' ? '#FFF' : subtextColor} />
          <Text style={[styles.switcherText, { color: shift === 'evening' ? '#FFF' : subtextColor }]}>{t('evening', 'Evening')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: cardBg }]}>
          <Text style={[styles.statNumber, { color: '#0284C7' }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: subtextColor }]}>{t('assigned', 'Assigned')}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: cardBg }]}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.pickedUp}</Text>
          <Text style={[styles.statLabel, { color: subtextColor }]}>{t('pickedUp', 'Picked Up')}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: cardBg }]}>
          <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>{stats.dropped}</Text>
          <Text style={[styles.statLabel, { color: subtextColor }]}>{t('dropped', 'Dropped')}</Text>
        </View>
      </View>

      <FlatList
        data={students}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <StudentTransportCard
            student={item}
            initialPickupState={studentStatuses[item.id]?.pickedUp}
            initialDropState={studentStatuses[item.id]?.dropped}
            exceptionData={exceptions[item.id] || null}
            shift={shift}
            onPickupConfirmed={handlePickupConfirmed}
            onDropConfirmed={handleDropConfirmed}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color={subtextColor} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text style={[styles.emptyText, { color: textColor }]}>{t('noStudentsAssigned', 'No students assigned for today.')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  switcherContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  switcherButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  switcherText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverDashboardScreen;
