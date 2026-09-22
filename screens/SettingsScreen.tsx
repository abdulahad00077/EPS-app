import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStudent } from '../hooks/useStudent';
import { useAuth } from '../hooks/useAuth';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme, colors } = useTheme();
  const { selectedStudent } = useStudent();
  const { signOut } = useAuth();

  const isHindi = language === 'hi';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerWrapper, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#ffffff', '#F8FAFC']}
          style={[styles.headerGradient, { borderBottomColor: colors.border }]}
        >
          <View style={[styles.headerTop, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={{ padding: 8, marginRight: 12, borderRadius: 12, backgroundColor: 'rgba(148, 163, 184, 0.1)' }} 
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={24} color={colors.text} />
              </TouchableOpacity>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Feather name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <TouchableOpacity 
          style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => (navigation as any).navigate('Profile')}
        >
          <View style={styles.profileInfo}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.border }]}>
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={[styles.name, { color: colors.text }]}>{selectedStudent?.name || 'Parent Profile'}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('class')} {selectedStudent?.class || '-'}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Appearance Group */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('appearance')}</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#E0F2FE' }]}>
                <Ionicons name="moon" size={20} color="#0284C7" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{t('darkMode')}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E2E8F0', true: '#0284C7' }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconBg, { backgroundColor: isDark ? 'rgba(234,88,12,0.2)' : '#FFEDD5' }]}>
                <Ionicons name="globe" size={20} color="#EA580C" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>{t('language')} (Hindi)</Text>
            </View>
            <Switch
              value={isHindi}
              onValueChange={(val) => setLanguage(val ? 'hi' : 'en')}
              trackColor={{ false: '#E2E8F0', true: '#0284C7' }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* Visit EPS Button */}
        <TouchableOpacity 
          style={[styles.visitBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} 
          onPress={() => Linking.openURL('https://www.meraelegant.in')}
        >
          <Feather name="external-link" size={20} color="#FFFFFF" />
          <Text style={[styles.visitText, { color: '#FFFFFF' }]}>Visit EPS</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>{t('signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: { zIndex: 10 },
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: 20, paddingHorizontal: 25, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  menuButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  visitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  visitText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
