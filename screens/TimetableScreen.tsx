import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  StatusBar, 
  StyleSheet, 
  Platform, 
  Dimensions 
} from 'react-native';
import { useStudent } from '../hooks/useStudent';
import { getStudentTimetable } from '../services/timetable';
import { TimetableEntry } from '../types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';
import { useRealtimeData } from '../hooks/useRealtimeData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ClassCard = ({ entry, isDark, cardColor, borderColor, bgColor, textColor, subtextColor, index, isLast, t }: any) => {
  const transSubject = useTransliteration(entry.subject);
  const transTeacher = useTransliteration(entry.teachers?.name);
  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={[styles.classCard, { backgroundColor: cardColor, borderColor }]}
    >
      <View style={styles.timelineSection}>
        <View style={[styles.timeBadge, { backgroundColor: bgColor, borderColor }]}>
          <Text style={[styles.timeText, { color: textColor }]}>{entry.start_time}</Text>
        </View>
        {!isLast && (
          <View style={[styles.timelineLine, { backgroundColor: borderColor }]} />
        )}
      </View>

      <View style={styles.classInfo}>
        <View style={styles.classHeader}>
          <View style={styles.subjectSection}>
            <Text style={[styles.subjectName, { color: textColor }]}>{transSubject}</Text>
            <View style={styles.teacherRow}>
              <MaterialCommunityIcons name="school" size={12} color={subtextColor} />
              <Text style={[styles.teacherName, { color: subtextColor }]}>
                {transTeacher || t('assignedInstructor', 'Assigned Instructor')}
              </Text>
            </View>
          </View>
          <View style={[styles.bookIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
            <Feather name="book" size={16} color="#0284C7" />
          </View>
        </View>
        
        <View style={[styles.durationBadge, { backgroundColor: bgColor, borderColor }]}>
          <Feather name="clock" size={10} color={subtextColor} />
          <Text style={[styles.durationText, { color: subtextColor }]}>{t('endsAt', 'Ends at')} {entry.end_time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TimetableScreen = () => {
  const navigation = useNavigation();
  const { selectedStudent } = useStudent();
  
  const { data: allTimetable, loading } = useRealtimeData<TimetableEntry>('timetable', selectedStudent?.school_id);
  
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDay, setActiveDay] = useState(days[new Date().getDay() - 1] || 'Monday');

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#F1F5F9';

  const timetable = allTimetable.filter(t => t.class === selectedStudent?.class && t.section === selectedStudent?.section);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={[styles.loadingText, { color: subtextColor }]}>{t('loading')}</Text>
      </View>
    );
  }

  const daySchedule = timetable
    .filter(t => t.day_of_week === activeDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.headerWrapper, { backgroundColor: headerBg }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#ffffff', '#F8FAFC']}
          style={[styles.headerGradient, { borderBottomColor: borderColor }]}
        >
          <View style={[styles.headerTop, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={[styles.headerContent, { flexDirection: 'row', alignItems: 'center' }]}>
              <TouchableOpacity 
                style={{ padding: 8, marginRight: 12, borderRadius: 12, backgroundColor: 'rgba(148, 163, 184, 0.1)' }} 
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={24} color={textColor} />
              </TouchableOpacity>
              <View>
                <Text style={[styles.headerTitle, { color: textColor }]}>{t('timetable', 'Timetable')}</Text>
                <Text style={[styles.headerSubtitle, { color: subtextColor }]}>{t('classTimetable', 'Class Timetable')}</Text>
              </View>
              <View style={[styles.clockIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF', marginLeft: 10 }]}>
                 <Feather name="clock" size={24} color="#0284C7" />
              </View>
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

      {/* Modern Day Selector */}
      <View style={[styles.daySelectorContainer, { backgroundColor: bgColor }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.daySelectorScroll}
        >
          {days.map((day) => {
            const isActive = activeDay === day;
            return (
              <TouchableOpacity 
                key={day} 
                onPress={() => setActiveDay(day)}
                activeOpacity={0.8}
                style={[
                  styles.dayButton, 
                  isActive ? styles.dayButtonActive : [styles.dayButtonInactive, { backgroundColor: cardColor, borderColor }]
                ]}
              >
                <Text style={[
                  styles.dayButtonText, 
                  isActive ? styles.textWhite : { color: subtextColor }
                ]}>
                  {t((day.toLowerCase() + 'Short') as any, day.substring(0, 3))}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionHeader}>
          <Feather name="calendar" size={16} color="#0284C7" />
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t(activeDay.toLowerCase() as any, activeDay)} {t('classes', 'Classes')}</Text>
        </View>

        {daySchedule.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F8FAFC' }]}>
              <Feather name="clock" size={48} color={isDark ? '#0284C7' : '#CBD5E1'} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>{t('noClassesScheduled', 'No Classes Scheduled')}</Text>
            <Text style={[styles.emptyDesc, { color: subtextColor }]}>{t('enjoyYourBreak', 'Enjoy your break! There are no academic sessions planned for')} {t(activeDay.toLowerCase() as any, activeDay)}.</Text>
          </View>
        ) : (
          daySchedule.map((entry, index) => (
            <ClassCard
              key={entry.id}
              entry={entry}
              isDark={isDark}
              cardColor={cardColor}
              borderColor={borderColor}
              bgColor={bgColor}
              textColor={textColor}
              subtextColor={subtextColor}
              index={index}
              isLast={index === daySchedule.length - 1}
              t={t}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

// Styles below intact sans colors handled by logic
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 15, fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
  flex1: { flex: 1 },
  headerWrapper: { zIndex: 10 },
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: 20, paddingHorizontal: 25, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  menuButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  clockIconBg: { padding: 8, borderRadius: 12 },
  daySelectorContainer: { paddingVertical: 24 },
  daySelectorScroll: { paddingHorizontal: 24 },
  dayButton: { marginRight: 12, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayButtonActive: { backgroundColor: '#0284C7', borderColor: '#0284C7', shadowColor: '#0284C7', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 4 },
  dayButtonInactive: { },
  dayButtonText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  textWhite: { color: '#FFFFFF' },
  textGray: { color: '#94A3B8' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginLeft: 10 },
  emptyCard: { borderRadius: 40, padding: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2, marginTop: 10 },
  emptyIconBg: { padding: 24, borderRadius: 999, marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptyDesc: { fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  classCard: { borderRadius: 32, padding: 24, marginBottom: 5, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2, flexDirection: 'row' },
  timelineSection: { marginRight: 20, alignItems: 'center' },
  timeBadge: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 18, alignItems: 'center', borderWidth: 1 },
  timeText: { fontWeight: '900', fontSize: 12, letterSpacing: -0.5 },
  timelineLine: { width: 2, height: 48, marginVertical: 8 },
  classInfo: { flex: 1 },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  subjectSection: { flex: 1, paddingRight: 10 },
  subjectName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5, lineHeight: 24 },
  teacherRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  teacherName: { fontSize: 10, fontWeight: '900', marginLeft: 6, letterSpacing: 1, textTransform: 'uppercase' },
  bookIconBg: { padding: 8, borderRadius: 12 },
  durationBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, marginTop: 10 },
  durationText: { fontSize: 9, fontWeight: '900', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default TimetableScreen;
