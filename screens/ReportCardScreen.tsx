import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  StatusBar, 
  StyleSheet, 
  Platform,
  TouchableOpacity 
} from 'react-native';
import { useStudent } from '../hooks/useStudent';
import { getStudentReportCards } from '../services/reportCard';
import { ReportCard } from '../types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';

const ReportCardItem = ({ report, selectedStudent, isDark, cardColor, borderColor, textColor, subtextColor, t }: any) => {
  const transSelectedName = useTransliteration(selectedStudent?.name);
  const transSchoolName = useTransliteration(selectedStudent?.schools?.name);
  const transTerm = useTransliteration(report.term);
  const transRemarks = useTransliteration(report.remarks);

  return (
    <View style={[styles.reportCard, { backgroundColor: cardColor, borderColor }]}>
      <View style={[styles.reportHeader, { borderBottomColor: borderColor }]}>
        <View>
          <Text style={[styles.schoolName, { color: '#0284c7' }]}>
            {transSchoolName || t('schoolName', 'School Name')}
          </Text>
          <Text style={[styles.termName, { color: textColor }]}>
            {transTerm || t('finalTerm', 'Final Term')} {report.year || ''}
          </Text>
        </View>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>{report.grade || 'A'}</Text>
        </View>
      </View>

      <View style={styles.studentDetailsRow}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: subtextColor }]}>{t('studentName', 'Student Name')}</Text>
          <Text style={[styles.detailValue, { color: textColor }]}>{transSelectedName}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: subtextColor }]}>{t('class', 'Class')}</Text>
          <Text style={[styles.detailValue, { color: textColor }]}>{selectedStudent?.class} {selectedStudent?.section}</Text>
        </View>
      </View>
      
      <View style={styles.marksContainer}>
        <View style={[styles.marksBox, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor }]}>
          <Text style={[styles.marksLabel, { color: subtextColor }]}>{t('totalMarks', 'Total Marks')}</Text>
          <Text style={[styles.marksValue, { color: textColor }]}>{report.total_marks || '-'}</Text>
        </View>
        <View style={[styles.marksBox, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor }]}>
          <Text style={[styles.marksLabel, { color: subtextColor }]}>{t('obtained', 'Obtained')}</Text>
          <Text style={[styles.marksValue, { color: '#0ea5e9' }]}>{report.obtained_marks || '-'}</Text>
        </View>
      </View>

      {report.remarks && (
        <View style={[styles.remarksContainer, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
          <Text style={[styles.remarksLabel, { color: subtextColor }]}>{t('teachersRemarks', "Teacher's Remarks:")}</Text>
          <Text style={[styles.remarksText, { color: textColor }]}>{transRemarks}</Text>
        </View>
      )}
    </View>
  );
};

const ReportCardScreen = () => {
  const navigation = useNavigation();
  const { selectedStudent } = useStudent();
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const transSelectedName = useTransliteration(selectedStudent?.name);

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  useEffect(() => {
    if (selectedStudent) {
      setLoading(true);
      getStudentReportCards(selectedStudent.id).then(data => {
        setReportCards(data);
        setLoading(false);
      });
    }
  }, [selectedStudent]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={[styles.loadingText, { color: subtextColor }]}>{t('loadingReportCards', 'Loading Report Cards...')}</Text>
      </View>
    );
  }

  // If the admin hasn't enabled the report card view for this student
  if (selectedStudent && selectedStudent.show_report_card === false) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={[styles.headerWrapper, { backgroundColor: headerBg }]}>
          <LinearGradient colors={isDark ? ['#1E293B', '#0F172A'] : ['#ffffff', '#F8FAFC']} style={[styles.headerGradient, { borderBottomColor: borderColor }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                <Feather name="arrow-left" size={24} color={textColor} />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: textColor }]}>{t('reportCard', 'Report Card')}</Text>
              </View>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
                <Feather name="menu" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.lockedContainer}>
          <View style={[styles.lockedIconBg, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2' }]}>
            <Feather name="lock" size={64} color="#EF4444" />
          </View>
          <Text style={[styles.lockedTitle, { color: textColor }]}>{t('resultsHidden', 'Results Hidden')}</Text>
          <Text style={[styles.lockedDesc, { color: subtextColor }]}>
            {t('reportCardsHiddenDesc', 'Report cards are currently hidden by the school administration. Please check back later or contact the school for more information.')}
          </Text>
        </View>
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
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color={textColor} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: textColor }]}>{t('reportCard', 'Report Card')}</Text>
              <Text style={[styles.headerSubtitle, { color: subtextColor }]}>{transSelectedName}</Text>
            </View>

            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <Feather name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {reportCards.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F8FAFC' }]}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={64} color={isDark ? '#0284C7' : '#CBD5E1'} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>{t('noReportCards', 'No Report Cards')}</Text>
            <Text style={[styles.emptyDesc, { color: subtextColor }]}>{t('noReportCardsDesc', 'There are no report cards published for this student yet.')}</Text>
          </View>
        ) : (
          reportCards.map((report) => (
            <ReportCardItem
              key={report.id}
              report={report}
              selectedStudent={selectedStudent}
              isDark={isDark}
              cardColor={cardColor}
              borderColor={borderColor}
              textColor={textColor}
              subtextColor={subtextColor}
              t={t}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, fontWeight: '500' },
  headerWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockedIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockedTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  lockedDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  
  reportCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  termName: {
    fontSize: 14,
    fontWeight: '600',
  },
  gradeBadge: {
    backgroundColor: '#0ea5e9',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  studentDetailsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  marksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  marksBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  marksLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  marksValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  remarksContainer: {
    padding: 12,
    borderRadius: 12,
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  }
});

export default ReportCardScreen;
