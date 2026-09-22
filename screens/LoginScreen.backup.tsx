import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Dimensions,
  Modal,
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase, resolveSchoolDatabase, coreSupabase } from '../services/supabase';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';
import { useStudent } from '../hooks/useStudent';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Student, Driver } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex1: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoBadge: {
    padding: 24,
    borderRadius: 36,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 20,
    letterSpacing: -1.5,
  },
  portalBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  portalText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 48,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 30,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputError: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF7ED',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
    letterSpacing: 1,
  },
  phoneInput: {
    letterSpacing: 2,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  prefixText: {
    fontSize: 18,
    color: '#0284C7',
    fontWeight: '900',
  },
  prefixDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  errorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 28,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#BAE6FD',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 35,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dividerText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '800',
    marginHorizontal: 15,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  link: {
    color: '#0284C7',
    fontWeight: '800',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalSubTitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  studentItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 15,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentClass: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
});

const LoginScreen = () => {
  const { t, language, setLanguage } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchingStudents, setMatchingStudents] = useState<Student[]>([]);
  const [showSelection, setShowSelection] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [availableDriver, setAvailableDriver] = useState<Driver | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Driver Password Reset State
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [driverForReset, setDriverForReset] = useState<Driver | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const { signInManual } = useAuth();
  const { selectStudent } = useStudent();
  const { isDark, toggleTheme } = useTheme();

  // Dynamic Theme Colors
  const bgColor = isDark ? '#020817' : '#FFFFFF';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const inputBgColor = isDark ? '#0F172A' : '#F8FAFC';
  const borderColor = isDark ? '#1E293B' : '#E2E8F0';
  const cardColor = isDark ? '#020817' : '#FFFFFF';
  const gradientColors = isDark 
    ? ['#0F172A', '#020817'] as const
    : ['#E0F2FE', '#F8FAFC'] as const;

  const handleLogin = async () => {
    const digitsOnly = phoneNumber.replace(/[^0-9]/g, '');
    if (!digitsOnly || digitsOnly.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find students with this phone number
      const variations = [
        digitsOnly,
        `+91${digitsOnly}`,
        `91${digitsOnly}`,
        `0${digitsOnly}`,
        `+91 ${digitsOnly}`,
        `91 ${digitsOnly}`
      ];

      const uniqueVariations = Array.from(new Set(variations));

      // Find students and drivers across ALL databases (core + dedicated)
      let allDrivers: Driver[] = [];
      let allStudents: Student[] = [];

      // 1. Search Core Database
      const { data: coreDrivers, error: driverError } = await coreSupabase
        .from('transport_drivers')
        .select('id, school_id, name:driver_name, phone:mobile_number, password, is_first_login, vehicle_number, vehicle_name:vehicle_type, route_id, created_at')
        .in('mobile_number', uniqueVariations);
      
      if (coreDrivers) allDrivers.push(...coreDrivers);

      const { data: coreStudents, error: studentError } = await coreSupabase
        .from('students')
        .select('*')
        .in('parent_phone', uniqueVariations);
      
      if (studentError) {
        console.error('Supabase Core Student Query Error:', studentError);
        throw studentError;
      }
      if (coreStudents) allStudents.push(...coreStudents);

      // 2. Search Dedicated Databases
      const { data: dedicatedSchools } = await coreSupabase
        .from('schools')
        .select('id, database_mode, supabase_url, supabase_anon_key')
        .in('database_mode', ['dedicated', 'own']);

      if (dedicatedSchools && dedicatedSchools.length > 0) {
        await Promise.all(dedicatedSchools.map(async (school) => {
          if (school.supabase_url && school.supabase_anon_key) {
            try {
              const schoolClient = createClient(school.supabase_url, school.supabase_anon_key);
              
              const { data: sDrivers } = await schoolClient
                .from('transport_drivers')
                .select('id, school_id, name:driver_name, phone:mobile_number, password, is_first_login, vehicle_number, vehicle_name:vehicle_type, route_id, created_at')
                .in('mobile_number', uniqueVariations);
              if (sDrivers && sDrivers.length > 0) allDrivers.push(...sDrivers);

              const { data: sStudents } = await schoolClient
                .from('students')
                .select('*')
                .in('parent_phone', uniqueVariations);
              if (sStudents && sStudents.length > 0) allStudents.push(...sStudents);
            } catch (err) {
              console.warn(`Failed to search dedicated DB for school ${school.id}`, err);
            }
          }
        }));
      }

      const drivers = allDrivers;
      const students = allStudents;

      let validDriver: Driver | null = null;
      let isDriverWithWrongPassword = false;

      if (drivers && drivers.length > 0) {
        const driver = drivers[0];
        if (driver.password && driver.password.toLowerCase() === password.toLowerCase()) {
          validDriver = driver;
        } else {
          isDriverWithWrongPassword = true;
        }
      }

      console.log('LoginScreen: Student data found:', students?.length || 0);

      if ((!students || students.length === 0) && !validDriver) {
        if (isDriverWithWrongPassword) {
          setError('Incorrect password for driver.');
        } else {
          setError('This phone number is not registered. (Checked ' + variations.slice(0, 3).join(', ') + ')');
        }
        setLoading(false);
        return;
      }

      // Step 2: Fetch school details for the first student from core database (if any students exist)
      let studentSchool = null;
      if (students && students.length > 0) {
        const { data, error: schoolError } = await coreSupabase
          .from('schools')
          .select('name, slug, status, parents_app_enabled')
          .eq('id', students[0].school_id)
          .single();
        
        studentSchool = data;

        if (schoolError) {
          console.warn('Could not fetch school details (likely RLS), but continuing login...:', schoolError);
          // We will continue if school data is missing, assuming active for now if blocked by RLS
        } else if (studentSchool) {
          if (studentSchool.status !== 'active') {
            setError('This school portal is currently disabled. Please contact support.');
            setLoading(false);
            return;
          }

          if (studentSchool.parents_app_enabled !== true) {
            setError('Parent app access is currently disabled for your school. Please contact your administrator.');
            setLoading(false);
            return;
          }
        }
      }

      // Filter students by password logic
      // password = first 4 letters of name + birth year (lowercase)
      const validStudents = students.filter(student => {
        if (!student.name || !student.date_of_birth) return false;
        
        const firstName = student.name.split(' ')[0].toLowerCase().substring(0, 4);
        const birthYear = new Date(student.date_of_birth).getFullYear();
        const expectedPassword = `${firstName}${birthYear}`.toLowerCase();
        
        return password.toLowerCase() === expectedPassword;
      });

      if (validStudents.length === 0 && !validDriver) {
        if (isDriverWithWrongPassword) {
          setError('Incorrect password for driver.');
        } else if (students && students.length > 0) {
          setError('Incorrect password. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Check for dual roles
      if (validDriver && validStudents.length > 0) {
         setAvailableDriver(validDriver);
         setMatchingStudents(validStudents);
         setShowRoleSelection(true);
         setLoading(false);
         return;
      }

      if (validDriver) {
         if (validDriver.is_first_login) {
            setDriverForReset(validDriver);
            setShowPasswordReset(true);
            setLoading(false);
            return;
         }
         await resolveSchoolDatabase(validDriver.school_id);
         await signInManual(digitsOnly, 'driver', validDriver);
         setLoading(false);
         return;
      }

      if (validStudents.length === 1) {
        // Only one child matches this password, log in directly
        await resolveSchoolDatabase(validStudents[0].school_id);
        await selectStudent(validStudents[0]);
        await signInManual(digitsOnly);
      } else {
        // Multiple children might have the same password structure (rare but possible)
        // OR the parent just entered a password that matches one but there are others.
        // Actually, if they entered a password for one child, they should see all their children anyway.
        // Let's just log them in if at least one password matches.
        setMatchingStudents(validStudents);
        setShowSelection(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChild = async (student: Student) => {
    await resolveSchoolDatabase(student.school_id);
    await selectStudent(student);
    await signInManual(phoneNumber.replace(/[^0-9]/g, ''), 'parent');
    setShowSelection(false);
  };

  const handleSelectRole = async (role: 'parent' | 'driver') => {
    setShowRoleSelection(false);
    if (role === 'driver' && availableDriver) {
      if (availableDriver.is_first_login) {
        setDriverForReset(availableDriver);
        setShowPasswordReset(true);
        return;
      }
      await resolveSchoolDatabase(availableDriver.school_id);
      await signInManual(phoneNumber.replace(/[^0-9]/g, ''), 'driver', availableDriver);
    } else if (role === 'parent') {
      if (matchingStudents.length === 1) {
        await handleSelectChild(matchingStudents[0]);
      } else {
        setShowSelection(true);
      }
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!driverForReset) return;

    setLoading(true);
    setError(null);
    try {
      await resolveSchoolDatabase(driverForReset.school_id);
      
      const { error } = await supabase
        .from('transport_drivers')
        .update({ password: newPassword, is_first_login: false })
        .eq('id', driverForReset.id);

      if (error) throw error;
      
      const updatedDriver = { ...driverForReset, password: newPassword, is_first_login: false };
      setDriverForReset(updatedDriver);
      setShowPasswordReset(false);
      setShowLanguageSelection(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPassword = async () => {
    if (!driverForReset) return;
    setLoading(true);
    try {
      await resolveSchoolDatabase(driverForReset.school_id);
      
      const { error } = await supabase
        .from('transport_drivers')
        .update({ is_first_login: false })
        .eq('id', driverForReset.id);

      if (error) throw error;
      
      const updatedDriver = { ...driverForReset, is_first_login: false };
      setDriverForReset(updatedDriver);
      setShowPasswordReset(false);
      setShowLanguageSelection(true);
    } catch (err: any) {
      setError(err.message || 'Failed to skip password setup');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = async (lang: 'en' | 'hi') => {
    await setLanguage(lang);
    setShowLanguageSelection(false);
    if (driverForReset) {
      await resolveSchoolDatabase(driverForReset.school_id);
      await signInManual(driverForReset.phone, 'driver', driverForReset);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={isDark ? ['#1E293B', '#020817'] : ['#E0F2FE', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: '28%',
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 40,
        }}
      >
        <View style={{ position: 'absolute', top: 50, right: 24, zIndex: 10, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: language === 'en' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(234, 88, 12, 0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 12 }}
            onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          >
            <Feather name="globe" size={14} color={language === 'en' ? '#38BDF8' : '#F97316'} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: language === 'en' ? '#38BDF8' : '#F97316' }}>
              {language === 'en' ? 'EN' : 'HI'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme}>
            <Feather name={isDark ? "sun" : "moon"} size={24} color={textColor} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.brandName, { color: textColor }]}>Elegant Public School</Text>
        <View style={[styles.portalBadge, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE', borderWidth: 0 }]}>
          <Text style={[styles.portalText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>{t('loginPortal', 'LOGIN PORTAL')}</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.flex1}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: 40,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: '700', color: textColor, marginBottom: 4 }}>
              {t('welcome', 'Welcome')}
            </Text>
            <Text style={{ fontSize: 15, color: subtextColor, marginBottom: 28 }}>
              {t('loginSubtitle', 'Login with your phone and password')}
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: subtextColor }]}>{t('phoneNumber', 'PHONE NUMBER')}</Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: borderColor }, error && !phoneNumber ? styles.inputError : null]}>
                <Feather name="phone" size={20} color="#0284C7" />
                <View style={styles.prefixContainer}>
                  <Text style={[styles.prefixText, { color: textColor }]}>+91</Text>
                  <View style={[styles.prefixDivider, { backgroundColor: borderColor }]} />
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInput, { color: textColor }]}
                  placeholder="XXXXXXXXXX"
                  placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(text: string) => {
                    setPhoneNumber(text.replace(/[^0-9]/g, ''));
                    if (error) setError(null);
                  }}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: subtextColor }]}>{t('password', 'PASSWORD')}</Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: borderColor }, error && password ? styles.inputError : null]}>
                <Feather name="lock" size={20} color="#0284C7" />
                <View style={[styles.prefixDivider, { backgroundColor: borderColor }]} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="password here"
                  placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                  secureTextEntry={!showPassword}
                  value={password}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={(text: string) => {
                    setPassword(text);
                    if (error) setError(null);
                  }}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 5 }}
                >
                  <Feather 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={20} 
                    color="#94A3B8" 
                  />
                </TouchableOpacity>
              </View>
              {error && (
                <View style={styles.errorWrapper}>
                  <Feather name="shield" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.button, loading ? styles.buttonDisabled : null]}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.buttonText}>{t('login', 'Login')}</Text>
                  <Feather name="arrow-right" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            <Text
              style={{
                textAlign: 'center',
                color: subtextColor,
                fontSize: 12,
                marginTop: 24,
              }}
            >
              {t('contactAdminText', 'Please contact your administrator if you cannot access your account.')}
            </Text>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showRoleSelection}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleSelection(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIndicator, { backgroundColor: borderColor }]} />
              <Text style={[styles.modalTitle, { color: textColor }]}>Select Role</Text>
              <Text style={[styles.modalSubTitle, { color: subtextColor }]}>You have multiple roles. How would you like to log in?</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.studentItem, { backgroundColor: inputBgColor, borderColor: borderColor, borderWidth: 1 }]}
              onPress={() => handleSelectRole('parent')}
            >
              <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE', padding: 12, borderRadius: 16 }}>
                <Feather name="users" size={24} color="#0284C7" />
              </View>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: textColor }]}>Parent Portal</Text>
                <Text style={[styles.studentClass, { color: subtextColor }]}>Manage your children</Text>
              </View>
              <Feather name="chevron-right" size={24} color={subtextColor} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.studentItem, { backgroundColor: inputBgColor, borderColor: borderColor, borderWidth: 1 }]}
              onPress={() => handleSelectRole('driver')}
            >
              <View style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', padding: 12, borderRadius: 16 }}>
                <MaterialCommunityIcons name="bus" size={24} color="#10B981" />
              </View>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: textColor }]}>Driver Portal</Text>
                <Text style={[styles.studentClass, { color: subtextColor }]}>Manage transport</Text>
              </View>
              <Feather name="chevron-right" size={24} color={subtextColor} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowRoleSelection(false)}
              style={{ marginTop: 20, alignItems: 'center', padding: 15 }}
            >
              <Text style={{ color: '#64748B', fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSelection}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSelection(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIndicator, { backgroundColor: borderColor }]} />
              <Text style={[styles.modalTitle, { color: textColor }]}>Choose Profile</Text>
              <Text style={[styles.modalSubTitle, { color: subtextColor }]}>Select the profile you want to view first</Text>
            </View>
            
            <FlatList
              data={matchingStudents}
              keyExtractor={(item: Student) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }: { item: Student }) => (
                <TouchableOpacity 
                  style={[styles.studentItem, { backgroundColor: inputBgColor, borderColor: borderColor, borderWidth: 1 }]}
                  onPress={() => handleSelectChild(item)}
                >
                  <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE', padding: 12, borderRadius: 16 }}>
                    <Feather name="user" size={24} color="#0284C7" />
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: textColor }]}>{item.name}</Text>
                    <Text style={[styles.studentClass, { color: subtextColor }]}>Class {item.class} {item.section ? ` - Section ${item.section}` : ''}</Text>
                  </View>
                  <Feather name="check-circle" size={24} color="#10B981" />
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              onPress={() => setShowSelection(false)}
              style={{ marginTop: 20, alignItems: 'center', padding: 15 }}
            >
              <Text style={{ color: '#64748B', fontWeight: '800' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Driver Change Password Modal */}
      <Modal
        visible={showPasswordReset}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordReset(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: cardColor, paddingBottom: 50 }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIndicator, { backgroundColor: borderColor }]} />
              <Text style={[styles.modalTitle, { color: textColor }]}>Update Password</Text>
              <Text style={[styles.modalSubTitle, { color: subtextColor }]}>Please change your password on first login</Text>
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: subtextColor }]}>NEW PASSWORD</Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: borderColor }]}>
                <Feather name="lock" size={20} color="#0284C7" />
                <View style={[styles.prefixDivider, { backgroundColor: borderColor }]} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="New password"
                  placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                  secureTextEntry={true}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: subtextColor }]}>CONFIRM PASSWORD</Text>
              <View style={[styles.inputContainer, { backgroundColor: inputBgColor, borderColor: borderColor }]}>
                <Feather name="lock" size={20} color="#0284C7" />
                <View style={[styles.prefixDivider, { backgroundColor: borderColor }]} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  placeholder="Confirm password"
                  placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                  secureTextEntry={true}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorWrapper}>
                <Feather name="shield" size={14} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={loading}
              style={[styles.button, loading ? styles.buttonDisabled : null]}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSkipPassword}
              disabled={loading}
              style={{ marginTop: 20, alignItems: 'center', padding: 15 }}
            >
              <Text style={{ color: '#64748B', fontWeight: '800' }}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Driver Language Selection Modal */}
      <Modal
        visible={showLanguageSelection}
        transparent
        animationType="slide"
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIndicator, { backgroundColor: borderColor }]} />
              <Text style={[styles.modalTitle, { color: textColor, textAlign: 'center' }]}>Preferred Language</Text>
              <Text style={[styles.modalSubTitle, { color: subtextColor, textAlign: 'center' }]}>पसंदीदा भाषा चुनें</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.studentItem, { backgroundColor: inputBgColor, borderColor: borderColor, borderWidth: 1, marginTop: 10 }]}
              onPress={() => handleLanguageSelect('en')}
            >
              <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE', padding: 12, borderRadius: 16 }}>
                <Text style={{ fontSize: 24 }}>🇬🇧</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: textColor }]}>English</Text>
                <Text style={[styles.studentClass, { color: subtextColor }]}>Set English as default</Text>
              </View>
              <Feather name="chevron-right" size={24} color={subtextColor} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.studentItem, { backgroundColor: inputBgColor, borderColor: borderColor, borderWidth: 1, marginTop: 16 }]}
              onPress={() => handleLanguageSelect('hi')}
            >
              <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE', padding: 12, borderRadius: 16 }}>
                <Text style={{ fontSize: 24 }}>🇮🇳</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: textColor }]}>हिंदी (Hindi)</Text>
                <Text style={[styles.studentClass, { color: subtextColor }]}>हिंदी को डिफ़ॉल्ट के रूप में सेट करें</Text>
              </View>
              <Feather name="chevron-right" size={24} color={subtextColor} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LoginScreen;
