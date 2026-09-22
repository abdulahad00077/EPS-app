import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Platform, Modal as RNModal, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import CustomDropdown from '../../components/CustomDropdown';
import DateTimePicker from '@react-native-community/datetimepicker';

const CATEGORIES = ['All', 'Academic', 'Sports', 'Literary', 'Cultural', 'Arts', 'Science & Tech', 'Music & Dance', 'General'];
const STATUSES = ['All', 'Upcoming', 'Ongoing', 'Completed'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TeacherCompetitionsScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  
  const insets = useSafeAreaInsets();
  const { data: competitions, loading } = useRealtimeData<any>('competitions', teacher?.school_id, { column: 'date', ascending: false });

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filteredCompetitions = useMemo(() => {
    if (!competitions) return [];
    let filtered = competitions;

    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter((c: any) => {
        const cat = (c.category || c.type || 'General').toLowerCase();
        return cat === selectedCategory.toLowerCase();
      });
    }

    if (selectedStatus && selectedStatus !== 'All') {
      filtered = filtered.filter((c: any) => {
        return (c.status || '').toLowerCase() === selectedStatus.toLowerCase();
      });
    }

    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter((c: any) => {
        if (!c.date) return false;
        return c.date.startsWith(dateStr);
      });
    }

    return filtered;
  }, [competitions, selectedCategory, selectedStatus, selectedDate]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return { bg: isDark ? '#1e3a8a' : '#dbeafe', text: '#3b82f6' };
      case 'ongoing':
        return { bg: isDark ? '#78350f' : '#fef3c7', text: '#f59e0b' };
      case 'completed':
        return { bg: isDark ? '#064e3b' : '#d1fae5', text: '#10b981' };
      default:
        return { bg: isDark ? '#374151' : '#f3f4f6', text: '#6b7280' };
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category?.toLowerCase()) {
      case 'academic': return 'school';
      case 'sports': return 'football';
      case 'literary': return 'book';
      case 'cultural': return 'color-palette';
      case 'arts': return 'brush';
      case 'science & tech': return 'flask';
      case 'music & dance': return 'musical-notes';
      default: return 'trophy';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'academic': return '#6366f1';
      case 'sports': return '#10b981';
      case 'literary': return '#a855f7';
      case 'cultural': return '#f59e0b';
      case 'arts': return '#ec4899';
      case 'science & tech': return '#06b6d4';
      case 'music & dance': return '#f97316';
      default: return '#6366f1';
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedStatus(null);
    setSelectedDate(null);
  };

  const hasActiveFilters = selectedCategory || selectedStatus || selectedDate;

  const renderCompetitionCard = ({ item }: { item: any }) => {
    const compTitle = item.title || item.name || 'Untitled Competition';
    const compCategory = item.category || item.type || 'General';
    const compPoster = item.poster_url || item.image_url || item.results?.poster_url;
    const compVenue = item.venue || item.results?.venue || 'School Campus';
    const compTime = item.time || item.results?.time;
    const compEligibility = item.eligibility || item.results?.eligibility;
    const participantCount = typeof item.participants === 'number' ? item.participants : (Array.isArray(item.participants) ? item.participants.length : 0);
    const statusColor = getStatusColor(item.status);
    const catColor = getCategoryColor(compCategory);
    const catIcon = getCategoryIcon(compCategory);

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Poster Image */}
        {compPoster ? (
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => setPreviewImage(compPoster)}
            style={styles.posterContainer}
          >
            <Image source={{ uri: compPoster }} style={styles.posterImage} resizeMode="cover" />
            <View style={styles.posterOverlay}>
              <View style={[styles.statusBadgeOnImage, { backgroundColor: statusColor.bg }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>{item.status || 'Active'}</Text>
              </View>
              <View style={styles.categoryBadgeOnImage}>
                <Text style={styles.categoryBadgeText}>{compCategory}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.posterPlaceholder, { backgroundColor: catColor + '15' }]}>
            <Ionicons name={catIcon as any} size={36} color={catColor} style={{ opacity: 0.7 }} />
            <Text style={[styles.placeholderCategoryText, { color: catColor }]}>{compCategory}</Text>
            <View style={[styles.statusBadgeOnPlaceholder, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>{item.status || 'Active'}</Text>
            </View>
          </View>
        )}

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{compTitle}</Text>
          
          {item.description ? (
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
          ) : null}

          {/* Info Section */}
          <View style={[styles.infoSection, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
            {/* Date & Time */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                {compTime ? ` • ${compTime}` : ''}
              </Text>
            </View>

            {/* Venue */}
            <View style={styles.infoRow}>
              <Ionicons name="location" size={14} color="#ef4444" />
              <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={1}>{compVenue}</Text>
            </View>

            {/* Participants & Eligibility */}
            <View style={[styles.infoFooter, { borderTopColor: colors.border }]}>
              <View style={styles.infoRow}>
                <Ionicons name="people" size={13} color="#10b981" />
                <Text style={[styles.infoSmallText, { color: colors.textSecondary }]}>{participantCount} registered</Text>
              </View>
              {compEligibility ? (
                <View style={styles.infoRow}>
                  <Ionicons name="ribbon" size={13} color="#f59e0b" />
                  <Text style={[styles.infoSmallText, { color: colors.text, fontWeight: '600' }]}>{compEligibility}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      {/* Filters Section */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.filterRow}>
          <View style={{ flex: 1 }}>
            <CustomDropdown 
              label="Category"
              data={CATEGORIES}
              selectedValue={selectedCategory}
              onSelect={setSelectedCategory}
              placeholder="All"
            />
          </View>
          <View style={{ flex: 1 }}>
            <CustomDropdown 
              label="Status"
              data={STATUSES}
              selectedValue={selectedStatus}
              onSelect={setSelectedStatus}
              placeholder="All"
            />
          </View>
        </View>

        {/* Date Filter Row */}
        <View style={styles.dateFilterRow}>
          <TouchableOpacity 
            style={[styles.datePickerBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={[styles.datePickerText, { color: selectedDate ? colors.text : colors.textSecondary }]}>
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Filter by Date'}
            </Text>
          </TouchableOpacity>
          {hasActiveFilters && (
            <TouchableOpacity style={[styles.clearBtn, { borderColor: colors.border }]} onPress={clearFilters}>
              <Ionicons name="close-circle" size={16} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (event.type === 'set' && date) {
                setSelectedDate(date);
              }
              if (Platform.OS !== 'ios') {
                setShowDatePicker(false);
              }
            }}
          />
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCompetitions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          renderItem={renderCompetitionCard}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Ionicons name="trophy-outline" size={60} color={colors.border} style={{ marginBottom: 15 }} />
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: 5 }}>No Competitions Found</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
                {hasActiveFilters ? 'Try adjusting your filters.' : 'Competitions will appear here when created by admin.'}
              </Text>
            </View>
          )}
        />
      )}

      {/* Full Image Preview Modal */}
      <RNModal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <TouchableOpacity 
          style={styles.imagePreviewOverlay} 
          activeOpacity={1} 
          onPress={() => setPreviewImage(null)}
        >
          <View style={styles.imagePreviewContainer}>
            <TouchableOpacity style={styles.closePreviewBtn} onPress={() => setPreviewImage(null)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {previewImage && (
              <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
            )}
          </View>
        </TouchableOpacity>
      </RNModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersContainer: { 
    padding: 15, 
    borderBottomWidth: 1, 
    gap: 10 
  },
  filterRow: { 
    flexDirection: 'row', 
    gap: 10, 
    zIndex: 10 
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  datePickerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  listContent: { padding: 15 },
  card: { 
    borderRadius: 16, 
    borderWidth: 1, 
    marginBottom: 18, 
    overflow: 'hidden' 
  },
  posterContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 12,
  },
  statusBadgeOnImage: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBadgeOnImage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  posterPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  placeholderCategoryText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  statusBadgeOnPlaceholder: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  infoSection: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  infoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  infoSmallText: {
    fontSize: 11,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 40 
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePreviewBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  previewImage: {
    width: SCREEN_WIDTH - 20,
    height: '80%',
  },
});
