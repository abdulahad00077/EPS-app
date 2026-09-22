import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Platform, Linking, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useStudent } from '../hooks/useStudent';
import { useTheme } from '../contexts/ThemeContext';
import { TransportLog, TransportException } from '../types';
import { getLatestTransportLog, subscribeToTransportLogs, getStudentTransportInfo, getStudentTransportLogsByDate, getStudentTransportException, logTransportException, removeTransportException } from '../services/transport';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';
import { LinearGradient } from 'expo-linear-gradient';

const TransportScreen = () => {
  const { isDark } = useTheme();
  const { selectedStudent } = useStudent();
  const navigation = useNavigation();
  const [log, setLog] = useState<TransportLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dateLogs, setDateLogs] = useState<TransportLog[]>([]);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [exception, setException] = useState<TransportException | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [absentReason, setAbsentReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();
  
  const transSelectedName = useTransliteration(selectedStudent?.name);
  const transDriverName = useTransliteration(driverInfo?.transport_drivers?.driver_name);
  const transVehicleName = useTransliteration(driverInfo?.transport_drivers?.vehicle_name);
  const transPickup = useTransliteration(driverInfo?.transport_routes?.pickup_location);
  const transDrop = useTransliteration(driverInfo?.transport_routes?.drop_location);

  const bgColor = isDark ? '#020817' : '#F8FAFC';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  const fetchData = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateStr === todayStr;

    const info = await getStudentTransportInfo(selectedStudent.id);
    setDriverInfo(info);

    const logs = await getStudentTransportLogsByDate(selectedStudent.id, dateStr);
    setDateLogs(logs);
    
    const excep = await getStudentTransportException(selectedStudent.id, dateStr);
    setException(excep);
    
    if (isToday) {
       const latestLog = await getLatestTransportLog(selectedStudent.id);
       if (latestLog) setLog(latestLog);
    } else {
       setLog(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    let subscription: any;

    fetchData();

    const dateStr = selectedDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedStudent && dateStr === todayStr) {
      subscription = subscribeToTransportLogs(selectedStudent.id, (newLog) => {
        setLog(newLog);
        setDateLogs(prev => [...prev, newLog]);
      });
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [selectedStudent, selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'picked_up': return '#0284C7';
      case 'reached_school': return '#10B981';
      case 'dropped': return '#8B5CF6';
      default: return '#F59E0B'; // waiting
    }
  };

  const getStatusText = (status: string | undefined) => {
    switch (status) {
      case 'picked_up': return t('pickedUp', 'Picked Up');
      case 'reached_school': return t('reachedSchool', 'Reached School');
      case 'dropped': return t('safelyDropped', 'Safely Dropped');
      default: return t('waitingNotStarted', 'Waiting / Not Started');
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'picked_up': return 'bus';
      case 'reached_school': return 'school';
      case 'dropped': return 'home';
      default: return 'clock';
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate > new Date()) return;
    setSelectedDate(newDate);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (selectedDate > new Date()) {
        setSelectedDate(new Date());
      } else {
        setSelectedDate(selectedDate);
      }
    }
  };

  const handleAbsentSubmit = async () => {
    if (!selectedStudent) return;
    if (!absentReason.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }
    setIsSubmitting(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const success = await logTransportException(selectedStudent.id, selectedStudent.school_id, dateStr, 'absent', absentReason);
    if (success) {
      setException({ id: 'temp', student_id: selectedStudent.id, school_id: selectedStudent.school_id, date: dateStr, exception_type: 'absent', reason: absentReason });
      setShowReasonModal(false);
    } else {
      Alert.alert('Error', 'Failed to save');
    }
    setIsSubmitting(false);
  };

  const toggleParentDrop = async () => {
    if (!selectedStudent) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    setIsSubmitting(true);
    if (exception?.exception_type === 'parent_drop') {
      const success = await removeTransportException(selectedStudent.id, dateStr, 'parent_drop');
      if (success) setException(null);
    } else {
      const success = await logTransportException(selectedStudent.id, selectedStudent.school_id, dateStr, 'parent_drop');
      if (success) setException({ id: 'temp', student_id: selectedStudent.id, school_id: selectedStudent.school_id, date: dateStr, exception_type: 'parent_drop' });
    }
    setIsSubmitting(false);
  };

  const morningLogs = dateLogs.filter(l => new Date(l.timestamp).getHours() < 14);
  const eveningLogs = dateLogs.filter(l => new Date(l.timestamp).getHours() >= 14);

  const getLogByStatus = (logs: TransportLog[], status: string) => {
    return logs.filter(l => l.status === status).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const renderShiftTimeline = (title: string, logs: TransportLog[]) => {
    const pickedUpLog = getLogByStatus(logs, 'picked_up');
    const droppedLog = getLogByStatus(logs, 'dropped');
    
    return (
      <View style={styles.shiftContainer}>
        <Text style={[styles.shiftTitle, { color: textColor }]}>{title}</Text>
        <View style={styles.timelineRow}>
           <View style={styles.timelinePoint}>
             <View style={[styles.timelineDot, { backgroundColor: pickedUpLog ? '#0284C7' : subtextColor }]} />
             <Text style={[styles.timelineLabel, { color: textColor }]}>{t('pickedUp', 'Picked Up')}</Text>
             <Text style={[styles.timelineTime, { color: subtextColor }]}>
               {pickedUpLog ? new Date(pickedUpLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
             </Text>
           </View>
           <View style={[styles.timelineLine, { backgroundColor: droppedLog ? '#10B981' : subtextColor }]} />
           <View style={styles.timelinePoint}>
             <View style={[styles.timelineDot, { backgroundColor: droppedLog ? '#10B981' : subtextColor }]} />
             <Text style={[styles.timelineLabel, { color: textColor }]}>{t('dropped', 'Dropped')}</Text>
             <Text style={[styles.timelineTime, { color: subtextColor }]}>
               {droppedLog ? new Date(droppedLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
             </Text>
           </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textColor} />
        }
      >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={[styles.title, { color: textColor }]}>{t('transportStatus', 'Transport Status')}</Text>
              <Text style={[styles.subtitle, { color: subtextColor }]}>{t('activityTimelineFor', 'Activity timeline for')} {transSelectedName}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ padding: 8 }}>
              <Feather name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateSelectorContainer}>
            <Feather name="calendar" size={20} color={textColor} style={{ marginRight: 8 }} />
            <Text style={[styles.dateText, { color: textColor }]}>
              {selectedDate.toDateString() === new Date().toDateString() ? t('today', 'Today') : selectedDate.toLocaleDateString()}
            </Text>
            <Feather name="chevron-down" size={20} color={subtextColor} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate}
            mode="date"
            is24Hour={true}
            maximumDate={new Date()}
            display="default"
            onChange={onDateChange}
          />
        )}

        {selectedDate.toDateString() === new Date().toDateString() && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: exception?.exception_type === 'absent' ? '#EF4444' : cardColor, borderColor: exception?.exception_type === 'absent' ? '#EF4444' : borderColor }]}
              onPress={() => setShowReasonModal(true)}
              disabled={exception?.exception_type === 'absent' || isSubmitting}
            >
              <Feather name="x-circle" size={18} color={exception?.exception_type === 'absent' ? '#FFF' : '#EF4444'} />
              <Text style={[styles.actionBtnText, { color: exception?.exception_type === 'absent' ? '#FFF' : '#EF4444' }]}>{exception?.exception_type === 'absent' ? 'On Leave' : 'Not Coming Today'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: exception?.exception_type === 'parent_drop' ? '#F59E0B' : cardColor, borderColor: exception?.exception_type === 'parent_drop' ? '#F59E0B' : borderColor }]}
              onPress={toggleParentDrop}
              disabled={exception?.exception_type === 'absent' || isSubmitting}
            >
              <Feather name="user-check" size={18} color={exception?.exception_type === 'parent_drop' ? '#FFF' : '#F59E0B'} />
              <Text style={[styles.actionBtnText, { color: exception?.exception_type === 'parent_drop' ? '#FFF' : '#F59E0B' }]}>{exception?.exception_type === 'parent_drop' ? 'I Will Drop (Undo)' : 'I Will Drop'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedDate.toDateString() === new Date().toDateString() && log && (
          <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: textColor }]}>{t('currentStatus', 'Current Status')}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusColor(log?.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(log?.status) }]}>
                  {getStatusText(log?.status)}
                </Text>
              </View>
            </View>

            <View style={styles.statusDisplay}>
              <MaterialCommunityIcons 
                name={getStatusIcon(log?.status)} 
                size={64} 
                color={getStatusColor(log?.status)} 
              />
              {log?.timestamp && (
                <Text style={[styles.timeText, { color: textColor }]}>
                  {t('updatedAt', 'Updated at')} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: cardColor, borderColor, marginTop: 16 }]}>
          <Text style={[styles.cardTitle, { color: textColor, marginBottom: 16 }]}>{t('activityTimeline', 'Activity Timeline')}</Text>
          {renderShiftTimeline(t('morningShift', 'Morning Shift'), morningLogs)}
          <View style={styles.divider} />
          {renderShiftTimeline(t('eveningShift', 'Evening Shift'), eveningLogs)}
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, borderColor, marginTop: 16 }]}>
          <Text style={[styles.cardTitle, { color: textColor, marginBottom: 16 }]}>{t('vehicleInfo', 'Vehicle Info')}</Text>
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={20} color={subtextColor} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: subtextColor }]}>{t('pickupDropLocation', 'Pickup / Drop Location')}</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {(transPickup || driverInfo?.transport_routes?.pickup_location) || t('notAssigned', 'Not Assigned')} - {(transDrop || driverInfo?.transport_routes?.drop_location) || t('notAssigned', 'Not Assigned')}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Feather name="hash" size={20} color={subtextColor} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: subtextColor }]}>{t('vehicle', 'Vehicle')}</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {transVehicleName || 'N/A'} • {driverInfo?.transport_drivers?.vehicle_number || 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Feather name="user" size={20} color={subtextColor} />
            <View style={[styles.infoTextContainer, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: subtextColor }]}>{t('driver', 'Driver')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Text style={[styles.infoValue, { color: textColor, marginTop: 0, marginRight: 8 }]}>{transDriverName || driverInfo?.transport_drivers?.driver_name || t('assignedDriver', 'Assigned Driver')}</Text>
                  {driverInfo?.transport_drivers?.mobile_number && (
                    <TouchableOpacity 
                      onPress={() => Linking.openURL(`tel:${driverInfo.transport_drivers.mobile_number}`)}
                      style={{ backgroundColor: '#10B98120', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Feather name="phone" size={12} color="#10B981" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 12 }}>{t('call', 'Call')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Reason Modal for "Not Coming Today" */}
      <Modal
        visible={showReasonModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReasonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor, borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Reason for leave</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: bgColor, color: textColor, borderColor }]}
              placeholder="E.g., Sick today"
              placeholderTextColor={subtextColor}
              value={absentReason}
              onChangeText={setAbsentReason}
              multiline
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setShowReasonModal(false)}>
                <Text style={{ color: subtextColor, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnPrimary, { opacity: isSubmitting ? 0.7 : 1 }]} 
                onPress={handleAbsentSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.modalBtnText}>{isSubmitting ? 'Saving...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
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
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  dateBtn: {
    padding: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  shiftContainer: {
    marginBottom: 8,
  },
  shiftTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  timelinePoint: {
    alignItems: 'center',
    width: 80,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    marginBottom: 28, // to align with dots above text
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineTime: {
    fontSize: 12,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timeText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  modalBtnPrimary: {
    backgroundColor: '#EF4444',
  },
  modalBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default TransportScreen;
