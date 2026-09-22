import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Modal, 
  Pressable, 
  Platform, 
  ActivityIndicator, 
  StatusBar, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { transliterateToHindi } from '../services/transliteration';
import { useStudent } from '../hooks/useStudent';
import { useTransliteration } from '../hooks/useTransliteration';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getStudentAttendance } from '../services/attendance';
import { getStudentHomework } from '../services/homework';
import { getStudentTimetable } from '../services/timetable';
import { getStudentMessages } from '../services/messages';
import { supabase } from '../services/supabase';
import { LineChart, PieChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ModalStudentItem = ({ student, isActive, isDark, bgColor, borderColor, textColor, subtextColor, t, onPress }: any) => {
  const transName = useTransliteration(student.name);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.studentItem, 
        { 
          backgroundColor: isActive ? (isDark ? 'rgba(2, 132, 199, 0.2)' : '#F0F9FF') : bgColor,
          borderColor: isActive ? '#0284C7' : borderColor 
        }
      ]}
    >
      <View style={[
        styles.itemAvatar,
        isActive ? { backgroundColor: '#0284C7' } : { backgroundColor: isDark ? '#334155' : '#F1F5F9' }
      ]}>
        <Text style={[
          styles.itemAvatarText,
          isActive ? { color: '#FFFFFF' } : { color: subtextColor }
        ]}>
          {transName?.charAt(0) || 'S'}
        </Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={[
          styles.itemName,
          { color: isActive ? '#0284C7' : textColor }
        ]}>
          {transName}
        </Text>
        <Text style={[styles.itemClass, { color: subtextColor }]}>{t('class')} {student.class}</Text>
      </View>
      {isActive && <View style={styles.checkBadge}><Feather name="check" size={14} color="white" /></View>}
    </TouchableOpacity>
  );
};

