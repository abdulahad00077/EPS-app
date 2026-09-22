import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Dimensions, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase, resolveSchoolDatabase, coreSupabase } from '../services/supabase';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';
import { useStudent } from '../hooks/useStudent';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LoginScreen = () => {
  const { t, language, setLanguage } = useLanguage();
  const [loginRole, setLoginRole] = useState<'parent' | 'teacher'>('parent');
  
  // Parent
  const [applicantId, setApplicantId] = useState('');
  
  // Teacher
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { signInManual } = useAuth();
  const { selectStudent } = useStudent();
  const { isDark, toggleTheme, colors } = useTheme();

  const bgColor = colors.background;
  const textColor = colors.text;
  const subtextColor = colors.textSecondary;
  const inputBgColor = colors.surface;
  const borderColor = colors.border;

  const handleParentLogin = async () => {
    if (!applicantId) {
      setError('Please enter your Applicant ID');
      return;
    }
    if (!applicantId.startsWith('EPS')) {
      setError('Applicant ID must start with EPS');
      return;
    }
    if (applicantId.length < 5) {
      setError('Invalid Applicant ID format');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: students, error: studentError } = await coreSupabase
        .from('students')
        .select('*')
        .eq('admission_number', applicantId);
        
      if (studentError) throw studentError;
      
      if (!students || students.length === 0) {
        setError('No student found with this Applicant ID');
        setLoading(false);
        return;
      }
      
      const validStudent = students[0];
      await resolveSchoolDatabase(validStudent.school_id);
      await selectStudent(validStudent);
      
      // We still use parent_phone for signInManual since mobile expects it, 
      // but UI only asks for Applicant ID!
      await signInManual(validStudent.parent_phone || applicantId);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: teachers, error: teacherError } = await coreSupabase
        .from('teachers')
        .select('*')
        .eq('username', username.trim());
        
      console.log('Login attempt for:', username.trim());
      console.log('Supabase returned:', teachers, 'Error:', teacherError);
        
      if (teacherError) throw teacherError;
      
      if (!teachers || teachers.length === 0) {
        setError('Invalid teacher username or password');
        setLoading(false);
        return;
      }
      
      const teacher = teachers[0];
      
      console.log('Validating password:', 'DB:', teacher.password_hash, 'Input:', password.trim());
      
      if (teacher.password_hash !== password.trim()) {
        setError('Invalid teacher username or password');
        setLoading(false);
        return;
      }
      
      if (teacher.app_access_enabled === false) {
        setError('Your access has been suspended by the admin.');
        setLoading(false);
        return;
      }
      
      await resolveSchoolDatabase(teacher.school_id);
      await signInManual(teacher.username, 'teacher', undefined, teacher);
    } catch (err: any) {
      setError(err.message || 'Teacher login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (loginRole === 'parent') {
      handleParentLogin();
    } else {
      handleTeacherLogin();
    }
  };

  return (
    <View style={[{ flex: 1, backgroundColor: bgColor }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : [colors.primary, '#1E40AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: '28%', borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
          alignItems: 'center', justifyContent: 'center', paddingTop: 40,
        }}
      >
        <View style={{ position: 'absolute', top: 50, right: 24, zIndex: 10, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={toggleTheme}>
            <Feather name={isDark ? "sun" : "moon"} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 32, fontWeight: '900', color: '#FFF', marginTop: 20 }}>Elegant Public School</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginTop: 8 }}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>{t('loginPortal', 'LOGIN PORTAL')}</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}>
          
          <View style={{ flexDirection: 'row', backgroundColor: inputBgColor, borderRadius: 12, padding: 4, marginBottom: 30 }}>
            <TouchableOpacity 
              onPress={() => { setLoginRole('parent'); setError(null); }}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: loginRole === 'parent' ? colors.primary : 'transparent' }}
            >
              <Text style={{ fontWeight: 'bold', color: loginRole === 'parent' ? '#FFF' : subtextColor }}>Parent</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => { setLoginRole('teacher'); setError(null); }}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: loginRole === 'teacher' ? colors.primary : 'transparent' }}
            >
              <Text style={{ fontWeight: 'bold', color: loginRole === 'teacher' ? '#FFF' : subtextColor }}>Teacher</Text>
            </TouchableOpacity>
          </View>

          {loginRole === 'parent' ? (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: subtextColor, letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 }}>APPLICANT ID</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: inputBgColor, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 18, borderWidth: 1, borderColor: borderColor }}>
                <Feather name="hash" size={20} color={colors.primary} style={{ marginRight: 15 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 18, color: textColor, fontWeight: '700' }}
                  placeholder="Enter Applicant ID"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  value={applicantId}
                  onChangeText={(t) => { setApplicantId(t); setError(null); }}
                  onFocus={() => {
                    if (!applicantId) {
                      setApplicantId('EPS');
                    }
                  }}
                />
              </View>
            </View>
          ) : (
            <>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: subtextColor, letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 }}>USERNAME</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: inputBgColor, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 18, borderWidth: 1, borderColor: borderColor }}>
                  <Feather name="user" size={20} color={colors.primary} style={{ marginRight: 15 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 18, color: textColor, fontWeight: '700' }}
                    placeholder="Teacher Username"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    autoCapitalize="none"
                    value={username}
                    onChangeText={(t) => { setUsername(t); setError(null); }}
                  />
                </View>
              </View>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: subtextColor, letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 }}>PASSWORD</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: inputBgColor, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 18, borderWidth: 1, borderColor: borderColor }}>
                  <Feather name="lock" size={20} color={colors.primary} style={{ marginRight: 15 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 18, color: textColor, fontWeight: '700' }}
                    placeholder="Password"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(null); }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 5, marginBottom: 10 }}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700', marginLeft: 8 }}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{ backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 28, marginTop: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginRight: 10 }}>{t('login', 'Login')}</Text>
                <Feather name="arrow-right" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
