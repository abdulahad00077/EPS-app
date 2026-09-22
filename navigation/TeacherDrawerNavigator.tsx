import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, getFocusedRouteNameFromRoute } from '@react-navigation/native';

// Navigators & Screens
import TeacherTabsNavigator from './TeacherTabsNavigator';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';
import TeacherStudentProfileScreen from '../screens/teacher/TeacherStudentProfileScreen';
import TeacherAttendanceRecordsScreen from '../screens/teacher/TeacherAttendanceRecordsScreen';
import TeacherExamsScreen from '../screens/teacher/TeacherExamsScreen';
import TeacherExamResultsScreen from '../screens/teacher/TeacherExamResultsScreen';
import TeacherSyllabusScreen from '../screens/teacher/TeacherSyllabusScreen';
import TeacherDatesheetScreen from '../screens/teacher/TeacherDatesheetScreen';
import TeacherAnnouncementsScreen from '../screens/teacher/TeacherAnnouncementsScreen';
import TeacherCompetitionsScreen from '../screens/teacher/TeacherCompetitionsScreen';
import { TeacherFilterProvider } from '../contexts/TeacherFilterContext';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const { colors, isDark } = useTheme();
  const { teacher, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
        {teacher?.photo_url ? (
          <Image source={{ uri: teacher.photo_url }} style={[styles.drawerAvatar, { borderColor: colors.border }]} />
        ) : (
          <View style={[styles.drawerAvatar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.border }]}>
            <Ionicons name="person" size={28} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.drawerHeaderInfo}>
          <Text style={[styles.drawerName, { color: colors.text }]} numberOfLines={1}>{teacher?.name}</Text>
          <Text style={[styles.drawerEmail, { color: colors.textSecondary }]} numberOfLines={1}>{teacher?.username}</Text>
        </View>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 10 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BackButton = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('TeacherHome')} style={{ marginLeft: 15 }}>
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
  );
};

export default function TeacherDrawerNavigator() {
  const { colors } = useTheme();

  return (
    <TeacherFilterProvider>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerPosition: 'right',
          headerShown: true,
          headerTintColor: colors.text,
          headerStyle: {
            backgroundColor: colors.background,
          },
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.text,
          drawerStyle: {
            backgroundColor: colors.background,
          }
        }}
      >
        <Drawer.Screen 
          name="TeacherHome" 
          component={TeacherTabsNavigator} 
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'TeacherDashboard';
            
            let headerTitle: string | (() => React.ReactNode) = () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Image 
                  source={require('../assets/school-logo.png')} 
                  style={{ width: 32, height: 32, borderRadius: 6 }} 
                  resizeMode="contain"
                />
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                  Elegant Public School
                </Text>
              </View>
            );
            let showBackButton = false;
            
            if (routeName === 'TeacherStudents') {
              headerTitle = 'Students';
              showBackButton = true;
            } else if (routeName === 'TeacherAttendance') {
              headerTitle = 'Attendance';
              showBackButton = true;
            }
            
            return {
              title: 'Home',
              headerTitle,
              headerLeft: showBackButton ? () => <BackButton /> : undefined,
              drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />
            };
          }} 
        />
        
        {/* Drawer Modules */}
        <Drawer.Screen 
          name="TeacherProfile" 
          component={TeacherProfileScreen} 
          options={{ 
            title: 'Profile',
            headerLeft: () => <BackButton />,
            drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
            drawerItemStyle: { display: 'none' } // Hide from drawer since it's accessed via Settings
          }} 
        />
        <Drawer.Screen 
          name="TeacherStudentProfile" 
          component={TeacherStudentProfileScreen} 
          options={{ 
            title: 'Student Profile',
            headerLeft: () => <BackButton />,
            drawerItemStyle: { display: 'none' } // Hide from drawer
          }} 
        />
        <Drawer.Screen 
          name="TeacherAttendanceRecords" 
          component={TeacherAttendanceRecordsScreen} 
          options={{ 
            title: 'Attendance Records',
            headerLeft: () => <BackButton />,
            drawerItemStyle: { display: 'none' } // Hide from drawer
          }} 
        />
        <Drawer.Screen 
          name="TeacherExams" 
          component={TeacherExamsScreen} 
          options={{ drawerLabel: 'Exams & Results', headerTitle: 'Exams & Results', drawerIcon: ({ color }) => <Ionicons name="document-text-outline" size={22} color={color} /> }}
        />
        <Drawer.Screen 
          name="TeacherExamResults" 
          component={TeacherExamResultsScreen} 
          options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Exam Results' }}
        />
        <Drawer.Screen 
          name="TeacherSyllabus" 
          component={TeacherSyllabusScreen} 
          options={{ 
            title: 'Syllabus',
            headerLeft: () => <BackButton />,
            drawerIcon: ({ color }) => <Ionicons name="book-outline" size={22} color={color} />
          }} 
        />
        <Drawer.Screen 
          name="TeacherDatesheet" 
          component={TeacherDatesheetScreen} 
          options={{ 
            title: 'Datesheet',
            headerLeft: () => <BackButton />,
            drawerIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />
          }} 
        />
        <Drawer.Screen 
          name="TeacherAnnouncements" 
          component={TeacherAnnouncementsScreen} 
          options={{ 
            title: 'Announcements',
            headerLeft: () => <BackButton />,
            drawerIcon: ({ color }) => <Ionicons name="megaphone-outline" size={22} color={color} />
          }} 
        />
        <Drawer.Screen 
          name="TeacherCompetitions" 
          component={TeacherCompetitionsScreen} 
          options={{ 
            title: 'Competitions',
            headerLeft: () => <BackButton />,
            drawerIcon: ({ color }) => <Ionicons name="trophy-outline" size={22} color={color} />
          }} 
        />
      </Drawer.Navigator>
    </TeacherFilterProvider>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  drawerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerHeaderInfo: {
    flex: 1,
  },
  drawerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  drawerEmail: {
    fontSize: 13,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    gap: 10,
    justifyContent: 'center'
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