const DashboardScreen = () => {
  const { students, selectedStudent, selectStudent, loading, refreshStudents } = useStudent();
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { isDark, colors } = useTheme();
  const { t, language } = useLanguage();
  const transSelectedName = useTransliteration(selectedStudent?.name);
  const [refreshing, setRefreshing] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Use Teacher Panel theme colors directly
  const bgColor = colors.background;
  const headerBg = colors.surface;
  const cardColor = colors.surface;
  const textColor = colors.text;
  const subtextColor = colors.textSecondary;
  const borderColor = colors.border;

  // Dashboard Metrics
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [attendancePerc, setAttendancePerc] = useState('0');
  const [homeworkCount, setHomeworkCount] = useState('0');
  const [nextClass, setNextClass] = useState('--:--');
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [activityLabels, setActivityLabels] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [activityData, setActivityData] = useState<number[]>([0, 0, 0, 0, 0]);

  const fetchDashboardMetrics = React.useCallback(async () => {
    if (!selectedStudent) return;
    setMetricsLoading(true);
    try {
      const [attendData, hwData, ttData, msgData] = await Promise.all([
        getStudentAttendance(selectedStudent.id),
        getStudentHomework(selectedStudent.class, selectedStudent.section),
        getStudentTimetable(selectedStudent.school_id, selectedStudent.class, selectedStudent.section),
        getStudentMessages(selectedStudent.id)
      ]);

      // 1. Calculate Attendance
      if (attendData.length > 0) {
        const presentDays = attendData.filter(r => r.status === 'present').length;
        setAttendancePerc(Math.round((presentDays / attendData.length) * 100).toString());
      } else {
        setAttendancePerc('0');
      }

      // 2. Calculate Total Homework
      const _now = new Date();
      setHomeworkCount(hwData.length.toString());

      // 3. Find Next Class
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[_now.getDay()];
      const currentTime = _now.toTimeString().substring(0, 5); 
      
      const todaysClasses = ttData.filter(t => t.day_of_week === today);
      const upcomingClass = todaysClasses
        .filter(t => t.start_time > currentTime)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
      
      setNextClass(upcomingClass ? `${upcomingClass.subject ? upcomingClass.subject + ' ' : ''}(${upcomingClass.start_time.substring(0, 5)})` : 'None');

      // 4. Populate Recent Activity (Map top 2 messages + top 2 homeworks)
      const topMsgs = msgData.slice(0, 2).map((m: any) => ({
        id: 'msg_' + m.id,
        title: language === 'hi' ? 'नया संदेश' : 'New Message',
        desc: m.message_text || m.message || (language === 'hi' ? 'आपके पास एक नया संदेश है।' : 'You have a new message.'),
        date: new Date(m.created_at),
        icon: 'message-circle',
        color: '#8B5CF6'
      }));
      
      const topHw = hwData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 2).map(h => ({
        id: 'hw_' + h.id,
        title: (language === 'hi' ? 'नया होमवर्क: ' : 'New Homework: ') + (h.title || 'Assignment'),
        desc: h.title,
        date: new Date(h.created_at),
        icon: 'book',
        color: '#EA580C'
      }));

      const combined = [...topMsgs, ...topHw]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 2);

      if (language === 'hi') {
        for (let item of combined) {
          if (item.desc) item.desc = await transliterateToHindi(item.desc);
          if (item.title && item.title.includes('नया होमवर्क')) item.title = await transliterateToHindi(item.title);
        }
      }
        
      setRecentUpdates(combined);

      // 5. Calculate activity over last 5 days
      const daysArr = [];
      const dataArr = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        daysArr.push(days[d.getDay()].substring(0, 3));
        
        const dateStr = d.toISOString().split('T')[0];
        const hwOnDate = hwData.filter(h => h.created_at.startsWith(dateStr)).length;
        const msgOnDate = msgData.filter(m => m.created_at.startsWith(dateStr)).length;
        dataArr.push(hwOnDate + msgOnDate);
      }
      // if all data is 0, add a fake small value so the chart renders properly without throwing divide by zero inside react-native-chart-kit
      if (dataArr.every(v => v === 0)) dataArr[4] = 0; 
      
      setActivityLabels(daysArr);
      setActivityData(dataArr);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, [selectedStudent, language]);

  useEffect(() => {
    fetchDashboardMetrics();
    
    // Subscribe to any changes related to this student
    if (!selectedStudent) return;
    
    const channel = supabase
      .channel('dashboard_metrics')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
         // Silently fetch new metrics when anything in the DB changes
         fetchDashboardMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStudent, fetchDashboardMetrics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshStudents();
    if (selectedStudent) {
      await fetchDashboardMetrics();
    }
    setRefreshing(false);
  }, [refreshStudents, fetchDashboardMetrics, selectedStudent]);

  if (loading || !selectedStudent) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={[styles.loadingText, { color: subtextColor }]}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Premium Header */}
      <View style={[styles.headerWrapper, { backgroundColor: headerBg }]}>
        <View style={[styles.headerGradient, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
          <View style={[styles.headerTop, { justifyContent: 'space-between' }]}>
            <TouchableOpacity
              onPress={() => students.length > 1 && setShowSwitchModal(true)}
              activeOpacity={0.7}
              style={[styles.studentSelector, { backgroundColor: bgColor, borderColor: borderColor }]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{transSelectedName?.charAt(0) || 'S'}</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentLabel, { color: subtextColor }]}>{t('studentProfile', 'STUDENT PROFILE').toUpperCase()}</Text>
                <View style={styles.studentNameRow}>
                  <Text style={[styles.studentName, { color: textColor }]} numberOfLines={1}>{transSelectedName}</Text>
                  {students.length > 1 && <Feather name="chevron-down" size={14} color={subtextColor} />}
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Feather name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284c7" />}
      >
        <View style={styles.mainContent}>
          
          {/* Main Info Card */}
          <View style={styles.cardWrapper}>
            <LinearGradient
              colors={['#4F46E5', '#3B82F6', '#0EA5E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainCard}
            >
              {/* Decorative elements */}
              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />
              
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>{t('currentClass', 'CURRENT CLASS').toUpperCase()}</Text>
                  <Text style={styles.cardTitle}>
                    {selectedStudent.class}{selectedStudent.section ? ` - ${selectedStudent.section}` : ''}
                  </Text>
                </View>
                <View style={styles.rollBadge}>
                  <Feather name="hash" size={14} color="#FFFFFF" style={{ marginRight: 2 }} />
                  <Text style={styles.rollText}>{selectedStudent?.admission_number}</Text>
                </View>
              </View>
              
              <View style={styles.cardGlassmorphism}>
                <View style={styles.footerItem}>
                  <View style={styles.footerIconBg}>
                    <MaterialCommunityIcons name="school-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.footerLabel}>{t('activeEnrollment', 'Active Enrollment')}</Text>
                    <Text style={styles.sessionText}>
                      {selectedStudent.session || t('academicYear', 'Academic Year 2026-27')}
                    </Text>
                  </View>
                </View>
                <View style={styles.activeDotContainer}>
                  <View style={styles.activeDotPulse} />
                  <View style={styles.activeDot} />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: cardColor, borderColor }]}>
              <View style={[styles.statIconBg, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#F0FDF4' }]}>
                <Feather name="calendar" size={22} color="#16a34a" />
              </View>
              <Text style={[styles.statValue, { color: textColor }]}>
                {metricsLoading ? '-' : `${attendancePerc}%`}
              </Text>
              <Text style={[styles.statLabel, { color: subtextColor }]}>{t('attendance').toUpperCase()}</Text>
            </View>
            
            <View style={[styles.statBox, { backgroundColor: cardColor, borderColor }]}>
              <View style={[styles.statIconBg, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFF7ED' }]}>
                <Feather name="book-open" size={22} color="#ea580c" />
              </View>
              <Text style={[styles.statValue, { color: textColor }]}>
                {metricsLoading ? '-' : homeworkCount}
              </Text>
              <Text style={[styles.statLabel, { color: subtextColor }]}>{t('homework').toUpperCase()}</Text>
            </View>
            
            <View style={[styles.statBox, { backgroundColor: cardColor, borderColor }]}>
              <View style={[styles.statIconBg, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' }]}>
                <Feather name="clock" size={22} color="#2563eb" />
              </View>
              <Text style={[styles.statValue, { color: textColor }]}>
                {metricsLoading ? '--:--' : nextClass}
              </Text>
              <Text style={[styles.statLabel, { color: subtextColor }]}>{t('nextClass', 'NEXT CLASS').toUpperCase()}</Text>
            </View>
          </View>

          {/* Charts Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{(t as any)('analytics', 'Performance Analytics')}</Text>
          </View>
          
          <View style={{ marginBottom: 20 }}>
            {metricsLoading ? (
              <ActivityIndicator style={{ marginVertical: 30 }} size="large" color="#0284c7" />
            ) : (
              <View style={{ paddingHorizontal: 0 }}>
                {/* Attendance Pie Chart */}
                <View style={[styles.chartContainer, { backgroundColor: cardColor, borderColor, width: '100%', marginRight: 0, marginBottom: 16 }]}>
                  <Text style={[styles.chartTitle, { color: textColor }]}>{t('attendance', 'Attendance')}</Text>
                  <PieChart
                    data={[
                      {
                        name: '% Present',
                        population: parseInt(attendancePerc) || 0,
                        color: '#10b981',
                        legendFontColor: textColor,
                        legendFontSize: 12,
                      },
                      {
                        name: '% Absent',
                        population: 100 - (parseInt(attendancePerc) || 0),
                        color: isDark ? '#334155' : '#e2e8f0',
                        legendFontColor: subtextColor,
                        legendFontSize: 12,
                      }
                    ]}
                    width={SCREEN_WIDTH - 60}
                    height={180}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    }}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"0"}
                    center={[0, 0]}
                    absolute
                  />
                </View>

              </View>
            )}
          </View>


        </View>
      </ScrollView>

      {/* Student Switcher Modal */}
      <Modal
        visible={showSwitchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSwitchModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowSwitchModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('switchStudentProfile', 'Switch Student Profile')}</Text>
            
            {students.map((student) => {
              const isActive = student.id === selectedStudent.id;
              return (
                <ModalStudentItem
                  key={student.id}
                  student={student}
                  isActive={isActive}
                  isDark={isDark}
                  bgColor={colors.background}
                  borderColor={colors.border}
                  textColor={colors.text}
                  subtextColor={colors.textSecondary}
                  t={t}
                  onPress={() => {
                    selectStudent(student);
                    setShowSwitchModal(false);
                  }}
                />
              );
            })}
            
            <TouchableOpacity 
              onPress={() => setShowSwitchModal(false)}
              style={styles.closeModalButton}
            >
              <Text style={[styles.closeModalText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Original styles slightly modified to remove hardcoded background colors since inline styles handle them now.
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontWeight: '600',
  },
  flex1: {
    flex: 1,
  },
  headerWrapper: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 15,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    marginRight: 15,
  },
  avatar: {
    backgroundColor: '#0284C7',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  studentInfo: {
    marginLeft: 10,
    flex: 1,
  },
  studentLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  mainContent: {
    padding: 25,
  },
  cardWrapper: {
    marginBottom: 35,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  mainCard: {
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -30,
    left: -30,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    zIndex: 1,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  rollBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  rollText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  cardGlassmorphism: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIconBg: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 2,
  },
  sessionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  activeDotContainer: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDotPulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.4)',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 28,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 3,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuButton: {
    padding: 8,
    marginLeft: -8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  seeAllText: {
    color: '#0284C7',
    fontWeight: '900',
    fontSize: 14,
  },
  updateCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    marginBottom: 30,
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  updateIconBg: {
    padding: 10,
    borderRadius: 14,
  },
  updateContent: {
    marginLeft: 15,
    flex: 1,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  updateDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  updateTime: {
    fontSize: 11,
    marginTop: 10,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 22,
  },
  logoutText: {
    marginLeft: 10,
    fontWeight: '800',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemInfo: {
    marginLeft: 15,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemClass: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  checkBadge: {
    backgroundColor: '#0284C7',
    padding: 4,
    borderRadius: 10,
  },
  closeModalButton: {
    marginTop: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  closeModalText: {
    fontWeight: '800',
    fontSize: 16,
  },
});

export default DashboardScreen;
