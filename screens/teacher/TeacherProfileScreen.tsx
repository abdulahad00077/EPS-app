import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function TeacherProfileScreen() {
  const { teacher, signOut } = useAuth();
  const { colors, isDark } = useTheme();

  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.profileHeader}>
          {teacher?.photo_url ? (
            <Image 
              source={{ uri: teacher.photo_url }} 
              style={[styles.avatar, { borderColor: colors.border }]} 
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.border }]}>
              <Ionicons name="person" size={40} color={colors.textSecondary} />
            </View>
          )}
          <Text style={[styles.name, { color: colors.text }]}>{teacher?.name}</Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>@{teacher?.username}</Text>
          {teacher?.teacher_id && (
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{teacher.teacher_id}</Text>
            </View>
          )}
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Age / Gender</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {teacher?.age ? `${teacher.age} yrs` : 'N/A'} {teacher?.gender ? `/ ${teacher.gender}` : ''}
            </Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Blood Group</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{teacher?.blood_group || 'N/A'}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Contact</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{teacher?.phone || 'N/A'}</Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Aadhaar</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{teacher?.aadhaar_number || 'N/A'}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Address</Text>
            <Text style={[styles.infoValue, { color: colors.text, flex: 1, textAlign: 'right', marginLeft: 20 }]}>{teacher?.address || 'N/A'}</Text>
          </View>
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Professional Details</Text>

          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Joining Date</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{teacher?.joining_date || 'N/A'}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Qualifications</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{teacher?.qualifications || 'N/A'}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Specialization</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{teacher?.specialization_subject || teacher?.subject || 'N/A'}</Text>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Assigned Class</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {teacher?.assigned_class ? `${teacher.assigned_class} ${teacher?.assigned_section || ''}` : 'None'}
            </Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: colors.border, borderBottomWidth: 0, flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, marginBottom: 8 }]}>Classes Taught</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {teacher?.classes_taught && Array.isArray(teacher.classes_taught) ? (
                teacher.classes_taught.map((ct: any, index: number) => (
                  <View key={index} style={[styles.classBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
                      {ct.class} {ct.section}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>None assigned</Text>
              )}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  content: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  username: { fontSize: 16, marginBottom: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  infoSection: { borderRadius: 12, borderWidth: 1, padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  classBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 }
});
