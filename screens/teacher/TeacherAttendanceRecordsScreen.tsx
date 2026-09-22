import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { useAuth } from '../../hooks/useAuth';
import { useTeacherFilter } from '../../contexts/TeacherFilterContext';

export default function TeacherAttendanceRecordsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { teacher } = useAuth();
  const { selectedClass, selectedSection } = useTeacherFilter();
  
  const { date, type } = route.params || {};

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { data: students } = useRealtimeData<any>('students', teacher?.school_id);

  useEffect(() => {
    navigation.setOptions({
      title: type === 'verification' ? 'Verification Records' : 'Morning Records'
    });
    fetchRecords();
  }, [date, type, navigation]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('school_id', teacher?.school_id)
        .eq('date', date)
        .eq('attendance_type', type);

      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (recordId: string, status: string) => {
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, status } : r));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      for (const record of records) {
        await supabase
          .from('attendance_records')
          .update({ status: record.status })
          .eq('id', record.id);
      }
      Alert.alert('Success', 'Attendance records updated!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Merge student names into records
  const displayData = records.filter(record => {
    const student = students?.find((s: any) => s.id === record.student_id);
    if (!student) return false;
    if (selectedClass && student.class !== selectedClass) return false;
    if (selectedSection && student.section !== selectedSection) return false;
    return true;
  }).map(record => {
    const student = students?.find((s: any) => s.id === record.student_id);
    return {
      ...record,
      studentName: student?.name || 'Unknown Student',
      rollNumber: student?.roll_number || 'N/A'
    };
  }).sort((a, b) => a.studentName.localeCompare(b.studentName));

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.text }]}>{item.studentName}</Text>
        <Text style={[styles.studentDetails, { color: colors.textSecondary }]}>Roll: {item.rollNumber}</Text>
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
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No records found for this date.</Text>
            </View>
          )}
        />
      )}
      
      {/* Floating Save Button */}
      {!loading && displayData.length > 0 && (
        <View style={styles.bottomToolbar}>
          <TouchableOpacity onPress={saveChanges} disabled={isSaving} style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}>
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bottomToolbar: { padding: 20, borderTopWidth: 1, backgroundColor: 'transparent' },
  saveBtn: { backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listContent: { padding: 20 },
  studentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  studentDetails: { fontSize: 13 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  statusBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }
});
