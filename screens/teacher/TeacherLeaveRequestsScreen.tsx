import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  Modal
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { getTeacherLeaveRequests, updateLeaveRequestStatus } from '../../services/leaveRequests';

export default function TeacherLeaveRequestsScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'disapproved'>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [teacher]);

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(req => {
        const name = (req.student?.name || '').toLowerCase();
        const roll = (req.student?.roll_number || '').toLowerCase();
        return name.includes(q) || roll.includes(q);
      });
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    if (startDate) {
      filtered = filtered.filter(req => new Date(req.start_date) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(req => new Date(req.start_date) <= endDate);
    }
    return filtered;
  }, [requests, searchQuery, statusFilter, startDate, endDate]);

  const handleDateChange = (event: any, date?: Date) => {
    const currentMode = showDatePicker;
    setShowDatePicker(Platform.OS === 'ios' ? currentMode : null);
    if (date) {
      if (currentMode === 'start') setStartDate(date);
      else if (currentMode === 'end') setEndDate(date);
    }
  };

  const loadRequests = async () => {
    if (teacher?.school_id) {
      setLoading(true);
      const data = await getTeacherLeaveRequests(teacher.school_id);
      
      // Filter requests by teacher's class if they have assigned_class
      const filteredData = teacher.assigned_class ? 
        data.filter(req => req.student?.class === teacher.assigned_class && (teacher.assigned_section ? req.student?.section === teacher.assigned_section : true)) :
        data;
      
      setRequests(filteredData);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'disapproved') => {
    setUpdatingId(id);
    const result = await updateLeaveRequestStatus(id, status);
    setUpdatingId(null);
    
    if (result.success) {
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    } else {
      Alert.alert('Error', result.error || 'Failed to update status');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isPending = item.status === 'pending';
    const isApproved = item.status === 'approved';
    const isDisapproved = item.status === 'disapproved';
    
    return (
      <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.studentName, { color: colors.text }]}>{item.student?.name || 'Unknown Student'}</Text>
            <Text style={[styles.studentInfo, { color: colors.textSecondary }]}>
              Class {item.student?.class} {item.student?.section || ''} | Roll: {item.student?.roll_number || '-'}
            </Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: isApproved ? '#10b98120' : isDisapproved ? '#ef444420' : '#f59e0b20' }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: isApproved ? '#10b981' : isDisapproved ? '#ef4444' : '#f59e0b' }
            ]}>
              {isApproved ? 'Approved' : isDisapproved ? 'Declined' : 'Pending'}
            </Text>
          </View>
        </View>
        
        <View style={[styles.dateContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {new Date(item.start_date).toLocaleDateString()}
            {item.end_date ? ` - ${new Date(item.end_date).toLocaleDateString()}` : ''}
          </Text>
        </View>
        
        <Text style={[styles.reasonText, { color: colors.text }]}>
          {item.reason}
        </Text>
        
        {isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleUpdateStatus(item.id, 'approved')}
              disabled={updatingId === item.id}
            >
              {updatingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnText}>Approve</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleUpdateStatus(item.id, 'disapproved')}
              disabled={updatingId === item.id}
            >
              <Text style={styles.actionBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filtersContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search name or roll number..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.rowFilters}>
          <TouchableOpacity 
            style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={() => setShowStatusDropdown(true)}
          >
            <Text style={{ color: colors.text, fontSize: 12 }}>{statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterBtn, { backgroundColor: startDate ? colors.primary : colors.surface, borderColor: colors.border }]} 
            onPress={() => setShowDatePicker('start')}
          >
            <Ionicons name="calendar" size={14} color={startDate ? '#fff' : colors.textSecondary} />
            <Text style={{ color: startDate ? '#fff' : colors.text, fontSize: 12 }}>
              {startDate ? startDate.toLocaleDateString() : 'Start Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterBtn, { backgroundColor: endDate ? colors.primary : colors.surface, borderColor: colors.border }]} 
            onPress={() => setShowDatePicker('end')}
          >
            <Ionicons name="calendar" size={14} color={endDate ? '#fff' : colors.textSecondary} />
            <Text style={{ color: endDate ? '#fff' : colors.text, fontSize: 12 }}>
              {endDate ? endDate.toLocaleDateString() : 'End Date'}
            </Text>
          </TouchableOpacity>
        </View>

        {(startDate || endDate || statusFilter !== 'all') && (
          <TouchableOpacity 
            style={{ alignSelf: 'flex-end', marginTop: 8 }}
            onPress={() => { setStartDate(null); setEndDate(null); setStatusFilter('all'); }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showStatusDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowStatusDropdown(false)}>
          <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {['all', 'pending', 'approved', 'disapproved'].map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.dropdownItem}
                onPress={() => { setStatusFilter(status as any); setShowStatusDropdown(false); }}
              >
                <Text style={{ color: colors.text, fontWeight: statusFilter === status ? 'bold' : 'normal' }}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={(showDatePicker === 'start' ? startDate : endDate) || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {filteredRequests.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No leave requests found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, marginBottom: 12 },
  icon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  rowFilters: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 36, borderRadius: 8, borderWidth: 1, gap: 4, paddingHorizontal: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  dropdownMenu: { width: 200, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  dropdownItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { marginTop: 12, fontSize: 16, fontWeight: '500' },
  listContainer: { padding: 16 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  studentInfo: { fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  dateText: { fontSize: 13, fontWeight: '600' },
  reasonText: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: { backgroundColor: '#10b981' },
  declineBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
