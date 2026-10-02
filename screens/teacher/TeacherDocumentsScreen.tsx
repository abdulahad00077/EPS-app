import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { getSchoolDocuments, updateDocumentStatus, StudentDocument } from '../../services/documents';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TeacherDocumentsScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [teacher]);

  const loadDocuments = async () => {
    if (teacher?.school_id) {
      setLoading(true);
      const data = await getSchoolDocuments(teacher.school_id);
      
      // Filter by teacher's class if they have assigned_class
      const filteredData = teacher.assigned_class ? 
        data.filter(doc => doc.student?.class === teacher.assigned_class && (teacher.assigned_section ? doc.student?.section === teacher.assigned_section : true)) :
        data;
      
      setDocuments(filteredData);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setUpdatingId(id);
    const result = await updateDocumentStatus(id, status);
    setUpdatingId(null);
    
    if (result.success) {
      setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, status } : doc));
    } else {
      Alert.alert('Error', result.error || 'Failed to update status');
    }
  };

  const renderItem = ({ item }: { item: StudentDocument }) => {
    const isPending = item.status === 'pending';
    const isApproved = item.status === 'approved';
    const isRejected = item.status === 'rejected';
    
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
            { backgroundColor: isApproved ? '#10b98120' : isRejected ? '#ef444420' : '#f59e0b20' }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b' }
            ]}>
              {isApproved ? 'Saved' : isRejected ? 'Rejected' : 'Pending'}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.docTypeText, { color: colors.primary }]}>
          {item.document_type}
        </Text>
        
        <View style={[styles.fileContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
          <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]} numberOfLines={1}>
             Uploaded: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        {isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleUpdateStatus(item.id, 'approved')}
              disabled={updatingId === item.id}
            >
              {updatingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnText}>Save Document</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleUpdateStatus(item.id, 'rejected')}
              disabled={updatingId === item.id}
            >
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const filteredDocuments = documents.filter(doc => {
    const studentName = doc.student?.name?.toLowerCase() || '';
    const docType = doc.document_type?.toLowerCase() || '';
    
    const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || docType.includes(searchQuery.toLowerCase());
    
    let matchesDate = true;
    if (dateFilter) {
      const docDate = new Date(doc.created_at);
      matchesDate = docDate.getFullYear() === dateFilter.getFullYear() && 
                    docDate.getMonth() === dateFilter.getMonth() && 
                    docDate.getDate() === dateFilter.getDate();
    }
    
    return matchesSearch && matchesDate;
  });

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateFilter(selectedDate);
    }
  };

  const clearDateFilter = () => {
    setDateFilter(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ padding: 16, paddingBottom: 0, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: colors.text }}
            placeholder="Search student or doc type..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 8 }}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: dateFilter ? colors.text : colors.textSecondary }}>
              {dateFilter ? dateFilter.toLocaleDateString() : "Filter by date..."}
            </Text>
          </TouchableOpacity>
          {dateFilter && (
            <TouchableOpacity onPress={clearDateFilter} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dateFilter || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {filteredDocuments.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="documents-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No documents found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDocuments}
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
    marginBottom: 8,
  },
  studentName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  studentInfo: { fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  docTypeText: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  dateText: { fontSize: 13, fontWeight: '600', flex: 1 },
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
