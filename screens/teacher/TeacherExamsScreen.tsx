import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import CustomDropdown from '../../components/CustomDropdown';
import { useNavigation } from '@react-navigation/native';
import { useTeacherFilter } from '../../contexts/TeacherFilterContext';

export default function TeacherExamsScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const { data: exams, loading } = useRealtimeData<any>('exams', teacher?.school_id, { column: 'date', ascending: false });

  const { selectedClass, selectedSection } = useTeacherFilter();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  const statuses = ["Upcoming", "Ongoing", "Completed"];

  // Group exams by name + class
  const groupedExams = useMemo(() => {
    if (!exams) return [];
    const groups: Record<string, any> = {};
    
    exams.forEach((exam: any) => {
      const key = `${exam.name}_${exam.class}`;
      if (!groups[key]) {
        groups[key] = {
          ...exam,
          subject: exam.subject || "",
          subjectsList: [exam]
        };
      } else {
        groups[key].subjectsList.push(exam);
        groups[key].subject = groups[key].subjectsList.map((s: any) => s.subject).filter(Boolean).join(", ");
      }
    });
    
    return Object.values(groups);
  }, [exams]);

  // Filter exams based on selections
  const filteredExams = groupedExams.filter((exam: any) => {
    if (selectedClass && exam.class !== selectedClass) return false;
    if (selectedSection && exam.section !== selectedSection) return false;
    
    // Status mapping: In db it is usually lowercase 'upcoming', 'ongoing', 'completed'
    if (selectedStatus && exam.type !== selectedStatus.toLowerCase()) return false;
    
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      
      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.filterRow}>
            <CustomDropdown 
              label="Status"
              data={statuses}
              selectedValue={selectedStatus}
              onSelect={setSelectedStatus}
              placeholder="All"
            />
          </View>
        </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredExams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          renderItem={({ item }) => {
            const statusColor = item.type === 'upcoming' ? '#3b82f6' : item.type === 'ongoing' ? '#f59e0b' : '#10b981';
            const statusBg = isDark ? statusColor + '30' : statusColor + '20';
            
            return (
              <TouchableOpacity 
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('TeacherExamResults', { examGroup: item, examId: item.id })}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
                  <View style={[styles.badge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{item.type || 'N/A'}</Text>
                  </View>
                </View>
                
                <View style={styles.metaRow}>
                  <Ionicons name="book-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {item.subject || 'No Subject'}
                  </Text>
                </View>
                
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {item.date ? new Date(item.date).toLocaleDateString() : 'TBD'}
                  </Text>
                </View>
                
                {(item.class || item.section) && (
                  <View style={styles.metaRow}>
                    <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      Class: {item.class} {item.section ? `(${item.section})` : ''}
                    </Text>
                  </View>
                )}
                
                {item.max_marks && (
                  <View style={styles.metaRow}>
                    <Ionicons name="stats-chart-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      Max Marks: {item.max_marks}
                    </Text>
                  </View>
                )}
                
                <View style={styles.actionRow}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Enter Marks</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No exams found matching filters.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersContainer: { padding: 15, borderBottomWidth: 1 },
  filterRow: { flexDirection: 'row', gap: 10, zIndex: 10 },
  listContent: { padding: 20 },
  card: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '600', flex: 1, marginRight: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metaText: { fontSize: 13 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }
});
