import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
import TabNavigator from './TabNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import FeesScreen from '../screens/FeesScreen';
import SyllabusScreen from '../screens/SyllabusScreen';
import ReportCardScreen from '../screens/ReportCardScreen';
import GrievancesScreen from '../screens/GrievancesScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useStudent } from '../hooks/useStudent';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TouchableOpacity, ScrollView } from 'react-native';
import { useTransliteration } from '../hooks/useTransliteration';

const Drawer = createDrawerNavigator();

const SiblingBadge = ({ student, isSelected, isDark, dividerColor, onPress }: any) => {
  const transName = useTransliteration(student.name.split(' ')[0]);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.siblingBadge,
        { 
          backgroundColor: isSelected ? '#0284c7' : (isDark ? '#334155' : '#E0F2FE'),
          borderColor: isSelected ? '#0284c7' : dividerColor,
          borderWidth: 1
        }
      ]}
    >
      <Text style={[
        styles.siblingText,
        { color: isSelected ? '#FFFFFF' : (isDark ? '#cbd5e1' : '#0284c7') }
      ]}>
        {transName}
      </Text>
    </TouchableOpacity>
  );
};

const CustomDrawerContent = (props: any) => {
  const { signOut } = useAuth();
  const { students, selectedStudent, selectStudent } = useStudent();
  const { isDark } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const transSelectedName = useTransliteration(selectedStudent?.name);

  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const headerBg = isDark ? '#1E293B' : '#F8FAFC';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const dividerColor = isDark ? '#334155' : '#F1F5F9';

  const handleSignOut = () => {
    Alert.alert(
      t('signOut'),
      t('signOutConfirm', 'Are you sure you want to log out?'),
      [
        { text: t('cancel'), style: "cancel" },
        { text: t('signOut'), onPress: signOut, style: 'destructive' }
      ]
    );
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={[styles.drawerContent, { backgroundColor: bgColor }]}>
      <View style={[styles.drawerHeader, { backgroundColor: headerBg, borderBottomColor: dividerColor, position: 'relative' }]}>
        <TouchableOpacity 
          style={{ position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: language === 'en' ? '#E0F2FE' : '#FFEDD5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
          onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        >
          <Feather name="globe" size={14} color={language === 'en' ? '#0284c7' : '#EA580C'} style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: language === 'en' ? '#0284c7' : '#EA580C' }}>
            {language === 'en' ? 'EN' : 'HI'}
          </Text>
        </TouchableOpacity>
        
        {selectedStudent?.photo_url ? (
          <Image 
            source={{ uri: selectedStudent.photo_url }}
            style={[styles.profileAvatarImage, { borderColor: dividerColor }]}
          />
        ) : (
          <View style={[styles.profileAvatar, { backgroundColor: isDark ? '#334155' : '#E0F2FE' }]}>
            <Text style={[styles.avatarInitial, { color: isDark ? '#bae6fd' : '#0284c7' }]}>
              {transSelectedName?.charAt(0) || 'S'}
            </Text>
          </View>
        )}
        <Text style={[styles.profileName, { color: textColor }]}>
          {transSelectedName || t('appName')}
        </Text>
        <Text style={[styles.profileEmail, { color: subtextColor }]}>
          {t('class')} {selectedStudent?.class || '-'}
        </Text>

        {/* Sibling Switcher */}
        {students.length > 1 && (
          <View style={styles.siblingList}>
            <Text style={styles.siblingLabel}>{t('switchProfile', 'SWITCH PROFILE')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.siblingScroll}>
              {students.map((student) => {
                const isSelected = student.id === selectedStudent?.id;
                return (
                  <SiblingBadge 
                    key={student.id}
                    student={student} 
                    isSelected={isSelected} 
                    isDark={isDark} 
                    dividerColor={dividerColor} 
                    onPress={() => {
                      selectStudent(student);
                      props.navigation.closeDrawer();
                    }} 
                  />
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
      
      <View style={[styles.drawerItems, { backgroundColor: bgColor }]}>
        <DrawerItem
          label={t('dashboard')}
          icon={({ size, focused }: { size: number, focused: boolean }) => <Feather name="layout" size={size} color={focused ? '#0284c7' : (isDark ? '#94A3B8' : '#64748b')} />}
          onPress={() => props.navigation.navigate('MainTabs', { screen: 'Dashboard' })}
          labelStyle={[{ marginLeft: -10, fontSize: 14, fontWeight: '600' }, { color: props.state.routes[props.state.index].name === 'MainTabs' ? '#0284c7' : (isDark ? '#94A3B8' : '#64748b') }]}
          activeTintColor="#0284c7"
          inactiveTintColor={isDark ? '#94A3B8' : '#64748b'}
          activeBackgroundColor={isDark ? 'rgba(2,132,199,0.1)' : '#F0F9FF'}
          focused={props.state.routes[props.state.index].name === 'MainTabs'}
        />
        <DrawerItemList {...props} />
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        

        <DrawerItem
          label={t('signOut')}
          icon={({ color, size }: { color: string; size: number }) => <Feather name="log-out" size={size} color="#EF4444" />}
          onPress={handleSignOut}
          labelStyle={[styles.drawerItemLabel, { color: '#EF4444' }]}
        />
      </View>
    </DrawerContentScrollView>
  );
};

const DrawerNavigator = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const inActiveColor = isDark ? '#94A3B8' : '#64748b';

  return (
    <Drawer.Navigator
      drawerContent={(props: any) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#0284c7',
        drawerInactiveTintColor: inActiveColor,
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          marginLeft: -10,
        },
        drawerStyle: {
          width: 280,
          backgroundColor: bgColor,
        }
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{
          drawerItemStyle: { display: 'none' }
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerItemStyle: { display: 'none' }
        }}
      />

      <Drawer.Screen 
        name="Fees" 
        component={FeesScreen}
        options={{
          drawerLabel: t('fees'),
          drawerIcon: ({ color, size }: { color: string; size: number }) => <Feather name="credit-card" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="Syllabus" 
        component={SyllabusScreen}
        options={{
          drawerLabel: t('syllabus', 'Syllabus'),
          drawerIcon: ({ color, size }: { color: string; size: number }) => <Feather name="book" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="ReportCard" 
        component={ReportCardScreen}
        options={{
          drawerLabel: t('reportCard', 'Report Card'),
          drawerIcon: ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="clipboard-text-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="Grievances" 
        component={GrievancesScreen}
        options={{
          drawerLabel: t('grievances', 'Grievances'),
          drawerIcon: ({ color, size }: { color: string; size: number }) => <Feather name="alert-circle" size={size} color={color} />,
        }}
      />
      <Drawer.Screen 
        name="Announcements" 
        component={AnnouncementsScreen}
        options={{
          drawerLabel: t('announcements', 'Announcements'),
          drawerIcon: ({ color, size }: { color: string; size: number }) => <Feather name="bell" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    paddingTop: 0,
  },
  drawerHeader: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  profileAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
    borderWidth: 2,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0284c7',
  },
  siblingList: {
    marginTop: 20,
    width: '100%',
  },
  siblingLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  siblingScroll: {
    flexDirection: 'row',
  },
  siblingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  siblingText: {
    fontSize: 11,
    fontWeight: '800',
  },
  drawerItems: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  drawerItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: -10,
  },
  divider: {
    height: 1,
    marginVertical: 15,
    marginHorizontal: 16,
  },
});

export default DrawerNavigator;
