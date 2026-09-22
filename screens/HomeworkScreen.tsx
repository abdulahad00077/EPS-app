import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  StatusBar, 
  RefreshControl, 
  StyleSheet, 
  Dimensions, 
  Platform 
} from 'react-native';
import { useStudent } from '../hooks/useStudent';
import { getStudentHomework, getHomeworkSubmissions } from '../services/homework';
import { Homework } from '../types';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeworkCard = ({ item, isDark, cardColor, borderColor, bgColor, textColor, subtextColor, getStatus, t }: any) => {
  const transTitle = useTransliteration(item.title);
  const transDesc = useTransliteration(item.description);
  
  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      style={[styles.homeworkCard, { backgroundColor: cardColor, borderColor }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.typeIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
          <Feather name="file-text" size={24} color="#0284C7" />
        </View>
        <View style={styles.titleSection}>
          <Text style={[styles.homeworkTitle, { color: textColor }]}>{transTitle}</Text>
          <View style={styles.metaRow}>
            <Feather name="clock" size={12} color={subtextColor} />
            <Text style={[styles.metaText, { color: subtextColor }]}>{t('assigned', 'ASSIGNED').toUpperCase()} {new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.description, { color: subtextColor }]} numberOfLines={3}>
        {transDesc}
      </Text>
      
      <View style={[styles.cardFooter, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor }]}>
        <View style={styles.dueBadge}>
          <Feather name="calendar" size={16} color="#EA580C" />
          <Text style={styles.dueText}>
            {t('dueDate')}: {new Date(item.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <View style={[
          styles.arrowBadge,
          { backgroundColor: getStatus(item.id, item.due_date) === 'submitted' ? '#10B981' : getStatus(item.id, item.due_date) === 'late' ? '#F59E0B' : '#64748B' }
        ]}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
            {getStatus(item.id, item.due_date) === 'submitted' ? t('submitted', 'Submitted') : getStatus(item.id, item.due_date) === 'late' ? t('late', 'Late') : t('pending', 'Pending')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeworkScreen = () => {
  const navigation = useNavigation();
  const { selectedStudent } = useStudent();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#F1F5F9';

  const fetchHomework = useCallback(async () => {
    if (selectedStudent) {
      try {
        const data = await getStudentHomework(selectedStudent.class, selectedStudent.section);
        const subs = await getHomeworkSubmissions(selectedStudent.id);
        setHomework(data);
        setSubmissions(subs);
      } catch (error) {
        console.error('Error fetching homework:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [selectedStudent]);

  useEffect(() => {
    setLoading(true);
    fetchHomework();
  }, [fetchHomework]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomework();
  }, [fetchHomework]);

  const getStatus = (hwId: string, dueDateStr: string): 'submitted' | 'pending' | 'late' => {
    const submitDateStr = submissions[hwId];
    if (!submitDateStr) return 'pending';
    const submitDate = new Date(submitDateStr);
    const dueDate = new Date(dueDateStr);
    
    // Set time to end of day for due date comparison
    dueDate.setHours(23, 59, 59, 999);
    
    if (submitDate > dueDate) return 'late';
    return 'submitted';
  };

  if (loading && !refreshing) {
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
          <View style={[styles.headerTop, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={{ padding: 8, marginRight: 12, borderRadius: 12, backgroundColor: 'rgba(148, 163, 184, 0.1)' }} 
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={24} color={textColor} />
              </TouchableOpacity>
              <View>
                <Text style={[styles.headerTitle, { color: textColor }]}>{t('homework', 'Homework')}</Text>
                <Text style={[styles.headerSubtitle, { color: subtextColor }]}>{t('dailyHomework', 'Daily Homework')} - {selectedStudent?.class}</Text>
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

      <ScrollView 
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284c7" />}
      >
        {homework.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F8FAFC' }]}>
              <Feather name="book-open" size={64} color={isDark ? '#0284C7' : '#CBD5E1'} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>{t('noHomeworkYet', 'No Homework Yet')}</Text>
            <Text style={[styles.emptyDesc, { color: subtextColor }]}>{t('homeworkWillAppearHere', 'Daily assignments and project details will appear here as soon as they are assigned.')}</Text>
          </View>
        ) : (
          homework.map((item) => (
            <HomeworkCard
              key={item.id}
              item={item}
              isDark={isDark}
              cardColor={cardColor}
              borderColor={borderColor}
              bgColor={bgColor}
              textColor={textColor}
              subtextColor={subtextColor}
              getStatus={getStatus}
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 15, fontWeight: '600' },
  flex1: { flex: 1 },
  headerWrapper: { zIndex: 10 },
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: 25, paddingHorizontal: 25, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  menuButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  emptyCard: { borderRadius: 40, padding: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2, marginTop: 30 },
  emptyIconBg: { padding: 24, borderRadius: 30, marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptyDesc: { fontSize: 14, marginTop: 10, textAlign: 'center', lineHeight: 20, fontWeight: '500' },
  homeworkCard: { borderRadius: 32, padding: 24, marginBottom: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  typeIconBg: { padding: 12, borderRadius: 16 },
  titleSection: { marginLeft: 15, flex: 1 },
  homeworkTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 10, fontWeight: '900', marginLeft: 5, letterSpacing: 0.5 },
  description: { fontSize: 15, lineHeight: 22, fontWeight: '500', marginBottom: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 20, borderWidth: 1 },
  dueBadge: { flexDirection: 'row', alignItems: 'center' },
  dueText: { color: '#BC4C0D', fontSize: 14, fontWeight: '900', marginLeft: 8, letterSpacing: -0.2 },
  arrowBadge: { backgroundColor: '#0284C7', padding: 8, borderRadius: 12 },
});

export default HomeworkScreen;
