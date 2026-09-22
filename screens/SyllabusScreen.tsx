import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, StatusBar, Modal } from 'react-native';
import { useStudent } from '../hooks/useStudent';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getSyllabusByClass, SyllabusItem } from '../services/syllabus';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTransliteration } from '../hooks/useTransliteration';
import { useRealtimeData } from '../hooks/useRealtimeData';

const SyllabusItemCard = ({ item, getSubjectColor, cardBg, borderColor, textColor, subtextColor, isDark, t, styles }: any) => {
  const transSubject = useTransliteration(item.subject);
  const transChapterName = useTransliteration(item.chapter_name);
  const transDescription = useTransliteration(item.description);

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={[styles.subjectBadge, { backgroundColor: getSubjectColor(item.subject) + '20' }]}>
        <Text style={[styles.subjectText, { color: getSubjectColor(item.subject) }]}>
          {transSubject ? transSubject.toUpperCase() : item.subject.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.itemTitle, { color: textColor }]}>{transChapterName}</Text>
      {item.description ? (
        <Text style={[styles.itemDesc, { color: subtextColor }]}>{transDescription}</Text>
      ) : null}
      
      {item.attachment_url && (
        <TouchableOpacity style={[styles.downloadButton, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
          <Feather name="download" size={16} color="#0284c7" />
          <Text style={styles.downloadText}>{t('downloadPdf', 'Download PDF')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const SyllabusScreen = () => {
  const { selectedStudent } = useStudent();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();
  
  const { data: allSyllabus, loading } = useRealtimeData<SyllabusItem>('syllabus', selectedStudent?.school_id);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  // Filter syllabus by student class
  const syllabus = allSyllabus.filter(s => s.class === selectedStudent?.class);

  const onRefresh = async () => {
    setRefreshing(true);
    // Real-time handles updates, just timeout for UX
    setTimeout(() => setRefreshing(false), 1000);
    setRefreshing(false);
  };

  const getSubjectColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('math')) return '#3b82f6';
    if (s.includes('sci')) return '#10b981';
    if (s.includes('eng')) return '#f59e0b';
    if (s.includes('hist') || s.includes('soc')) return '#8b5cf6';
    return '#0284c7';
  };

  if (!selectedStudent) return null;

  const subjects = Array.from(new Set(syllabus.map(s => s.subject)));
  const filteredSyllabus = selectedSubject ? syllabus.filter(s => s.subject === selectedSubject) : syllabus;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[{ backgroundColor: cardBg, zIndex: 10 }]}>
        <View style={[{ backgroundColor: cardBg, paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 40, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: borderColor }]}>
          <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity 
                style={{ padding: 10, marginRight: 15, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#F1F5F9' }} 
                onPress={() => (navigation as any).goBack()}
              >
                <Feather name="arrow-left" size={24} color={textColor} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 28, fontWeight: '900', letterSpacing: -0.5, color: textColor }]} numberOfLines={1}>{t('class', 'Class')} {selectedStudent.class} {t('syllabus', 'Syllabus')}</Text>
                <Text style={[{ fontSize: 14, fontWeight: '700', marginTop: 4, color: subtextColor }]}>{t('academicYear', 'Academic Year')} 2026-27</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={{ padding: 10, borderRadius: 12, backgroundColor: isDark ? '#334155' : '#F1F5F9', marginLeft: 10 }}
              onPress={() => (navigation as any).dispatch(DrawerActions.openDrawer())}
            >
              <Feather name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>
        
        {!loading && subjects.length > 0 && (
          <View style={{ paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: borderColor, backgroundColor: bgColor, zIndex: 10 }}>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: borderColor }}
              onPress={() => setShowDropdown(true)}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                {selectedSubject ? selectedSubject.toUpperCase() : t('allSubjects', 'All Subjects')}
              </Text>
              <Feather name="chevron-down" size={20} color={subtextColor} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 10, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: borderColor }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textColor }}>{t('selectSubject', 'Select Subject')}</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Feather name="x" size={24} color={subtextColor} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: borderColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                onPress={() => { setSelectedSubject(null); setShowDropdown(false); }}
              >
                <Text style={{ fontSize: 16, fontWeight: selectedSubject === null ? '800' : '500', color: selectedSubject === null ? '#0284c7' : textColor }}>{t('allSubjects', 'All Subjects')}</Text>
                {selectedSubject === null && <Feather name="check" size={20} color="#0284c7" />}
              </TouchableOpacity>
              {subjects.map(subject => (
                <TouchableOpacity
                  key={subject}
                  style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: borderColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  onPress={() => { setSelectedSubject(subject); setShowDropdown(false); }}
                >
                  <Text style={{ fontSize: 16, fontWeight: selectedSubject === subject ? '800' : '500', color: selectedSubject === subject ? '#0284c7' : textColor }}>{subject.toUpperCase()}</Text>
                  {selectedSubject === subject && <Feather name="check" size={20} color="#0284c7" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0284c7" />}
        >
          {filteredSyllabus.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="book-open-blank-variant" size={64} color={subtextColor} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: textColor }]}>{t('noSyllabusFound', 'No syllabus found')}</Text>
            </View>
          ) : (
            filteredSyllabus.map((item) => (
              <SyllabusItemCard
                key={item.id}
                item={item}
                getSubjectColor={getSubjectColor}
                cardBg={cardBg}
                borderColor={borderColor}
                textColor={textColor}
                subtextColor={subtextColor}
                isDark={isDark}
                t={t}
                styles={styles}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  headerSubtitle: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  subjectBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  subjectText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  itemTitle: { fontSize: 20, fontWeight: '900', marginBottom: 12, lineHeight: 28 },
  itemDesc: { fontSize: 15, lineHeight: 24, fontWeight: '500', marginBottom: 10 },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  downloadText: { color: '#0284c7', fontWeight: '900', marginLeft: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '800', marginTop: 15 },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default SyllabusScreen;
