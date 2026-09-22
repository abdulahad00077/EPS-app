import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  StatusBar, 
  StyleSheet, 
  Dimensions,
  Image
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useStudent } from '../hooks/useStudent';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SwitchStudentItem = ({ student, isActive, isLast, isDark, subtextColor, activeIconBg, activeIconBorder, borderColor, selectStudent, t, styles }: any) => {
  const transName = useTransliteration(student.name);
  return (
    <TouchableOpacity 
      onPress={() => selectStudent(student)}
      activeOpacity={0.7}
      style={[
        styles.studentItem,
        isActive ? (isDark ? { backgroundColor: 'rgba(2,132,199,0.1)' } : styles.studentItemActive) : null,
        !isLast ? [styles.borderBottom, { borderBottomColor: borderColor }] : null
      ]}
    >
      <View style={[
        styles.itemAvatar, 
        isActive ? [styles.itemAvatarActive, { backgroundColor: isDark ? '#0ea5e9' : '#E0F2FE' }] : [styles.itemAvatarInactive, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]
      ]}>
        <Text style={[
          styles.itemAvatarText,
          isActive ? [styles.textActive, { color: isDark ? '#FFFFFF' : '#0284C7' }] : [styles.textInactive, { color: subtextColor }]
        ]}>
          {transName?.charAt(0) || 'S'}
        </Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={[
          styles.itemName,
          isActive ? [styles.itemNameActive, { color: isDark ? '#e0f2fe' : '#0C4A6E' }] : [styles.itemNameInactive, { color: subtextColor }]
        ]}>{transName}</Text>
        <Text style={styles.itemClass}>{t('class', 'CLASS').toUpperCase()} {student.class}</Text>
      </View>
      {isActive ? (
        <View style={[styles.activeIndicator, { backgroundColor: activeIconBg, borderColor: activeIconBorder }]} />
      ) : (
        <Feather name="chevron-right" size={18} color="#CBD5E1" />
      )}
    </TouchableOpacity>
  );
};

