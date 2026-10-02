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
import { getApprovedAdmitCards, getSchoolSettings } from '../services/exams';
import { ReportCard } from '../types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
  const [admitCards, setAdmitCards] = useState<any[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
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
      Promise.all([
        getStudentReportCards(selectedStudent.id),
        getApprovedAdmitCards(selectedStudent),
        getSchoolSettings(selectedStudent.school_id)
      ]).then(([reportsData, admitCardsData, settingsData]) => {
        setReportCards(reportsData);
        setAdmitCards(admitCardsData);
        setSchoolSettings(settingsData);
        setLoading(false);
      });
    }
  }, [selectedStudent]);

  const downloadAdmitCard = async (admitCard: any) => {
    try {
      const schoolName = selectedStudent?.schools?.name || 'School Name';
      const schoolAddress = selectedStudent?.schools?.address || 'School Address';
      const affiliationNo = schoolSettings?.affiliation_number || '';
      const schoolBoard = schoolSettings?.school_board || '';
      const schoolCode = schoolSettings?.school_code || '';
      const principalName = schoolSettings?.principal_name || '';
      const academicSession = selectedStudent?.session || '2026-2027';

      // Build header info line from school settings
      const headerInfoParts: string[] = [];
      if (affiliationNo) headerInfoParts.push(`Affiliation No: <strong>${affiliationNo}</strong>`);
      if (schoolBoard) headerInfoParts.push(`Board: <strong>${schoolBoard}</strong>`);
      if (schoolCode) headerInfoParts.push(`School Code: <strong>${schoolCode}</strong>`);
      const headerInfoLine = headerInfoParts.length > 0 ? `<p class="school-meta">${headerInfoParts.join(' &nbsp;•&nbsp; ')}</p>` : '';

      const html = `
        <html>
          <head>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; display: flex; justify-content: center; background: #fff; }
              .card { width: 100%; max-width: 800px; min-height: 500px; padding: 30px; box-sizing: border-box; border: 2px solid black; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; }
              .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 2px solid black; gap: 16px; }
              .school-info { flex: 1; text-align: center; }
              .school-name { font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0; color: #000; }
              .school-address { font-size: 12px; color: #444; margin: 4px 0; }
              .school-meta { font-size: 10px; color: #333; margin: 2px 0 0; }
              .badge-container { text-align: center; margin: 16px 0; }
              .badge { background: black; color: white; padding: 6px 24px; border-radius: 999px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
              .main-body { display: flex; gap: 16px; align-items: flex-start; margin-top: 8px; }
              .details { flex: 3; font-size: 13px; display: flex; flex-direction: column; gap: 8px; }
              .row { display: flex; gap: 8px; }
              .row-bg { background: #f3f4f6; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px; }
              .col { flex: 1; }
              .label { color: #4b5563; font-weight: 500; }
              .val { color: #000; font-weight: 700; }
              .val-green { color: #047857; font-weight: 700; }
              .photo-section { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
              .photo-box { width: 96px; height: 112px; border: 2px solid #9ca3af; border-radius: 4px; background: #f9fafb; display: flex; align-items: center; justify-content: center; overflow: hidden; }
              .sign-box { width: 100%; height: 48px; border: 1px dashed #d1d5db; border-radius: 4px; background: #f8fafc; display: flex; align-items: center; justify-content: center; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; }
              th { border: 1px solid #d1d5db; background: #f3f4f6; padding: 8px; text-align: left; font-weight: 600; }
              td { border: 1px solid #e5e7eb; padding: 8px; }
              .footer { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; }
              .signature { text-align: center; }
              .sign-line { width: 140px; border-bottom: 1px solid black; margin-bottom: 6px; }
              .sign-text { font-size: 11px; font-weight: 600; }
              .notice { font-size: 9px; color: #6b7280; margin-top: 16px; text-align: left; font-weight: 500; }
            </style>
          </head>
          <body>
            <div class="card">
              <div>
                <div class="header">
                  <div class="school-info">
                    <h2 class="school-name">${schoolName}</h2>
                    <p class="school-address">${schoolAddress}</p>
                    ${headerInfoLine}
                  </div>
                </div>
                
                <div class="badge-container">
                  <span class="badge">Admit Card • Session ${academicSession}</span>
                </div>
                
                <div class="main-body">
                  <div class="details">
                     <div class="row row-bg">
                        <div class="col"><span class="label">Examination:</span> <span class="val" style="text-transform: uppercase;">${admitCard.seriesName}</span></div>
                     </div>
                     <div class="row">
                        <div class="col"><span class="label">Student Name:</span> <span class="val">${selectedStudent?.name}</span></div>
                        <div class="col"><span class="label">Admission No:</span> <span class="val">${selectedStudent?.admission_number || selectedStudent?.sr_number || 'N/A'}</span></div>
                     </div>
                     <div class="row">
                        <div class="col"><span class="label">Roll Number:</span> <span class="val">${selectedStudent?.roll_id || selectedStudent?.roll_number || 'N/A'}</span></div>
                        <div class="col"><span class="label">Class & Section:</span> <span class="val-green">${selectedStudent?.class} ${selectedStudent?.section || ''}</span></div>
                     </div>
                     <div class="row">
                        <div class="col"><span class="label">Father's Name:</span> <span class="val" style="font-weight: 600;">${selectedStudent?.father_name || 'N/A'}</span></div>
                        <div class="col"><span class="label">Mother's Name:</span> <span class="val" style="font-weight: 600;">${selectedStudent?.mother_name || 'N/A'}</span></div>
                     </div>
                     <div class="row">
                        <div class="col"><span class="label">Date of Birth:</span> <span class="val" style="font-weight: 600;">${selectedStudent?.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'}</span></div>
                        <div class="col"><span class="label">Contact Phone:</span> <span class="val" style="font-weight: 600; font-family: monospace;">${selectedStudent?.parent_phone || 'N/A'}</span></div>
                     </div>
                  </div>
                  
                  <div class="photo-section">
                     <div class="photo-box">
                       ${selectedStudent?.photo_url ? `<img src="${selectedStudent.photo_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span style="font-size: 10px; font-weight: bold; color: #9ca3af; text-transform: uppercase;">Affix Photo</span>`}
                     </div>
                     <div class="sign-box">
                       <span style="font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Candidate Signature</span>
                     </div>
                  </div>
                </div>
                
                <table>
                  <thead>
                    <tr>
                      <th style="text-align: center; width: 50px;">S.No</th>
                      <th>Date</th>
                      <th>Subject</th>
                      <th>Timings</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${admitCard.exams.map((ex: any, idx: number) => {
                      const exDuration = ex.duration || 180;
                      const startHour = 9;
                      const endMinutes = (startHour * 60) + exDuration;
                      const endH = Math.floor(endMinutes / 60);
                      const endM = endMinutes % 60;
                      const ampm = endH >= 12 ? 'PM' : 'AM';
                      const displayH = endH > 12 ? endH - 12 : (endH === 0 ? 12 : endH);
                      const displayTime = `09:00 AM - ${displayH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')} ${ampm}`;
                      
                      return `
                      <tr>
                        <td style="text-align: center;">${idx + 1}</td>
                        <td>${new Date(ex.date + "T00:00:00").toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td style="font-weight: 600; color: #111827;">${ex.subject || ex.name}</td>
                        <td style="font-family: monospace;">${displayTime}</td>
                      </tr>
                    `}).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="footer">
                <div class="signature">
                  <div class="sign-line"></div>
                  <span class="sign-text">Class Teacher</span>
                </div>
                <div class="signature">
                  <div class="sign-line"></div>
                  <span class="sign-text">Accountant / Seal</span>
                </div>
                <div class="signature">
                  <div class="sign-line"></div>
                  <span class="sign-text">${principalName ? principalName + '<br/>' : ''}Principal / Controller</span>
                </div>
              </div>
              <p class="notice">• Entry without this Admit Card is strictly prohibited in the Examination Hall.</p>
            </div>
          </body>
        </html>
      `;
      await Print.printAsync({ html });
    } catch (error) {
      console.error(error);
    }
  };

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
        {admitCards.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 12 }}>{t('admitCards', 'Admit Cards')}</Text>
            {admitCards.map((ac, idx) => (
              <View key={idx} style={[styles.reportCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={[styles.gradeBadge, { backgroundColor: '#f59e0b' }]}>
                    <Feather name="file-text" size={24} color="#FFF" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{ac.seriesName} Admit Card</Text>
                    <Text style={{ fontSize: 13, color: subtextColor }}>{t('examDate', 'Scheduled')}: {ac.exams.length} Subjects</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={{ backgroundColor: '#0284c7', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  onPress={() => downloadAdmitCard(ac)}
                >
                  <Feather name="download" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>{t('downloadAdmitCard', 'Download Admit Card')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 12, display: reportCards.length > 0 ? 'flex' : 'none' }}>{t('reportCard', 'Results')}</Text>
        
        {reportCards.length === 0 && admitCards.length === 0 ? (
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
