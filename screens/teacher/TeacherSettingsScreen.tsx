import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { coreSupabase } from '../../services/supabase';

export default function TeacherSettingsScreen() {
  const { teacher, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (!teacher) return;

    setLoading(true);
    try {
      // First verify current password
      const { data: verifyData, error: verifyError } = await coreSupabase
        .from('teachers')
        .select('password_hash')
        .eq('id', teacher.id)
        .single();

      if (verifyError || verifyData?.password_hash !== currentPassword.trim()) {
        Alert.alert('Error', 'Incorrect current password');
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await coreSupabase
        .from('teachers')
        .update({ password_hash: newPassword.trim() })
        .eq('id', teacher.id);

      if (updateError) throw updateError;

      Alert.alert('Success', 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        
        {/* Profile Card */}
        <TouchableOpacity 
          style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('TeacherProfile')}
        >
          <View style={styles.profileInfo}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.border }]}>
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={[styles.name, { color: colors.text }]}>{teacher?.name}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>View and edit profile</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Appearance Group */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconBg, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : '#E0F2FE' }]}>
                <Ionicons name="moon" size={20} color="#0284C7" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E2E8F0', true: '#0284C7' }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Current Password</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputField, { color: colors.text }]}
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeIcon}>
              <Ionicons name={showCurrentPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputField, { color: colors.text }]}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
              <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputField, { color: colors.text }]}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.updateBtn, { backgroundColor: colors.primary }]}
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  updateBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  }
});
