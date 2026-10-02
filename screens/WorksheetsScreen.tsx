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
  Platform,
  Linking
} from 'react-native';
import { useStudent } from '../hooks/useStudent';
import { getStudentWorksheets } from '../services/worksheets';
import { Worksheet } from '../types';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TransliteratedText = ({ text }: { text: string }) => {
  const translated = useTransliteration(text);
  return <>{translated}</>;
};

const WorksheetCard = ({ item, isDark, cardColor, borderColor, bgColor, textColor, subtextColor, t }: any) => {
  const transTitle = useTransliteration(item.title);
  const transDesc = useTransliteration(item.description);
  const transSubj = useTransliteration(item.subject);
  
  const handleDownload = () => {
    if (item.file_url) {
      Linking.openURL(item.file_url);
    }
  };

  return (
    <View style={[styles.homeworkCard, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
          <Feather name="book-open" size={24} color="#0284C7" />
        </View>
        <View style={styles.titleSection}>
          <Text style={[styles.homeworkTitle, { color: textColor }]}>Worksheet</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.subjectBadge, { color: '#0284C7', backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#E0F2FE' }]}>
              {transSubj}
            </Text>
          </View>
        </View>
      </View>
      
      {(() => {
        let questions = [];
        try {
          if (item.description) {
            const parsed = JSON.parse(item.description);
            if (Array.isArray(parsed)) questions = parsed;
            else questions = [item.description];
          }
        } catch {
          if (item.description) questions = [item.description];
        }

        return questions.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            {questions.map((q: string, idx: number) => (
              <Text key={idx} style={[styles.description, { color: subtextColor, marginBottom: 4 }]} numberOfLines={3}>
                • <TransliteratedText text={q} />
              </Text>
            ))}
          </View>
        ) : null;
      })()}
      
      <View style={[styles.cardFooter, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor, flexWrap: 'wrap', gap: 10 }]}>
        <View style={styles.dueBadge}>
          <Feather name="calendar" size={16} color="#0284C7" />
          <Text style={[styles.dueText, { color: '#0284C7' }]}>
            {t('assigned', 'Assigned')}: {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        
        {item.due_date && (
          <View style={styles.dueBadge}>
            <Feather name="clock" size={16} color="#EA580C" />
            <Text style={styles.dueText}>
              {t('due', 'Due')}: {new Date(item.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        )}
        
        {item.file_url ? (
          <TouchableOpacity onPress={handleDownload} style={[styles.arrowBadge, { backgroundColor: '#10B981' }]}>
            <Feather name="download" size={16} color="#FFFFFF" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>
              {t('download', 'Download')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.arrowBadge, { backgroundColor: '#64748B' }]}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
              {t('noFile', 'No File')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const WorksheetsScreen = () => {
  const navigation = useNavigation();
  const { selectedStudent } = useStudent();
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  const uniqueSubjects = Array.from(new Set(worksheets.map(w => w.subject))).filter(Boolean) as string[];

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#F1F5F9';

  const fetchWorksheets = useCallback(async () => {
    if (selectedStudent) {
      try {
        const data = await getStudentWorksheets(selectedStudent.school_id, selectedStudent.class, selectedStudent.section);
        setWorksheets(data);
      } catch (error) {
        console.error('Error fetching worksheets:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [selectedStudent]);

  useEffect(() => {
    setLoading(true);
    fetchWorksheets();
  }, [fetchWorksheets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorksheets();
  }, [fetchWorksheets]);

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
                <Text style={[styles.headerTitle, { color: textColor }]}>{t('worksheets', 'Worksheets')}</Text>
                <Text style={[styles.headerSubtitle, { color: subtextColor }]}>{t('studyMaterials', 'Study Materials')} - {selectedStudent?.class}</Text>
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

      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>
          {dateFilter || subjectFilter ? t('filteredResults', 'Filtered Results') : t('allWorksheets', 'All Worksheets')}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {dateFilter && (
            <TouchableOpacity 
              onPress={() => setDateFilter(null)}
              style={{ padding: 6, backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRadius: 8 }}
            >
              <Feather name="x" size={16} color={textColor} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => setShowPicker(true)}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#E0F2FE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
          >
            <Feather name="calendar" size={16} color="#0284C7" style={{ marginRight: 6 }} />
            <Text style={{ color: '#0284C7', fontWeight: 'bold' }}>
              {dateFilter ? dateFilter.toLocaleDateString() : t('filterDate', 'Filter Date')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {uniqueSubjects.length > 0 && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: !subjectFilter ? '#0284C7' : (isDark ? '#334155' : '#E2E8F0'), marginRight: 10 }}
              onPress={() => setSubjectFilter(null)}
            >
              <Text style={{ color: !subjectFilter ? '#fff' : textColor, fontWeight: '600' }}>All</Text>
            </TouchableOpacity>
            {uniqueSubjects.map(sub => (
              <TouchableOpacity 
                key={sub}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: subjectFilter === sub ? '#0284C7' : (isDark ? '#334155' : '#E2E8F0'), marginRight: 10 }}
                onPress={() => setSubjectFilter(sub)}
              >
                <Text style={{ color: subjectFilter === sub ? '#fff' : textColor, fontWeight: '600' }}><TransliteratedText text={sub} /></Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}


      {showPicker && (
        <DateTimePicker
          value={dateFilter || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDateFilter(selectedDate);
          }}
        />
      )}

      <ScrollView 
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284c7" />}
      >
        {worksheets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F8FAFC' }]}>
              <Feather name="file-text" size={64} color={isDark ? '#0284C7' : '#CBD5E1'} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>{t('noWorksheetsYet', 'No Worksheets Yet')}</Text>
            <Text style={[styles.emptyDesc, { color: subtextColor }]}>{t('worksheetsWillAppearHere', 'Study materials and practice worksheets will appear here as soon as they are uploaded.')}</Text>
          </View>
        ) : (
          worksheets
            .filter(w => !dateFilter || new Date(w.date).toDateString() === dateFilter.toDateString())
            .filter(w => !subjectFilter || w.subject === subjectFilter)
            .map((item, index) => (
            <WorksheetCard
              key={`${item.id}-${index}`}
              item={item}
              isDark={isDark}
              cardColor={cardColor}
              borderColor={borderColor}
              bgColor={bgColor}
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
  subjectBadge: { fontSize: 10, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  description: { fontSize: 15, lineHeight: 22, fontWeight: '500', marginBottom: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 20, borderWidth: 1 },
  dueBadge: { flexDirection: 'row', alignItems: 'center' },
  dueText: { color: '#BC4C0D', fontSize: 14, fontWeight: '900', marginLeft: 8, letterSpacing: -0.2 },
  arrowBadge: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 12, borderRadius: 12 },
});

export default WorksheetsScreen;
