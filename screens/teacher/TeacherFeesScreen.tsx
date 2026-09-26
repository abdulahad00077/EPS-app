import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useTeacherFilter } from '../../contexts/TeacherFilterContext';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { supabase } from '../../services/supabase';

export default function TeacherFeesScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { selectedClass, selectedSection } = useTeacherFilter();
  
  // Fetch students in this school
  const { data: students, loading: loadingStudents } = useRealtimeData<any>('students', teacher?.school_id);
  
  const [pendingFees, setPendingFees] = useState<any[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter((s: any) => {
      if (selectedClass && s.class !== selectedClass) return false;
      if (selectedSection && s.section !== selectedSection) return false;
      return true;
    });
  }, [students, selectedClass, selectedSection]);

  const fetchPendingFees = async () => {
    if (!filteredStudents.length) {
      setPendingFees([]);
      return;
    }
    
    setLoadingFees(true);
    const studentIds = filteredStudents.map((s: any) => s.id);
    const results: any[] = [];
    
    // 1. Fetch from old "fees" table
    try {
      const { data: oldFees } = await supabase
        .from('fees')
        .select('*, students!inner(name, admission_number, father_name)')
        .in('student_id', studentIds)
        .order('due_date', { ascending: false });

      if (oldFees) {
        oldFees.forEach(f => {
          if (!['paid', 'PAID', 'CANCELLED'].includes(f.status)) {
            results.push({
              ...f,
              student_name: f.students?.name,
              father_name: f.students?.father_name,
              admission_number: f.students?.admission_number,
              amount: Number(f.amount || 0),
              paid_amount: Number(f.paid_amount || 0),
              description: f.fee_type || 'Fee Due',
            });
          }
        });
      }
    } catch (e) {
      console.log('Old fees table not available', e);
    }

    // 2. Fetch from new "erp_fee_dues" table
    try {
      const { data: erpDues } = await supabase
        .from('erp_fee_dues')
        .select(`
          *,
          erp_fee_heads (name),
          students!inner (name, admission_number, father_name)
        `)
        .in('student_id', studentIds)
        .order('due_date', { ascending: false });

      if (erpDues) {
        erpDues.forEach(due => {
          if (!['paid', 'PAID', 'CANCELLED'].includes(due.status)) {
            const headName = due.erp_fee_heads?.name || 'Fee';
            results.push({
              id: due.id,
              student_id: due.student_id,
              amount: Number(due.net_payable || due.amount || 0),
              paid_amount: Number(due.paid_amount || 0),
              due_date: due.due_date,
              status: due.status,
              description: due.academic_year ? `${headName} - Session ${due.academic_year}` : headName,
              student_name: due.students?.name,
              father_name: due.students?.father_name,
              admission_number: due.students?.admission_number,
            });
          }
        });
      }
    } catch (e) {
      console.log('ERP fee dues not available', e);
    }

    setPendingFees(results);
    setLoadingFees(false);
  };

  useEffect(() => {
    fetchPendingFees();
  }, [filteredStudents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingFees();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'overdue') return '#ef4444';
    if (s === 'partial') return '#f59e0b';
    return '#f59e0b'; // Default pending color
  };

  const searchedFees = useMemo(() => {
    if (!searchQuery) return pendingFees;
    const q = searchQuery.toLowerCase();
    return pendingFees.filter(f => 
      (f.student_name && f.student_name.toLowerCase().includes(q)) ||
      (f.father_name && f.father_name.toLowerCase().includes(q))
    );
  }, [pendingFees, searchQuery]);

  const totalPendingAmount = useMemo(() => {
    return searchedFees.reduce((sum, fee) => sum + (fee.amount - fee.paid_amount), 0);
  }, [searchedFees]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      
      <View style={[styles.filterBanner, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderBottomColor: colors.border }]}>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {selectedClass ? `Class ${selectedClass} ${selectedSection || ''}` : 'All Assigned Students'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search students..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.primary, marginHorizontal: 16, marginTop: 16, borderRadius: 16 }]}>
        <Text style={styles.summaryLabel}>Total Pending Amount</Text>
        <Text style={styles.summaryValue}>₹ {totalPendingAmount.toLocaleString()}</Text>
      </View>

      {loadingStudents || loadingFees ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={searchedFees}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.studentName, { color: colors.text }]}>{item.student_name}</Text>
              </View>
              <Text style={[styles.fatherName, { color: colors.textSecondary }]}>S/D of: {item.father_name || 'N/A'}</Text>
              
              <View style={styles.feeDetails}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.feeDesc, { color: colors.text }]}>{item.description}</Text>
                  <Text style={[styles.feeDate, { color: colors.textSecondary }]}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.feeAmount, { color: getStatusColor(item.status) }]}>
                    ₹ {(item.amount - item.paid_amount).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.border} style={{ marginBottom: 10 }} />
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>No pending fees for this class.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterBanner: { 
    padding: 12, 
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center'
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500'
  },
  searchContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 16 
  },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    height: 48, 
    borderRadius: 12, 
    borderWidth: 1, 
    gap: 8 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16 
  },
  summaryCard: {
    padding: 20,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#ffffff',
    opacity: 0.9,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: { padding: 16 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  studentName: { fontSize: 18, fontWeight: '700' },
  fatherName: { fontSize: 13, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 10 },
  feeDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeDesc: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  feeDate: { fontSize: 12 },
  feeAmount: { fontSize: 18, fontWeight: 'bold' },
  feeStatus: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }
});
