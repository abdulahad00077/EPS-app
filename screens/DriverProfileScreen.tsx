import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const DriverProfileScreen = () => {
  const { driver } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('myProfile', 'My Profile')}</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={isDark ? ['#334155', '#1E293B'] : ['#E0F2FE', '#BAE6FD']}
            style={styles.avatarContainer}
          >
            <Text style={[styles.avatarInitial, { color: isDark ? '#F1F5F9' : '#0284C7' }]}>
              {driver?.name ? driver.name.charAt(0).toUpperCase() : 'D'}
            </Text>
          </LinearGradient>
          <Text style={[styles.profileName, { color: textColor }]}>{driver?.name || t('driver', 'Driver')}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('driver', 'Driver')}</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={[styles.infoCard, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: subtextColor }]}>{t('personalDetails', 'PERSONAL DETAILS').toUpperCase()}</Text>
          
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
              <Feather name="phone" size={20} color="#0284C7" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: subtextColor }]}>{t('phone', 'Phone Number')}</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{driver?.phone || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: subtextColor }]}>{t('vehicleDetails', 'VEHICLE DETAILS').toUpperCase()}</Text>
          
          <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 16, marginBottom: 16 }]}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="bus-school" size={20} color="#10B981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: subtextColor }]}>{t('vehicleTypeName', 'Vehicle Type / Name')}</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{driver?.vehicle_name || 'N/A'}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 16, marginBottom: 16 }]}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="identifier" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: subtextColor }]}>{t('vehicleNumber', 'Vehicle Number')}</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{driver?.vehicle_number || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
              <Feather name="map" size={20} color="#F59E0B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: subtextColor }]}>{t('routeId', 'Route ID')}</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{driver?.route_id || 'N/A'}</Text>
            </View>
          </View>
        </View>
        
        <View style={{ height: 40 }} />
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
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverProfileScreen;
