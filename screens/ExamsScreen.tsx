import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions, 
  StyleSheet, 
  Platform 
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useStudent } from '../hooks/useStudent';
import { getStudentExams, getStudentResults } from '../services/exams';
import { Exam, ExamResult } from '../types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';

const ExamScheduleItem = ({ exam, isDark, cardColor, borderColor, textColor, subtextColor }: any) => {
  const transExamName = useTransliteration(exam.name);
  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={[styles.examCard, { backgroundColor: cardColor, borderColor }]}
    >
      <View style={styles.cardRow}>
        <LinearGradient
          colors={isDark ? ['#0284C7', '#0369A1'] : ['#F0F9FF', '#E0F2FE']}
          style={styles.dateBadge}
        >
          <Text style={[styles.dateNum, { color: isDark ? '#F0F9FF' : '#0369A1' }]}>{new Date(exam.date).getDate()}</Text>
          <Text style={[styles.dateMonth, { color: isDark ? '#E0F2FE' : '#0284C7' }]}>{new Date(exam.date).toLocaleDateString('en-US', { month: 'short' })}</Text>
        </LinearGradient>
        <View style={styles.examInfo}>
          <Text style={[styles.examName, { color: textColor }]}>{transExamName}</Text>
          <View style={styles.dayRow}>
            <Feather name="trending-up" size={12} color="#0284C7" />
            <Text style={[styles.dayText, { color: subtextColor }]}>{new Date(exam.date).toLocaleDateString('en-US', { weekday: 'long' })}</Text>
          </View>
        </View>
        <View style={[styles.chevronBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
          <Feather name="chevron-right" size={18} color={isDark ? '#F1F5F9' : '#CBD5E1'} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ExamResultItem = ({ result, isDark, cardColor, borderColor, textColor, subtextColor, t }: any) => {
  const transExamName = useTransliteration(result.exams?.name);
  const transSubjectName = useTransliteration(result.exams?.subject);
  
  const percentage = (result.score / result.total_marks) * 100;
  let statusColor = '#22C55E';
  let statusLabel = t('excellent', 'Excellent');
  if (percentage < 50) {
    statusColor = '#EF4444';
    statusLabel = t('needsWork', 'Needs Work');
  } else if (percentage < 75) {
    statusColor = '#F59E0B';
    statusLabel = t('passed', 'Passed');
  } else if (percentage < 90) {
    statusLabel = t('veryGood', 'Very Good');
  }

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={[styles.resultCard, { backgroundColor: cardColor, borderColor }]}
    >
      <View style={styles.resultHeader}>
        <View style={styles.subjectInfo}>
          <View style={styles.subjectMeta}>
            <Feather name="book-open" size={12} color={subtextColor} />
            <Text style={[styles.subjectMetaText, { color: subtextColor }]}>{transExamName || t('session2024', 'Session 2024')}</Text>
          </View>
          <Text style={[styles.subjectName, { color: textColor }]}>{transSubjectName || result.exams?.subject || t('mathematics', 'Mathematics')}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
          <Text style={styles.scoreText}>{result.score}</Text>
          <Text style={styles.totalText}>/ {result.total_marks}</Text>
        </View>
      </View>
      
      <View style={[styles.progressContainer, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
        <LinearGradient
          colors={['#0284C7', '#38BDF8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${percentage}%` }]}
        />
      </View>
      
      <View style={styles.resultFooter}>
        <View style={[styles.statusTag, { backgroundColor: isDark ? statusColor + '30' : statusColor + '20' }]}>
          <Feather name="star" size={12} color={statusColor} />
          <Text style={[styles.statusTagText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
        <TouchableOpacity style={[styles.detailsButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
          <Feather name="info" size={12} color={subtextColor} />
          <Text style={[styles.detailsText, { color: subtextColor }]}>{t('details', 'Details')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ExamsScreen = () => {
  const navigation = useNavigation();
  const { selectedStudent } = useStudent();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'results'>('schedule');

  const { isDark } = useTheme();
  const { t } = useLanguage();

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#F1F5F9';
  const tabBg = isDark ? '#334155' : '#F1F5F9';

  useEffect(() => {
    if (selectedStudent) {
      setLoading(true);
      Promise.all([
        getStudentExams(selectedStudent.school_id),
        getStudentResults(selectedStudent.id)
      ]).then(([examsData, resultsData]) => {
        setExams(examsData);
        setResults(resultsData);
        setLoading(false);
      });
    }
  }, [selectedStudent]);

  if (loading) {
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
      
      <View style={[styles.headerWrapper, { backgroundColor: headerBg }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#ffffff', '#F8FAFC']}
          style={[styles.headerGradient, { borderBottomColor: borderColor }]}
        >
          <View style={[styles.headerTop, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
            <View>
              <Text style={[styles.headerTitle, { color: textColor }]}>{t('exams', 'Exams')}</Text>
              <Text style={[styles.headerSubtitle, { color: subtextColor }]}>{t('schedulePerformance', 'Schedule & Performance')}</Text>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Feather name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Modern Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: bgColor }]}>
        <View style={[styles.tabBar, { backgroundColor: tabBg }]}>
          <TouchableOpacity 
            onPress={() => setActiveTab('schedule')}
            activeOpacity={0.8}
            style={[styles.tab, activeTab === 'schedule' ? [styles.tabActive, { backgroundColor: cardColor }] : null]}
          >
            <Feather name="calendar" size={18} color={activeTab === 'schedule' ? '#0284C7' : subtextColor} />
            <Text style={[styles.tabText, activeTab === 'schedule' ? [styles.tabTextActive, { color: textColor }] : [styles.tabTextInactive, { color: subtextColor }]]}>{t('schedule', 'Schedule')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('results')}
            activeOpacity={0.8}
            style={[styles.tab, activeTab === 'results' ? [styles.tabActive, { backgroundColor: cardColor }] : null]}
          >
            <Feather name="award" size={18} color={activeTab === 'results' ? '#0284C7' : subtextColor} />
            <Text style={[styles.tabText, activeTab === 'results' ? [styles.tabTextActive, { color: textColor }] : [styles.tabTextInactive, { color: subtextColor }]]}>{t('examResults')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'schedule' ? (
          exams.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F8FAFC' }]}>
                <Feather name="calendar" size={48} color={isDark ? '#0284C7' : '#CBD5E1'} />
              </View>
              <Text style={[styles.emptyTitle, { color: textColor }]}>{t('noExamsScheduled', 'No Exams Scheduled')}</Text>
              <Text style={[styles.emptyDesc, { color: subtextColor }]}>{t('noExamsScheduledDesc', "Stay tuned! We'll notify you when the next exam timetable is published.")}</Text>
            </View>
          ) : (
            exams.map((exam) => (
              <ExamScheduleItem
                key={exam.id}
                exam={exam}
                isDark={isDark}
                cardColor={cardColor}
                borderColor={borderColor}
                textColor={textColor}
                subtextColor={subtextColor}
              />
            ))
          )
        ) : (
          results.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F8FAFC' }]}>
                <Feather name="award" size={48} color={isDark ? '#0284C7' : '#CBD5E1'} />
              </View>
              <Text style={[styles.emptyTitle, { color: textColor }]}>{t('resultsPending', 'Results Pending')}</Text>
              <Text style={[styles.emptyDesc, { color: subtextColor }]}>{t('resultsPendingDesc', 'Exams are under evaluation. Results will appear here once finalized.')}</Text>
            </View>
          ) : (
            results.map((result) => (
              <ExamResultItem
                key={result.id}
                result={result}
                isDark={isDark}
                cardColor={cardColor}
                borderColor={borderColor}
                textColor={textColor}
                subtextColor={subtextColor}
                t={t}
              />
            ))
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 15, fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
  flex1: { flex: 1 },
  headerWrapper: { zIndex: 10 },
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: 20, paddingHorizontal: 25, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  menuButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  tabsContainer: { paddingHorizontal: 25, paddingVertical: 24 },
  tabBar: { flexDirection: 'row', padding: 6, borderRadius: 24 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 20 },
  tabActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  tabText: { marginLeft: 8, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  tabTextActive: {},
  tabTextInactive: {},
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  emptyCard: { borderRadius: 40, padding: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2, marginTop: 10 },
  emptyIconBg: { padding: 24, borderRadius: 999, marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptyDesc: { fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  examCard: { borderRadius: 32, padding: 24, marginBottom: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  dateBadge: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dateNum: { fontSize: 22, fontWeight: '900' },
  dateMonth: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  examInfo: { flex: 1 },
  examName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5, lineHeight: 24 },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  dayText: { fontSize: 10, fontWeight: '900', marginLeft: 6, letterSpacing: 1, textTransform: 'uppercase' },
  chevronBg: { padding: 8, borderRadius: 12 },
  resultCard: { borderRadius: 32, padding: 24, marginBottom: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  subjectInfo: { flex: 1, marginRight: 15 },
  subjectMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  subjectMetaText: { fontSize: 10, fontWeight: '900', marginLeft: 6, letterSpacing: 1, textTransform: 'uppercase' },
  subjectName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  scoreBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  scoreText: { fontSize: 22, fontWeight: '900', color: '#0284C7' },
  totalText: { fontSize: 10, color: '#7DD3FC', fontWeight: '900', textTransform: 'uppercase' },
  progressContainer: { height: 12, borderRadius: 6, width: '100%', marginBottom: 20, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 6 },
  resultFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  statusTagText: { fontSize: 10, fontWeight: '900', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailsButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  detailsText: { fontSize: 10, fontWeight: '900', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default ExamsScreen;
