import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, resolveSchoolDatabase, resetSchoolDatabase, coreSupabase } from '../services/supabase';
import { initializeFromCache } from '../services/databaseResolver';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Teacher, Driver } from '../types';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRole: 'parent' | 'driver' | 'teacher' | null;
  driver: Driver | null;
  teacher: Teacher | null;
  signOut: () => Promise<void>;
  signInManual: (identifier: string, role?: 'parent' | 'driver' | 'teacher', driverData?: Driver, teacherData?: Teacher) => Promise<void>;
  switchRole: (newRole: 'parent' | 'driver' | 'teacher') => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'parent' | 'driver' | 'teacher' | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  const signInManual = async (identifier: string, role: 'parent' | 'driver' | 'teacher' = 'parent', driverData?: Driver, teacherData?: Teacher) => {
    const mockUser = {
      id: 'manual-' + identifier,
      phone: identifier,
      email: '',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;
    
    const mockSession = { 
      user: mockUser, 
      access_token: 'manual', 
      refresh_token: 'manual', 
      expires_in: 3600, 
      token_type: 'bearer' 
    } as Session;

    setUser(mockUser);
    setSession(mockSession);
    setUserRole(role);
    if (driverData) setDriver(driverData);
    if (teacherData) setTeacher(teacherData);
    
    await AsyncStorage.setItem('manual_session_phone', identifier); // Kept as phone for backward compatibility, but stores identifier (username/phone)
    await AsyncStorage.setItem('user_role', role);
    if (driverData) await AsyncStorage.setItem('driver_data', JSON.stringify(driverData));
    if (teacherData) await AsyncStorage.setItem('teacher_data', JSON.stringify(teacherData));
  };

  useEffect(() => {
    const restoreSession = async () => {
      await initializeFromCache();
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      const savedPhone = await AsyncStorage.getItem('manual_session_phone');
      const savedRole = await AsyncStorage.getItem('user_role') as 'parent' | 'driver' | 'teacher' | null;
      const savedDriver = await AsyncStorage.getItem('driver_data');
      const savedTeacher = await AsyncStorage.getItem('teacher_data');
      
      let phoneToVerify: string | null = null;
      if (supabaseSession?.user?.phone) {
        phoneToVerify = supabaseSession.user.phone;
      } else if (savedPhone) {
        phoneToVerify = savedPhone;
      }

      if (phoneToVerify) {
        const digitsOnly = phoneToVerify.replace(/[^0-9]/g, '');
        const variations = [digitsOnly, `+91${digitsOnly}`, `91${digitsOnly}`, `0${digitsOnly}`, `+91 ${digitsOnly}`, `91 ${digitsOnly}`];

        if (savedRole === 'driver') {
          // Re-verify driver
          const driverOrQuery = variations.map(fmt => `mobile_number.eq.${fmt}`).join(',');
          const { data: drivers, error } = await supabase
            .from('transport_drivers')
            .select('id, school_id, name:driver_name, phone:mobile_number, password, is_first_login, vehicle_number, vehicle_name:vehicle_type, route_id, created_at')
            .or(driverOrQuery);

          if (error || !drivers || drivers.length === 0) {
            await signOut();
            setLoading(false);
            return;
          }
          
          await resolveSchoolDatabase(drivers[0].school_id);
          setUserRole('driver');
          setDriver(drivers[0]);
        } else if (savedRole === 'teacher') {
          // Re-verify teacher
          let teacherId = null;
          if (savedTeacher) {
            try {
              teacherId = JSON.parse(savedTeacher).id;
            } catch (e) {}
          }
          
          if (!teacherId) {
            await signOut();
            setLoading(false);
            return;
          }

          const { data: teachers, error } = await coreSupabase
            .from('teachers')
            .select('*')
            .eq('id', teacherId);

          if (error || !teachers || teachers.length === 0 || teachers[0].app_access_enabled === false) {
            await signOut();
            setLoading(false);
            return;
          }
          
          await resolveSchoolDatabase(teachers[0].school_id);
          setUserRole('teacher');
          setTeacher(teachers[0]);
        } else {
          // Re-verify parent
        const orQuery = [...variations.map(fmt => `parent_phone.eq.${fmt}`), `admission_number.eq.${phoneToVerify}`].join(',');

        const { data: students, error: studentError } = await supabase
          .from('students')
          .select('*')
          .or(orQuery);

        if (studentError || !students || students.length === 0) {
          // No valid student found for this phone anymore
          await signOut();
          setLoading(false);
          return;
        }

        // Check if at least one student's school is active
        const schoolId = students[0].school_id;
        const { data: studentSchool } = await coreSupabase
          .from('schools')
          .select('status, parents_app_enabled')
          .eq('id', schoolId)
          .single();
        
        if (studentSchool) {
          if (studentSchool.status !== 'active' || studentSchool.parents_app_enabled !== true) {
            await signOut();
            setLoading(false);
            return;
          }
        }
        await resolveSchoolDatabase(schoolId);
        setUserRole('parent');
        }
      }

      if (supabaseSession) {
        setSession(supabaseSession);
        setUser(supabaseSession.user);
      } else if (savedPhone) {
        let parsedDriver = null;
        let parsedTeacher = null;
        if (savedDriver) parsedDriver = JSON.parse(savedDriver);
        if (savedTeacher) parsedTeacher = JSON.parse(savedTeacher);
        await signInManual(savedPhone, savedRole || 'parent', parsedDriver || undefined, parsedTeacher || undefined);
      }
      setLoading(false);
    };

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchRole = async (newRole: 'parent' | 'driver' | 'teacher') => {
    if (newRole === userRole) return;
    
    // Check if they are eligible for the other role
    if (!user?.phone) return;
    
    const phone = user.phone.replace(/[^0-9]/g, '');
    const variations = [phone, `+91${phone}`, `91${phone}`, `0${phone}`, `+91 ${phone}`, `91 ${phone}`];
    
    if (newRole === 'driver') {
      const driverOrQuery = variations.map(fmt => `mobile_number.eq.${fmt}`).join(',');
      const { data: drivers, error } = await supabase
        .from('transport_drivers')
        .select('id, school_id, name:driver_name, phone:mobile_number, password, is_first_login, vehicle_number, vehicle_name:vehicle_type, route_id, created_at')
        .or(driverOrQuery);
        
      if (error || !drivers || drivers.length === 0) return; // Cannot switch
      
      setUserRole('driver');
      setDriver(drivers[0]);
      await AsyncStorage.setItem('user_role', 'driver');
      await AsyncStorage.setItem('driver_data', JSON.stringify(drivers[0]));
    } else if (newRole === 'teacher') {
      const teacherOrQuery = variations.map(fmt => `phone.eq.${fmt}`).join(',');
      const { data: teachers, error } = await coreSupabase
        .from('teachers')
        .select('*')
        .or(teacherOrQuery);
        
      if (error || !teachers || teachers.length === 0) return; // Cannot switch
      
      setUserRole('teacher');
      setTeacher(teachers[0]);
      await AsyncStorage.setItem('user_role', 'teacher');
      await AsyncStorage.setItem('teacher_data', JSON.stringify(teachers[0]));
    } else {
      setUserRole('parent');
      await AsyncStorage.setItem('user_role', 'parent');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    resetSchoolDatabase();
    await AsyncStorage.removeItem('manual_session_phone');
    await AsyncStorage.removeItem('selected_student_id');
    await AsyncStorage.removeItem('user_role');
    await AsyncStorage.removeItem('driver_data');
    await AsyncStorage.removeItem('teacher_data');
    setUser(null);
    setSession(null);
    setUserRole(null);
    setDriver(null);
    setTeacher(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, userRole, driver, teacher, signOut, signInManual, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
