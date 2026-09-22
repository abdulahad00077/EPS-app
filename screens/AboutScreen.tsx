import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const AboutScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#F1F5F9';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('aboutEdutrack')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="school" size={48} color="#FFFFFF" />
          </View>
          <Text style={[styles.appName, { color: textColor }]}>Skora Connect</Text>
          <Text style={[styles.version, { color: subtextColor }]}>{t('version')} 1.0.0</Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Feather name="code" size={20} color="#0284C7" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: subtextColor }]}>{t('developedBy')}</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>DEVFORDEVS</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Feather name="mail" size={20} color="#0284C7" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: subtextColor }]}>{t('contactSupport')}</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>support.devfordevs@gmail.com</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Feather name="globe" size={20} color="#0284C7" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: subtextColor }]}>{t('website', 'Website')}</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>devfordevs.in</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.copyright, { color: subtextColor }]}>
          © {new Date().getFullYear()} DEVFORDEVS . All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 15,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AboutScreen;
