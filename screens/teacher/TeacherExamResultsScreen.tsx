import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomDropdown from '../../components/CustomDropdown';

export default function TeacherExamResultsScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  
  const examGroup = route.params?.examGroup;
  
  const initialExamId = examGroup?.subjectsList?.length > 0 ? examGroup.subjectsList[0].id : route.params?.examId;
  const [selectedExamId, setSelectedExamId] = useState<string | null>(initialExamId);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(examGroup?.subjectsList?.length > 0 ? examGroup.subjectsList[0].subject : null);

  useEffect(() => {
    const group = route.params?.examGroup;
    const newExamId = group?.subjectsList?.length > 0 ? group.subjectsList[0].id : route.params?.examId;
    const newSubj = group?.subjectsList?.length > 0 ? group.subjectsList[0].subject : null;
    
    if (newExamId && newExamId !== selectedExamId) {
      setSelectedExamId(newExamId);
      setSelectedSubjectName(newSubj);
      setMarks({});
    }
  }, [route.params?.examId, route.params?.examGroup]);

  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedExamId && teacher?.school_id) {
      fetchData();
    }
  }, [selectedExamId, teacher?.school_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', selectedExamId)
        .eq('school_id', teacher?.school_id)
        .single();
        
      if (examError) throw examError;
      setExam(examData);

      // Fetch Students in that class
      const { data: studentsData, error: stdError } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', teacher?.school_id)
        .eq('class', examData.class)
        .order('name');
      if (stdError) throw stdError;
      setStudents(studentsData || []);

      // Fetch Existing Results
      const { data: resultsData, error: resError } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_id', selectedExamId);
        
      if (resError) throw resError;
      
      const marksMap: Record<string, string> = {};
      resultsData?.forEach(r => {
        marksMap[r.student_id] = r.score?.toString() || '';
      });
      setMarks(marksMap);
      
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch exam data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsToUpsert = students.map(s => {
        const scoreStr = marks[s.id];
        return {
          exam_id: selectedExamId,
          student_id: s.id,
          score: scoreStr ? parseFloat(scoreStr) : null,
          total_marks: exam?.max_marks || 100,
        };
      }).filter(r => r.score !== null && !isNaN(r.score));

      if (recordsToUpsert.length === 0) {
        Alert.alert('Info', 'No valid marks to save.');
        setSaving(false);
        return;
      }

      for (const record of recordsToUpsert) {
         // Upsert using the constraint on exam_id and student_id
         // Wait, there might not be a unique constraint, let's use select/insert/update
         const { data: existing } = await supabase.from('exam_results')
            .select('id')
            .eq('exam_id', record.exam_id)
            .eq('student_id', record.student_id)
            .single();
            
         if (existing) {
             await supabase.from('exam_results').update({ score: record.score, total_marks: record.total_marks }).eq('id', existing.id);
         } else {
             await supabase.from('exam_results').insert(record);
         }
      }

      Alert.alert('Success', 'Marks saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const getGrade = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return { grade: "A+", color: '#10b981' };
    if (percentage >= 80) return { grade: "A", color: '#22c55e' };
    if (percentage >= 70) return { grade: "B+", color: '#3b82f6' };
    if (percentage >= 60) return { grade: "B", color: '#0ea5e9' };
    if (percentage >= 50) return { grade: "C", color: '#f59e0b' };
    if (percentage >= 40) return { grade: "D", color: '#f97316' };
    return { grade: "F", color: '#ef4444' };
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header Information */}
        <View style={[styles.headerInfo, { borderBottomColor: colors.border, backgroundColor: colors.surface, zIndex: 10 }]}>
          <Text style={[styles.examTitle, { color: colors.text }]}>{examGroup?.name || exam?.name}</Text>
          <View style={[styles.metaRowContainer, { zIndex: 10 }]}>
            {examGroup?.subjectsList?.length > 1 ? (
              <View style={{ flex: 1, marginRight: 10, zIndex: 10 }}>
                <CustomDropdown
                  label=""
                  data={examGroup.subjectsList.map((s:any) => s.subject).filter(Boolean)}
                  selectedValue={selectedSubjectName}
                  onSelect={(sub) => {
                    setSelectedSubjectName(sub);
                    const newExam = examGroup.subjectsList.find((s:any) => s.subject === sub);
                    if (newExam) {
                      setMarks({});
                      setSelectedExamId(newExam.id);
                    }
                  }}
                  placeholder="Select Subject"
                />
              </View>
            ) : (
              <View style={styles.metaBadge}>
                <Ionicons name="book-outline" size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 5 }}>{exam?.subject}</Text>
              </View>
            )}
            
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={styles.metaBadge}>
                <Ionicons name="stats-chart-outline" size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 5 }}>Max: {exam?.max_marks}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 5 }}>{exam?.class} {exam?.section || ''}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Student List */}
        <FlatList
          style={{ flex: 1 }}
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 80 }}
          renderItem={({ item }) => {
            const currentMark = marks[item.id] || '';
            const markNum = parseFloat(currentMark);
            const { grade, color } = !isNaN(markNum) && exam?.max_marks ? getGrade(markNum, exam.max_marks) : { grade: '-', color: colors.textSecondary };
            
            return (
              <View style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.studentRoll, { color: colors.textSecondary }]}>Roll No: {item.roll_id || 'N/A'}</Text>
                </View>
                
                <View style={styles.marksContainer}>
                  <TextInput
                    style={[styles.marksInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={currentMark}
                    onChangeText={(val) => setMarks(prev => ({ ...prev, [item.id]: val }))}
                  />
                  <View style={[styles.gradeBadge, { backgroundColor: isDark ? color + '30' : color + '20' }]}>
                    <Text style={{ color: color, fontWeight: 'bold', fontSize: 12 }}>{grade}</Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No students found in this class.</Text>
            </View>
          )}
        />

        {/* Save Button */}
        {students.length > 0 && (
          <View style={[styles.saveContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Marks</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  headerInfo: { padding: 20, borderBottomWidth: 1 },
  examTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  metaRowContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(150,150,150,0.1)' },
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  studentRoll: { fontSize: 13 },
  marksContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  marksInput: { width: 60, height: 40, borderWidth: 1, borderRadius: 8, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  gradeBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  saveContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, paddingBottom: 25, borderTopWidth: 1 },
  saveBtn: { flexDirection: 'row', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
