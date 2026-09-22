import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const SecurityPrivacyScreen = () => {
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
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('securityAndPrivacy')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBg, { backgroundColor: '#DCFCE7' }]}>
              <Feather name="lock" size={24} color="#16A34A" />
            </View>
          </View>
          <Text style={[styles.title, { color: textColor }]}>{t('dataEncryption')}</Text>
          <Text style={[styles.description, { color: subtextColor }]}>
            {t('dataEncryptionFullDesc', 'We use industry-standard encryption protocols to safeguard your child\'s data and ensure absolute privacy at all times.')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBg, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="shield" size={24} color="#0284C7" />
            </View>
          </View>
          <Text style={[styles.title, { color: textColor }]}>{t('privacyPolicy')}</Text>
          <Text style={[styles.description, { color: subtextColor }]}>
            {t('privacyPolicyDesc', 'No data is shared with third parties without your explicit consent. Your phone number is only used for authentication.')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBg, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="smartphone" size={24} color="#9333EA" />
            </View>
          </View>
          <Text style={[styles.title, { color: textColor }]}>{t('biometricAuth')}</Text>
          <Text style={[styles.description, { color: subtextColor }]}>
            {t('biometricAuthFullDesc', 'You can configure biometric authentication in your phone\'s native settings.')}
          </Text>
        </View>
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
  card: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default SecurityPrivacyScreen;
