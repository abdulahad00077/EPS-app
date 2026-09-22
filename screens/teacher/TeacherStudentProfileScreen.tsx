import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function TeacherStudentProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const student = route.params?.student;

  if (!student) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Student not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerArea}>
          <View style={[styles.avatar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.border }]}>
             <Ionicons name="person" size={60} color={colors.textSecondary} />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{student.name}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Class {student.class} {student.section ? `- Section ${student.section}` : ''}
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Academic Details</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DetailRow label="Admission No" value={student.admission_number || 'N/A'} colors={colors} />
            <DetailRow label="Roll No" value={student.roll_number || 'N/A'} colors={colors} />
            <DetailRow label="Date of Birth" value={student.date_of_birth || 'N/A'} colors={colors} />
            <DetailRow label="Gender" value={student.gender || 'N/A'} colors={colors} />
          </View>
        </View>

        <View style={styles.cardContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Parent / Guardian Details</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DetailRow label="Father's Name" value={student.father_name || 'N/A'} colors={colors} />
            <DetailRow label="Father's Contact" value={student.father_phone || 'N/A'} colors={colors} />
            <DetailRow label="Mother's Name" value={student.mother_name || 'N/A'} colors={colors} />
            <DetailRow label="Address" value={student.address || 'N/A'} colors={colors} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, colors }: { label: string, value: string, colors: any }) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  headerArea: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16 },
  cardContainer: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginLeft: 5 },
  card: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' }
});