const ProfileScreen = () => {
  const { signOut, user, switchRole, teacher } = useAuth();
  const { selectedStudent, students, selectStudent } = useStudent();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  
  const transSchoolName = useTransliteration(selectedStudent?.schools?.name);
  const transName = useTransliteration(selectedStudent?.name);
  const transFatherName = useTransliteration(selectedStudent?.father_name);
  const transFatherOcc = useTransliteration(selectedStudent?.father_occupation);
  const transMotherName = useTransliteration(selectedStudent?.mother_name);
  const transMotherOcc = useTransliteration(selectedStudent?.mother_occupation);

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#F1F5F9';
  const activeIconBg = isDark ? '#0284C7' : '#E0F2FE';
  const activeIconBorder = isDark ? '#0ea5e9' : '#0284C7';

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
                <Text style={[styles.headerTitle, { color: textColor }]}>{t('profile', 'Profile')}</Text>
                <Text style={[styles.headerSubtitle, { color: subtextColor }]}>{t('accountSettingsStudents', 'Account Settings & Students')}</Text>
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
      >
        {/* Parent Info Card (Now showing Student Info as per request) */}
        <View style={[styles.parentCard, { backgroundColor: cardColor, borderColor }]}>
          {selectedStudent?.photo_url ? (
            <Image 
              source={{ uri: selectedStudent.photo_url }} 
              style={[styles.avatarContainer, { padding: 0 }]} 
            />
          ) : (
            <LinearGradient
              colors={isDark ? ['#334155', '#1E293B'] : ['#F1F5F9', '#E2E8F0']}
              style={styles.avatarContainer}
            >
              <Feather name="user" size={56} color={subtextColor} />
            </LinearGradient>
          )}
          <Text style={[styles.parentName, { color: textColor }]}>{transName || selectedStudent?.name || t('appName')}</Text>
          <View style={[styles.phoneBadge, { backgroundColor: bgColor, borderColor }]}>
            <Feather name="phone" size={14} color="#0284C7" />
            <Text style={[styles.phoneText, { color: subtextColor }]}>{user?.phone}</Text>
          </View>
        </View>

        {/* sibling Switcher */}
        {students.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t('switchStudent', 'Switch Student')}</Text>
              <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
                <Text style={styles.countText}>{students.length} {t('childrenConnected', 'Children Connected')}</Text>
              </View>
            </View>
            <View style={[styles.studentListCard, { backgroundColor: cardColor, borderColor }]}>
              {students.map((student, index) => {
                const isActive = selectedStudent?.id === student.id;
                const isLast = index === students.length - 1;
                return (
                  <SwitchStudentItem
                    key={student.id}
                    student={student}
                    isActive={isActive}
                    isLast={isLast}
                    isDark={isDark}
                    subtextColor={subtextColor}
                    activeIconBg={activeIconBg}
                    activeIconBorder={activeIconBorder}
                    borderColor={borderColor}
                    selectStudent={selectStudent}
                    t={t}
                    styles={styles}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Student Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitleOutside, { color: textColor }]}>{t('studentProfile')}</Text>
          <View style={[styles.detailsCard, { backgroundColor: cardColor, borderColor }]}>
            {/* Identity Details */}
            <View style={styles.detailItem}>
              <View style={[styles.detailIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
                <Feather name="info" size={16} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.detailLabel}>{t('rollNumber', 'Roll Number')}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {selectedStudent?.roll_number || selectedStudent?.roll_id || selectedStudent?.admission_number || t('notAssigned', 'NOT ASSIGNED')}
                </Text>
              </View>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: borderColor }]} />

            <View style={styles.detailItem}>
              <View style={[styles.detailIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
                <MaterialCommunityIcons name="town-hall" size={16} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.detailLabel}>{t('schoolName', 'School Name')}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{transSchoolName || t('notAvailable', 'Not Available')}</Text>
              </View>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: borderColor }]} />
            
            <View style={styles.detailItem}>
              <View style={[styles.detailIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
                <MaterialCommunityIcons name="card-account-details-outline" size={16} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.detailLabel}>{t('aadhaarNumber', 'Aadhaar Number')}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{selectedStudent?.student_aadhaar || t('notUpdated', 'Not Updated')}</Text>
              </View>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: borderColor }]} />

            <View style={styles.detailItem}>
              <View style={[styles.detailIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
                <Feather name="shield" size={16} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.detailLabel}>{t('apaarAbcId', 'APAAR / ABC ID')}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{selectedStudent?.apaar_abc_id || t('notUpdated', 'Not Updated')}</Text>
              </View>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: borderColor }]} />

            {/* Academic Details */}
            <View style={styles.detailItem}>
              <View style={[styles.detailIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
                <Feather name="calendar" size={16} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.detailLabel}>{t('academicSession', 'Academic Session')}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{selectedStudent?.session || 'Academic Year 2026-27'}</Text>
              </View>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: borderColor }]} />
            
            <View style={styles.detailItem}>
              <View style={[styles.detailIconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#F0F9FF' }]}>
                <MaterialCommunityIcons name="school" size={16} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.detailLabel}>{t('classAndSection')}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{selectedStudent?.class}{selectedStudent?.section ? ` - ${selectedStudent.section}` : ''}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Parent / Guardian Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitleOutside, { color: textColor }]}>{t('parentGuardianDetails', 'Parent / Guardian Details')}</Text>
          <View style={[styles.detailsCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.detailItem}>
              {selectedStudent?.father_photo_url ? (
                <Image source={{ uri: selectedStudent.father_photo_url }} style={styles.parentPhoto} />
              ) : (
                <View style={[styles.detailIconBg, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
                  <Feather name="user" size={16} color="#10B981" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{t('father', 'Father:')} {transFatherName || 'N/A'}</Text>
                <Text style={[styles.detailValue, { color: textColor, fontSize: 13 }]}>
                  {selectedStudent?.father_qualification ? `${selectedStudent.father_qualification} • ` : ''}
                  {transFatherOcc || t('occupationNA', 'Occupation N/A')}
                </Text>
              </View>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: borderColor }]} />
            
            <View style={styles.detailItem}>
              {selectedStudent?.mother_photo_url ? (
                <Image source={{ uri: selectedStudent.mother_photo_url }} style={styles.parentPhoto} />
              ) : (
                <View style={[styles.detailIconBg, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
                  <Feather name="user" size={16} color="#10B981" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{t('mother', 'Mother:')} {transMotherName || 'N/A'}</Text>
                <Text style={[styles.detailValue, { color: textColor, fontSize: 13 }]}>
                  {selectedStudent?.mother_qualification ? `${selectedStudent.mother_qualification} • ` : ''}
                  {transMotherOcc || t('occupationNA', 'Occupation N/A')}
                </Text>
              </View>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: borderColor }]} />

            <View style={styles.detailItem}>
              <View style={[styles.detailIconBg, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }]}>
                <Feather name="file-text" size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.detailLabel}>{t('parentAadhaarPan', 'Parent Aadhaar / PAN')}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {selectedStudent?.parent_aadhaar || t('aadhaarNA', 'Aadhaar N/A')} • {selectedStudent?.parent_pan || t('panNA', 'PAN N/A')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Documents Details */}
        {(selectedStudent?.student_aadhaar_doc_url || selectedStudent?.father_aadhaar_doc_url || selectedStudent?.mother_aadhaar_doc_url || selectedStudent?.tc_doc_url || selectedStudent?.marksheet_doc_url || selectedStudent?.birth_certificate_doc_url) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitleOutside, { color: textColor }]}>{t('documents' as any, 'Added Documents')}</Text>
            <View style={[styles.detailsCard, { backgroundColor: cardColor, borderColor }]}>
              {[
                { url: selectedStudent?.student_aadhaar_doc_url, label: t('studentAadhaar' as any, 'Student Aadhaar') },
                { url: selectedStudent?.father_aadhaar_doc_url, label: t('fatherAadhaar' as any, 'Father Aadhaar') },
                { url: selectedStudent?.mother_aadhaar_doc_url, label: t('motherAadhaar' as any, 'Mother Aadhaar') },
                { url: selectedStudent?.tc_doc_url, label: t('tc' as any, 'Transfer Certificate') },
                { url: selectedStudent?.marksheet_doc_url, label: t('marksheet' as any, 'Marksheet') },
                { url: selectedStudent?.birth_certificate_doc_url, label: t('birthCertificate' as any, 'Birth Certificate') }
              ].map((doc, index) => doc.url ? (
                <React.Fragment key={doc.label}>
                  <View style={styles.detailItem}>
                    <View style={[styles.detailIconBg, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#F0F9FF' }]}>
                      <Feather name="file-text" size={16} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>{doc.label}</Text>
                      <Text style={[styles.detailValue, { color: textColor, fontSize: 13 }]} numberOfLines={1}>
                        {doc.url.split('/').pop()?.split('?')[0] || t('documentAttached' as any, 'Document Attached')}
                      </Text>
                    </View>
                  </View>
                  {index < 5 && <View style={[styles.detailDivider, { backgroundColor: borderColor }]} />}
                </React.Fragment>
              ) : null)}
            </View>
          </View>
        )}

        {/* Global Options */}
        {teacher && (
          <View style={[styles.optionsCard, { backgroundColor: cardColor, borderColor }]}>
            <TouchableOpacity onPress={() => switchRole('teacher')} style={styles.logoutItem}>
              <View style={[styles.optionIconBg, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF' }]}>
                <Feather name="briefcase" size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.logoutText, { color: '#3B82F6' }]}>Switch to Teacher Mode</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.versionInfo}>
          <View style={styles.versionRow}>
            <MaterialCommunityIcons name="school" size={16} color={borderColor} />
            <Text style={[styles.versionBrand, { color: borderColor }]}>Mera Elegant</Text>
          </View>
          <Text style={[styles.versionNumber, { color: borderColor }]}>RELEASE v1.1.0-PREMIUM</Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Slightly edited styles to remove hardcoded bg/text colors
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  headerWrapper: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 25,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuButton: {
    padding: 4,
    marginLeft: -4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  parentCard: {
    borderRadius: 40,
    padding: 32,
    marginBottom: 35,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 5,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  parentName: {
    fontSize: 24,
    fontWeight: '900',
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  phoneText: {
    fontWeight: '800',
    marginLeft: 10,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 35,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  sectionTitleOutside: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '800',
  },
  studentListCard: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  studentItemActive: {
    backgroundColor: '#F0F9FF',
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  itemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAvatarActive: {
  },
  itemAvatarInactive: {
  },
  itemAvatarText: {
    fontSize: 18,
    fontWeight: '900',
  },
  textActive: {
  },
  textInactive: {
  },
  itemInfo: {
    marginLeft: 15,
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '800',
  },
  itemNameActive: {
  },
  itemNameInactive: {
  },
  itemClass: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 1,
  },
  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  detailsCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
    marginHorizontal: 5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconBg: {
    padding: 10,
    borderRadius: 12,
    marginRight: 15,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  detailDivider: {
    height: 1,
    marginVertical: 15,
  },
  optionsCard: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 2,
  },
  optionIconBg: {
    padding: 10,
    borderRadius: 12,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
  },
  logoutText: {
    marginLeft: 15,
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: '#EF4444',
  },
  versionInfo: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  versionBrand: {
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 8,
    letterSpacing: 2,
  },
  versionNumber: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  parentPhoto: {
    width: 36,
    height: 36,
    borderRadius: 12,
    marginRight: 15,
  },
});

export default ProfileScreen;
