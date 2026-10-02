import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  StatusBar, 
  StyleSheet, 
  TextInput,
  Alert,
  TouchableOpacity,
  Platform
} from 'react-native';
import { useStudent } from '../hooks/useStudent';
import { getStudentLeaveRequests, submitLeaveRequest, LeaveRequest } from '../services/leaveRequests';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const LeaveRequestItem = ({ request, cardColor, borderColor, textColor, subtextColor, styles }: any) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'disapproved': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'disapproved': return 'Declined';
      default: return 'Pending';
    }
  };

  return (
    <View style={[styles.requestCard, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.requestHeader}>
        <View style={styles.dateContainer}>
          <Feather name="calendar" size={16} color="#0284C7" />
          <Text style={[styles.requestDate, { color: textColor }]}>
            {new Date(request.start_date).toLocaleDateString()}
            {request.end_date ? ` - ${new Date(request.end_date).toLocaleDateString()}` : ''}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
            {getStatusText(request.status)}
          </Text>
        </View>
      </View>
      <Text style={[styles.requestReason, { color: subtextColor }]}>
        {request.reason}
      </Text>
    </View>
  );
};

const LeaveRequestsScreen = () => {
  const navigation = useNavigation();
  const { selectedStudent } = useStudent();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [durationType, setDurationType] = useState<'1' | '2_or_more'>('1');
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [showFilterDatePicker, setShowFilterDatePicker] = useState<'start' | 'end' | null>(null);

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(req => (req.reason || '').toLowerCase().includes(q));
    }
    if (filterStartDate) {
      filtered = filtered.filter(req => new Date(req.start_date) >= filterStartDate);
    }
    if (filterEndDate) {
      filtered = filtered.filter(req => new Date(req.start_date) <= filterEndDate);
    }
    return filtered;
  }, [requests, searchQuery, filterStartDate, filterEndDate]);

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const inputBg = isDark ? '#334155' : '#F1F5F9';

  const loadRequests = async () => {
    if (selectedStudent) {
      setLoading(true);
      const data = await getStudentLeaveRequests(selectedStudent.id);
      setRequests(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [selectedStudent]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please enter a reason for the leave.');
      return;
    }
    if (!selectedStudent) return;

    if (durationType === '2_or_more' && endDate < startDate) {
      Alert.alert('Error', 'End date cannot be before start date.');
      return;
    }

    setSubmitting(true);
    const result = await submitLeaveRequest(
      selectedStudent.id, 
      selectedStudent.school_id, 
      reason.trim(),
      durationType,
      startDate.toISOString().split('T')[0],
      durationType === '2_or_more' ? endDate.toISOString().split('T')[0] : null
    );
    setSubmitting(false);

    if (result.success) {
      Alert.alert('Success', 'Your leave request has been submitted.');
      setReason('');
      loadRequests();
    } else {
      Alert.alert('Submission Failed', result.error || 'An error occurred.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={[styles.loadingText, { color: subtextColor }]}>Loading Requests...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.headerWrapper, { backgroundColor: headerBg }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#ffffff', '#F8FAFC']}
          style={[styles.headerGradient, { borderBottomColor: borderColor }]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color={textColor} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: textColor }]}>Leave Requests</Text>
              <Text style={[styles.headerSubtitle, { color: subtextColor }]}>Apply for student leave</Text>
            </View>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Feather name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.formCard, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.formTitle, { color: textColor }]}>New Leave Request</Text>
          
          <Text style={[styles.label, { color: textColor }]}>Duration</Text>
          <View style={styles.durationSelector}>
            <TouchableOpacity 
              style={[styles.durationOption, durationType === '1' && styles.durationOptionActive, { borderColor }]}
              onPress={() => setDurationType('1')}
            >
              <Text style={[styles.durationText, durationType === '1' ? styles.durationTextActive : { color: textColor }]}>1 Day</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.durationOption, durationType === '2_or_more' && styles.durationOptionActive, { borderColor }]}
              onPress={() => setDurationType('2_or_more')}
            >
              <Text style={[styles.durationText, durationType === '2_or_more' ? styles.durationTextActive : { color: textColor }]}>2 or more Days</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: textColor }]}>Date(s)</Text>
          <View style={styles.datePickerContainer}>
            <TouchableOpacity 
              style={[styles.dateButton, { backgroundColor: inputBg, borderColor }]} 
              onPress={() => setShowStartPicker(true)}
            >
              <Feather name="calendar" size={18} color={subtextColor} />
              <Text style={[styles.dateButtonText, { color: textColor }]}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            
            {durationType === '2_or_more' && (
              <>
                <Text style={[styles.dateSeparator, { color: subtextColor }]}>to</Text>
                <TouchableOpacity 
                  style={[styles.dateButton, { backgroundColor: inputBg, borderColor }]} 
                  onPress={() => setShowEndPicker(true)}
                >
                  <Feather name="calendar" size={18} color={subtextColor} />
                  <Text style={[styles.dateButtonText, { color: textColor }]}>{endDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (date) setStartDate(date);
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(event, date) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (date) setEndDate(date);
              }}
            />
          )}
          
          <Text style={[styles.label, { color: textColor }]}>Reason</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder="Why is the leave required?"
            placeholderTextColor={subtextColor}
            multiline
            numberOfLines={3}
            value={reason}
            onChangeText={setReason}
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Feather name="send" size={18} color="#FFF" style={styles.submitIcon} />
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>Past Requests</Text>

        <View style={styles.filtersContainer}>
          <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor }]}>
            <Feather name="search" size={18} color={subtextColor} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search requests..."
              placeholderTextColor={subtextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={18} color={subtextColor} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rowFilters}>
            <TouchableOpacity 
              style={[styles.filterBtn, { backgroundColor: filterStartDate ? '#0284c7' : inputBg, borderColor }]} 
              onPress={() => setShowFilterDatePicker('start')}
            >
              <Feather name="calendar" size={14} color={filterStartDate ? '#fff' : subtextColor} />
              <Text style={{ color: filterStartDate ? '#fff' : textColor, fontSize: 12 }}>
                {filterStartDate ? filterStartDate.toLocaleDateString() : 'Start Date'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterBtn, { backgroundColor: filterEndDate ? '#0284c7' : inputBg, borderColor }]} 
              onPress={() => setShowFilterDatePicker('end')}
            >
              <Feather name="calendar" size={14} color={filterEndDate ? '#fff' : subtextColor} />
              <Text style={{ color: filterEndDate ? '#fff' : textColor, fontSize: 12 }}>
                {filterEndDate ? filterEndDate.toLocaleDateString() : 'End Date'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {(filterStartDate || filterEndDate) && (
            <TouchableOpacity 
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
              onPress={() => { setFilterStartDate(null); setFilterEndDate(null); }}
            >
              <Text style={{ color: '#0284c7', fontSize: 12, fontWeight: 'bold' }}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {showFilterDatePicker && (
          <DateTimePicker
            value={(showFilterDatePicker === 'start' ? filterStartDate : filterEndDate) || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              const currentMode = showFilterDatePicker;
              setShowFilterDatePicker(Platform.OS === 'ios' ? currentMode : null);
              if (date) {
                if (currentMode === 'start') setFilterStartDate(date);
                else if (currentMode === 'end') setFilterEndDate(date);
              }
            }}
          />
        )}

        {filteredRequests.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F8FAFC' }]}>
              <Feather name="inbox" size={48} color={isDark ? '#0284C7' : '#CBD5E1'} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Leave Requests</Text>
            <Text style={[styles.emptyDesc, { color: subtextColor }]}>
              {requests.length === 0 ? "You haven't submitted any leave requests yet." : "No requests match your filters."}
            </Text>
          </View>
        ) : (
          filteredRequests.map((req) => (
            <LeaveRequestItem
              key={req.id}
              request={req}
              cardColor={cardColor}
              borderColor={borderColor}
              textColor={textColor}
              subtextColor={subtextColor}
              styles={styles}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, fontWeight: '500' },
  headerWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  formCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  durationSelector: { flexDirection: 'row', marginBottom: 16 },
  durationOption: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderRadius: 8, marginRight: 8 },
  durationOptionActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  durationText: { fontSize: 14, fontWeight: '600' },
  durationTextActive: { color: '#FFF' },
  datePickerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dateButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, borderWidth: 1 },
  dateButtonText: { marginLeft: 8, fontSize: 14, fontWeight: '500' },
  dateSeparator: { marginHorizontal: 12, fontSize: 14, fontWeight: '500' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitIcon: { marginRight: 8 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, marginLeft: 4 },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  requestCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  requestDate: { fontSize: 14, fontWeight: '600', marginLeft: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  requestReason: { fontSize: 15, lineHeight: 22 },
  filtersContainer: { marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  rowFilters: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 12, borderWidth: 1, gap: 6, paddingHorizontal: 4 },
});

export default LeaveRequestsScreen;
