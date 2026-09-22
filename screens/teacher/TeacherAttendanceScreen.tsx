import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import CustomDropdown from '../../components/CustomDropdown';
import { useTeacherFilter } from '../../contexts/TeacherFilterContext';

export default function TeacherAttendanceScreen() {
  const { teacher, user } = useAuth();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [attendanceType, setAttendanceType] = useState<'morning' | 'verification'>('morning');
  const [isSaving, setIsSaving] = useState(false);

  const { data: students, loading: loadingStudents } = useRealtimeData<any>('students', teacher?.school_id, { column: 'name', ascending: true });
  const { data: allAttendance, loading: loadingAttendance } = useRealtimeData<any>('attendance_records', teacher?.school_id);

  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const { selectedClass, selectedSection } = useTeacherFilter();

  const myStudents = students?.filter(s => {
    if (selectedClass && s.class !== selectedClass) return false;
    if (selectedSection && s.section !== selectedSection) return false;
    return true;
  }) || [];

  useEffect(() => {
    if (!allAttendance || !myStudents.length) {
      setAttendanceData(myStudents.map(s => ({ ...s, status: null })));
      return;
    }
    
    const filteredRecords = allAttendance.filter((record: any) => record.date === selectedDate && record.attendance_type === attendanceType);
    const attendanceMap = new Map();
    filteredRecords.forEach((r: any) => attendanceMap.set(r.student_id, r.status));
    
    const merged = myStudents.map(s => ({
      ...s,
      status: attendanceMap.get(s.id) || null
    }));
    
    setAttendanceData(merged);
  }, [allAttendance, students, selectedDate, attendanceType, selectedClass, selectedSection]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => prev.map(a => a.id === studentId ? { ...a, status } : a));
  };

  const markAllPresent = () => {
    setAttendanceData(prev => prev.map(a => ({ ...a, status: 'present' })));
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    try {
      const recordsToSave = attendanceData.filter(a => a.status).map(a => ({
        school_id: teacher?.school_id,
        student_id: a.id,
        date: selectedDate,
        attendance_type: attendanceType,
        status: a.status,
        marked_by: teacher?.id
      }));

      for (const record of recordsToSave) {
        const { error } = await supabase
          .from('attendance_records')
          .upsert(record, { onConflict: 'school_id,student_id,date,attendance_type' });
          
        if (error && error.code !== '23505') {
           const { data: existing, error: selectError } = await supabase.from('attendance_records')
              .select('id')
              .eq('student_id', record.student_id)
              .eq('date', record.date)
              .eq('attendance_type', record.attendance_type)
              .single();
              
           if (existing) {
             const { error: updateError } = await supabase.from('attendance_records').update({ status: record.status }).eq('id', existing.id);
             if (updateError) throw updateError;
           } else {
             const { error: insertError } = await supabase.from('attendance_records').insert(record);
             if (insertError) throw insertError;
           }
        } else if (error) {
           throw error; // Throw if code is 23505 as well! We shouldn't silently fail unique constraint violations.
        }
      }
      Alert.alert('Success', 'Attendance saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.studentDetails, { color: colors.textSecondary }]}>Roll: {item.roll_number || 'N/A'}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          onPress={() => handleStatusChange(item.id, 'present')}
          style={[styles.statusBtn, item.status === 'present' ? { backgroundColor: '#10b981' } : { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
        >
          <Text style={{ color: item.status === 'present' ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: 'bold' }}>P</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleStatusChange(item.id, 'absent')}
          style={[styles.statusBtn, item.status === 'absent' ? { backgroundColor: '#ef4444' } : { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
        >
          <Text style={{ color: item.status === 'absent' ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: 'bold' }}>A</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleStatusChange(item.id, 'late')}
          style={[styles.statusBtn, item.status === 'late' ? { backgroundColor: '#f59e0b' } : { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
        >
          <Text style={{ color: item.status === 'late' ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: 'bold' }}>L</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      
      {/* Filters Area */}
      <View style={styles.filtersContainer}>

        {/* Toggle Morning / Verification */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.toggleBtn, attendanceType === 'morning' && { backgroundColor: colors.primary }]}
            onPress={() => setAttendanceType('morning')}
          >
            <Text style={[styles.toggleText, attendanceType === 'morning' ? { color: '#fff' } : { color: colors.textSecondary }]}>Morning</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, attendanceType === 'verification' && { backgroundColor: colors.primary }]}
            onPress={() => setAttendanceType('verification')}
          >
            <Text style={[styles.toggleText, attendanceType === 'verification' ? { color: '#fff' } : { color: colors.textSecondary }]}>Verification</Text>
          </TouchableOpacity>
        </View>

        {/* Date Selector and Records */}
        <View style={styles.dateSelectorRow}>
          <View style={styles.dateSelector}>
            <TouchableOpacity onPress={() => changeDate(-1)} style={[styles.dateNavBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </TouchableOpacity>
            
            <View style={[styles.dateDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="calendar" size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.dateText, { color: colors.text }]}>{selectedDate}</Text>
            </View>

            <TouchableOpacity onPress={() => changeDate(1)} style={[styles.dateNavBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.recordsBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('TeacherAttendanceRecords', { date: selectedDate, type: attendanceType })}
          >
            <Ionicons name="list" size={18} color="#fff" />
            <Text style={styles.recordsText}>Records</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={markAllPresent} style={styles.markAllBtn}>
          <Ionicons name="checkmark-done" size={18} color="#10b981" />
          <Text style={styles.markAllText}>Mark All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={saveAttendance} disabled={isSaving} style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}>
          {isSaving ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {(loadingStudents || loadingAttendance) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={attendanceData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No students found for your class.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, gap: 15 },
  toggleContainer: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  toggleText: { fontWeight: '600', fontSize: 14 },
  dateSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flex: 1 },
  dateNavBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateDisplay: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  dateText: { fontSize: 14, fontWeight: '600' },
  recordsBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginLeft: 10 },
  recordsText: { color: '#fff', fontWeight: 'bold', marginLeft: 5, fontSize: 13 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#a7f3d0' },
  markAllText: { color: '#10b981', fontWeight: 'bold', marginLeft: 5 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  listContent: { padding: 20, paddingTop: 10 },
  studentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  studentDetails: { fontSize: 13 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  statusBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }
});
