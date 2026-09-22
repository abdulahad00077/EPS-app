import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { useNavigation } from '@react-navigation/native';
import { useTeacherFilter } from '../../contexts/TeacherFilterContext';

export default function TeacherStudentsScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  
  const insets = useSafeAreaInsets();
  const { data: students, loading } = useRealtimeData<any>('students', teacher?.school_id, { column: 'name', ascending: true });
  
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedClass, selectedSection } = useTeacherFilter();

  const filteredStudents = students?.filter((s: any) => {
    if (selectedClass && s.class !== selectedClass) return false;
    if (selectedSection && s.section !== selectedSection) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || 
             (s.admission_number && s.admission_number.toLowerCase().includes(q)) ||
             (s.roll_number && s.roll_number.toLowerCase().includes(q));
    }
    return true;
  }) || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
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



      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('TeacherStudentProfile', { student: item })}
            >
              <View style={[styles.avatar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Ionicons name="person" size={24} color={colors.textSecondary} />
              </View>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.studentDetails, { color: colors.textSecondary }]}>
                  {item.class} {item.section ? `- ${item.section}` : ''} | Roll: {item.roll_number || 'N/A'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No students found.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { paddingHorizontal: 20, paddingBottom: 10, paddingTop: 5 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  listContent: { padding: 20, paddingTop: 10 },
  studentCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  studentDetails: { fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }
});
