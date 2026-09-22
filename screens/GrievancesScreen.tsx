import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  StatusBar, 
  StyleSheet, 
  TextInput,
  Alert,
  TouchableOpacity,
  Platform
} from 'react-native';
import { useStudent } from '../hooks/useStudent';
import { getStudentGrievances, submitGrievance } from '../services/grievances';
import { Grievance } from '../types';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';

const GrievanceItem = ({ grievance, cardColor, borderColor, textColor, subtextColor, styles }: any) => {
  const transMessage = useTransliteration(grievance.message);

  return (
    <View style={[styles.grievanceCard, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.grievanceHeader}>
        <Feather name="alert-circle" size={18} color="#0284C7" />
        <Text style={[styles.grievanceDate, { color: subtextColor }]}>
          {new Date(grievance.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.grievanceMessage, { color: textColor }]}>
        {transMessage}
      </Text>
    </View>
  );
};

const GrievancesScreen = () => {
  const navigation = useNavigation();
  const { selectedStudent } = useStudent();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const inputBg = isDark ? '#334155' : '#F1F5F9';

  const loadGrievances = async () => {
    if (selectedStudent) {
      setLoading(true);
      const data = await getStudentGrievances(selectedStudent.id);
      setGrievances(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrievances();
  }, [selectedStudent]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a grievance message.');
      return;
    }
    if (!selectedStudent) return;

    setSubmitting(true);
    const result = await submitGrievance(selectedStudent.id, selectedStudent.school_id, message.trim());
    setSubmitting(false);

    if (result.success) {
      Alert.alert('Success', 'Your grievance has been submitted to the school admins.');
      setMessage('');
      loadGrievances();
    } else {
      Alert.alert('Submission Failed', result.error || 'An error occurred.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={[styles.loadingText, { color: subtextColor }]}>{t('loadingGrievances', 'Loading Grievances...')}</Text>
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
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color={textColor} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: textColor }]}>{t('grievances', 'Grievances')}</Text>
              <Text style={[styles.headerSubtitle, { color: subtextColor }]}>{t('reportIssues', 'Report Issues')}</Text>
            </View>

            <TouchableOpacity
              style={styles.iconButton}
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
      >
        <View style={[styles.formCard, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.formTitle, { color: textColor }]}>{t('submitNewGrievance', 'Submit New Grievance')}</Text>
          <Text style={[styles.formSubtitle, { color: subtextColor }]}>{t('grievanceLimitDesc', 'Only one grievance can be submitted per day on behalf of the student.')}</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholder={t('describeIssue', 'Describe the issue in detail...')}
            placeholderTextColor={subtextColor}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Feather name="send" size={18} color="#FFF" style={styles.submitIcon} />
                <Text style={styles.submitButtonText}>{t('submitGrievanceBtn', 'Submit Grievance')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('pastGrievances', 'Past Grievances')}</Text>

        {grievances.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F8FAFC' }]}>
              <Feather name="inbox" size={48} color={isDark ? '#0284C7' : '#CBD5E1'} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>{t('noGrievances', 'No Grievances')}</Text>
            <Text style={[styles.emptyDesc, { color: subtextColor }]}>{t('noGrievancesDesc', "You haven't submitted any grievances yet.")}</Text>
          </View>
        ) : (
          grievances.map((grievance) => (
            <GrievanceItem
              key={grievance.id}
              grievance={grievance}
              cardColor={cardColor}
              borderColor={borderColor}
              textColor={textColor}
              subtextColor={subtextColor}
              styles={styles}
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
  formCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  formSubtitle: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitIcon: { marginRight: 8 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, marginLeft: 4 },
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
  grievanceCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  grievanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  grievanceDate: { fontSize: 13, fontWeight: '600', marginLeft: 6 },
  grievanceMessage: { fontSize: 15, lineHeight: 22 },
});

export default GrievancesScreen;
