import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

const DriverSettingsScreen = () => {
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { driver, signOut } = useAuth();

  const isHindi = language === 'hi';

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const inputBgColor = isDark ? '#0F172A' : '#F8FAFC';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (!driver?.id) {
      setPasswordError(t('driverNotFound', 'Driver not found'));
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase
        .from('transport_drivers')
        .update({ password: newPassword })
        .eq('id', driver.id);

      if (error) throw error;
      
      setPasswordSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      setPasswordError(err.message || t('passwordUpdateFailed', 'Failed to update password'));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t('signOut', 'Sign Out'),
      t('confirmSignOut', 'Are you sure you want to log out?'),
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        { text: t('signOut', 'Sign Out'), onPress: signOut, style: 'destructive' }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('settings', 'Settings')}</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Appearance Group */}
          <Text style={[styles.sectionTitle, { color: subtextColor }]}>{t('appearance', 'APPEARANCE').toUpperCase()}</Text>
          <View style={[styles.group, { backgroundColor: cardColor, borderColor }]}>
            <View style={[styles.settingRow, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconBg, { backgroundColor: '#E0F2FE' }]}>
                  <Feather name="moon" size={20} color="#0284C7" />
                </View>
                <Text style={[styles.settingText, { color: textColor }]}>{t('darkMode', 'Dark Mode')}</Text>
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
                <View style={[styles.iconBg, { backgroundColor: '#FFEDD5' }]}>
                  <Feather name="globe" size={20} color="#EA580C" />
                </View>
                <Text style={[styles.settingText, { color: textColor }]}>{t('language', 'Language')} (Hindi)</Text>
              </View>
              <Switch
                value={isHindi}
                onValueChange={(val) => setLanguage(val ? 'hi' : 'en')}
                trackColor={{ false: '#E2E8F0', true: '#0284C7' }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>

          {/* Security Group */}
          <Text style={[styles.sectionTitle, { color: subtextColor }]}>{t('security', 'SECURITY').toUpperCase()}</Text>
          <View style={[styles.group, { backgroundColor: cardColor, borderColor, padding: 16 }]}>
            <Text style={[styles.passwordTitle, { color: textColor }]}>{t('changePassword', 'Change Password')}</Text>
            
            <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor }]}>
              <Feather name="lock" size={20} color={subtextColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder={t('newPassword', 'New Password')}
                placeholderTextColor={subtextColor}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor, marginTop: 12 }]}>
              <Feather name="lock" size={20} color={subtextColor} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder={t('confirmPassword', 'Confirm Password')}
                placeholderTextColor={subtextColor}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            {passwordSuccess ? (
              <Text style={styles.successText}>{passwordSuccess}</Text>
            ) : null}

            <TouchableOpacity 
              style={[styles.updateBtn, isUpdatingPassword && styles.disabledBtn]} 
              onPress={handleChangePassword}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.updateBtnText}>{t('updatePassword', 'Update Password')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Account Group */}
          <Text style={[styles.sectionTitle, { color: subtextColor, marginTop: 10 }]}>{t('account', 'ACCOUNT').toUpperCase()}</Text>
          <View style={[styles.group, { backgroundColor: cardColor, borderColor }]}>
            <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconBg, { backgroundColor: '#FEE2E2' }]}>
                  <Feather name="log-out" size={20} color="#EF4444" />
                </View>
                <Text style={[styles.settingText, { color: '#EF4444' }]}>{t('signOut', 'Sign Out')}</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 10,
  },
  group: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  passwordTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  updateBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  updateBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 10,
    fontSize: 14,
  },
  successText: {
    color: '#10B981',
    marginTop: 10,
    fontSize: 14,
  },
});

export default DriverSettingsScreen;
