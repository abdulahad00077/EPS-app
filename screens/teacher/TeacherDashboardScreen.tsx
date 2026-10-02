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

  const classes = useMemo(() => {
    const fetched = Array.from(new Set(students?.map((s: any) => s.class).filter(Boolean))) as string[];
    return Array.from(new Set([...fetched, '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])).sort((a, b) => Number(a) - Number(b));
  }, [students]);
  
  const sections = useMemo(() => {
    const fetched = Array.from(new Set(students?.filter((s: any) => selectedClass ? s.class === selectedClass : true).map((s: any) => s.section).filter(Boolean))) as string[];
    return Array.from(new Set([...fetched, 'A', 'B', 'C', 'D', 'E'])).sort();
  }, [students, selectedClass]);

  const myStudents = students?.filter(s => {
    if (selectedClass && s.class !== selectedClass) return false;
    if (selectedSection && s.section !== selectedSection) return false;
    return true;
  }) || [];
  const totalStudents = myStudents.length;

  const todayAttendance = attendance?.filter(a => a.date?.startsWith(today) && myStudents.some(s => s.id === a.student_id)) || [];
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const attendancePercent = todayAttendance.length > 0 ? Math.round((presentCount / todayAttendance.length) * 100) : 0;

  const weekDates = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      dates.push(nextDay.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const weeklyAttendanceData = useMemo(() => {
    if (!attendance || !myStudents.length) return [0, 0, 0, 0, 0];
    
    return weekDates.map(dateStr => {
      const recordsForDay = attendance.filter((a: any) => 
        a.date?.startsWith(dateStr) && myStudents.some(s => s.id === a.student_id)
      );
      if (recordsForDay.length === 0) return 0;
      const present = recordsForDay.filter((a: any) => a.status === 'present').length;
      return Math.round((present / recordsForDay.length) * 100);
    });
  }, [attendance, myStudents, weekDates]);

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        data: weeklyAttendanceData,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2
      }
    ],
  };



  const modules = [
    { title: 'Exams', icon: 'document-text', route: 'TeacherExams', color: '#f59e0b' },
    { title: 'Syllabus', icon: 'book', route: 'TeacherSyllabus', color: '#8b5cf6' },
    { title: 'Datesheet', icon: 'calendar', route: 'TeacherDatesheet', color: '#06b6d4' },
    { title: 'Announcements', icon: 'megaphone', route: 'TeacherAnnouncements', color: '#ef4444' },
    { title: 'Competitions', icon: 'trophy', route: 'TeacherCompetitions', color: '#f97316' },
    { title: 'Leave Requests', icon: 'calendar-outline', route: 'TeacherLeaveRequests', color: '#10b981' },
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
        {/* Filters */}
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
