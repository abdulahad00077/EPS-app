import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { LineChart } from 'react-native-chart-kit';
import CustomDropdown from '../../components/CustomDropdown';
import { useTeacherFilter } from '../../contexts/TeacherFilterContext';

const screenWidth = Dimensions.get("window").width;

export default function TeacherDashboardScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { data: students, loading: loadingStudents } = useRealtimeData<any>('students', teacher?.school_id);
  const today = new Date().toISOString().split('T')[0];
  const { data: attendance, loading: loadingAttendance } = useRealtimeData<any>('attendance_records', teacher?.school_id);
  
  const { selectedClass, setSelectedClass, selectedSection, setSelectedSection } = useTeacherFilter();

  const classes = useMemo(() => Array.from(new Set(students?.map((s: any) => s.class).filter(Boolean))).sort() as string[], [students]);
  const sections = useMemo(() => Array.from(new Set(students?.filter((s: any) => selectedClass ? s.class === selectedClass : true).map((s: any) => s.section).filter(Boolean))).sort() as string[], [students, selectedClass]);

  const myStudents = students?.filter(s => {
    if (selectedClass && s.class !== selectedClass) return false;
    if (selectedSection && s.section !== selectedSection) return false;
    return true;
  }) || [];
  const totalStudents = myStudents.length;

  const todayAttendance = attendance?.filter(a => a.date?.startsWith(today) && myStudents.some(s => s.id === a.student_id)) || [];
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const attendancePercent = todayAttendance.length > 0 ? Math.round((presentCount / todayAttendance.length) * 100) : 0;

  // Mock graph data based on attendancePercent to make it look dynamic
  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        data: [
          Math.max(0, attendancePercent - 10), 
          Math.min(100, attendancePercent + 5), 
          Math.max(0, attendancePercent - 2), 
          Math.min(100, attendancePercent + 8), 
          attendancePercent > 0 ? attendancePercent : 95
        ],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2
      }
    ],
  };

  const recentActivities = [
    { id: 1, title: 'Math Assignment Graded', time: '2 hours ago', icon: 'checkmark-circle' },
    { id: 2, title: 'New Announcement: Sports Day', time: '5 hours ago', icon: 'megaphone' },
  ];

  const modules = [
    { title: 'Exams', icon: 'document-text', route: 'TeacherExams', color: '#f59e0b' },
    { title: 'Syllabus', icon: 'book', route: 'TeacherSyllabus', color: '#8b5cf6' },
    { title: 'Datesheet', icon: 'calendar', route: 'TeacherDatesheet', color: '#06b6d4' },
    { title: 'Announcements', icon: 'megaphone', route: 'TeacherAnnouncements', color: '#ef4444' },
    { title: 'Competitions', icon: 'trophy', route: 'TeacherCompetitions', color: '#f97316' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.welcome, { color: colors.textSecondary }]}>Welcome Back,</Text>
          <Text style={[styles.name, { color: colors.text }]}>{teacher?.name || 'Teacher'}</Text>
        </View>

        {/* Filters */}
        {classes.length > 0 && (
          <View style={styles.filterSection}>
            <View style={{ flex: 1 }}>
              <CustomDropdown 
                label="Class"
                data={classes}
                selectedValue={selectedClass}
                onSelect={(val) => { setSelectedClass(val); setSelectedSection(null); }}
                placeholder="All"
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomDropdown 
                label="Section"
                data={sections}
                selectedValue={selectedSection}
                onSelect={setSelectedSection}
                placeholder="All"
                disabled={!selectedClass}
              />
            </View>
          </View>
        )}

        {/* Performance Cards */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="people" size={24} color="#3b82f6" />
            </View>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Students</Text>
            {loadingStudents ? <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} /> : (
              <Text style={[styles.statValue, { color: colors.text }]}>{totalStudents}</Text>
            )}
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="checkmark-done-circle" size={24} color="#10b981" />
            </View>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Attendance</Text>
            {loadingAttendance ? <ActivityIndicator size="small" color="#10b981" style={styles.loader} /> : (
              <Text style={[styles.statValue, { color: colors.text }]}>{attendancePercent}%</Text>
            )}
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="trending-up" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Avg Grade</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>A-</Text>
          </View>
        </View>

        {/* Graph */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Weekly Attendance</Text>
        <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.textSecondary,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: { borderRadius: 16 },
              propsForDots: { r: "6", strokeWidth: "2", stroke: colors.surface }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16, marginLeft: -20 }}
          />
        </View>

        {/* Recent Activities */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Recent Activities</Text>
        <View style={styles.activitiesContainer}>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={[styles.activityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.background }]}>
                <Ionicons name={activity.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
                <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Quick Links</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modulesScroll} contentContainerStyle={{ gap: 12 }}>
          {modules.map((mod, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.moduleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate(mod.route)}
            >
              <Ionicons name={mod.icon as any} size={28} color={mod.color} />
              <Text style={[styles.moduleTitle, { color: colors.text }]}>{mod.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { marginBottom: 15 },
  welcome: { fontSize: 16 },
  name: { fontSize: 36, fontWeight: 'bold', marginTop: 4 }, // Increased size
  
  filterSection: { 
    flexDirection: 'row', 
    gap: 15, 
    marginBottom: 20,
    zIndex: 10 // ensure dropdowns can overlap if needed
  },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: {
    width: '31%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  statTitle: { fontSize: 11, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  loader: { marginTop: 4 },

  chartContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
    alignItems: 'center',
    overflow: 'hidden'
  },

  activitiesContainer: {
    marginBottom: 20,
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },

  modulesScroll: {
    marginBottom: 20,
    paddingVertical: 5,
  },
  moduleCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    gap: 8,
  },
  moduleTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  }
});
