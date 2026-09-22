import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import * as Print from 'expo-print';
import { useTeacherFilter } from '../../contexts/TeacherFilterContext';

export default function TeacherDatesheetScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  
  const insets = useSafeAreaInsets();
  const { data: datesheets, loading } = useRealtimeData<any>('exams', teacher?.school_id, { column: 'date', ascending: true });
  const { selectedClass, selectedSection } = useTeacherFilter();

  const filteredDatesheets = useMemo(() => {
    if (!datesheets) return [];
    let filtered = datesheets;
    if (selectedClass) {
      filtered = filtered.filter((d: any) => d.class === selectedClass);
    }
    if (selectedSection) {
      filtered = filtered.filter((d: any) => !d.section || d.section === selectedSection);
    }
    return filtered;
  }, [datesheets, selectedClass, selectedSection]);

  const generatePDF = async () => {
    try {
      if (!filteredDatesheets || filteredDatesheets.length === 0) {
        Alert.alert('No Data', 'No datesheet data available to download.');
        return;
      }

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
              .school-name { font-size: 24px; font-weight: bold; color: #1e3a8a; }
              .title { font-size: 20px; font-weight: bold; margin-bottom: 20px; text-align: center; color: #475569; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
              th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
              tr:nth-child(even) { background-color: #f8fafc; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="school-name">Elegant Public School</div>
            </div>
            <div class="title">Examination Datesheet</div>
            <table>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Exam Type</th>
              </tr>
              ${filteredDatesheets.map((item: any) => `
                <tr>
                  <td>${new Date(item.date).toLocaleDateString()}</td>
                  <td>${item.start_time || ''} - ${item.end_time || ''}</td>
                  <td>${item.subject || 'N/A'}</td>
                  <td>${item.class || 'All'} ${item.section ? '(' + item.section + ')' : ''}</td>
                  <td>${item.exam_type || 'General'}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `;

      // Use printAsync to open the native print dialog directly
      // This avoids all file permission issues with Expo Go SDK 53+
      // User can select "Save as PDF" from the print dialog
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF datesheet.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.actionHeader}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Datesheet Records</Text>
            <TouchableOpacity 
              style={[styles.downloadBtn, { backgroundColor: colors.primary }]} 
              onPress={generatePDF}
              disabled={!filteredDatesheets || filteredDatesheets.length === 0}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.downloadBtnText}>Download PDF</Text>
            </TouchableOpacity>
          </View>
          <FlatList
          data={filteredDatesheets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.title, { color: colors.text }]}>{item.subject || item.name || 'Exam'}</Text>
                <View style={[styles.badge, { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' }]}>
                  <Text style={[styles.badgeText, { color: '#2563eb' }]}>Class {item.class || 'All'}{item.section ? `-${item.section}` : ''}</Text>
                </View>
              </View>
              
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {item.start_time || '09:00'} - {item.end_time || '12:00'}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  Exam: {item.type || item.exam_type || 'General'}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No datesheets found.</Text>
            </View>
          )}
        />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  actionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  actionTitle: { fontSize: 18, fontWeight: '600' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  downloadBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  listContent: { padding: 20 },
  card: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '600', flex: 1, marginRight: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metaText: { fontSize: 13, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }
});
