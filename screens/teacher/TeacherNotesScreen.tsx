import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Modal,
  Switch,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { getTeacherNotes, saveTeacherNote, deleteTeacherNote, TeacherNote } from '../../services/notes';
import DateTimePicker from '@react-native-community/datetimepicker';
// import * as Notifications from 'expo-notifications';
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.log('expo-notifications not supported in Expo Go SDK 53+', e);
}
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import RenderHtml from 'react-native-render-html';

export default function TeacherNotesScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<TeacherNote | null>(null);
  const [content, setContent] = useState('');
  const [isReminder, setIsReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);
  const [viewingNote, setViewingNote] = useState<TeacherNote | null>(null);
  const { width } = useWindowDimensions();
  const richText = React.useRef<RichEditor>(null);

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (filterDate) {
      filtered = filtered.filter(n => {
        const d = new Date(n.created_at);
        return d.getFullYear() === filterDate.getFullYear() &&
               d.getMonth() === filterDate.getMonth() &&
               d.getDate() === filterDate.getDate();
      });
    }
    return filtered;
  }, [notes, filterDate]);

  useEffect(() => {
    loadNotes();
    requestNotificationPermissions();
  }, [teacher]);

  const requestNotificationPermissions = async () => {
    if (!Notifications) return;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    } catch (e) {
      console.log('Notifications permissions error (expected in Expo Go SDK 53+):', e);
    }
  };

  const loadNotes = async () => {
    if (teacher?.school_id) {
      setLoading(true);
      const data = await getTeacherNotes(teacher.school_id, teacher.id);
      setNotes(data);
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingNote(null);
    setContent('');
    setIsReminder(false);
    setReminderTime(new Date());
    setIsModalVisible(true);
  };

  const handleEdit = (note: TeacherNote) => {
    setEditingNote(note);
    setContent(note.content);
    setIsReminder(note.is_reminder);
    if (note.reminder_time) {
      setReminderTime(new Date(note.reminder_time));
    } else {
      setReminderTime(new Date());
    }
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await deleteTeacherNote(id);
        setNotes(notes.filter(n => n.id !== id));
      }}
    ]);
  };

  const scheduleReminder = async (noteContent: string, date: Date) => {
    if (!Notifications) return;
    if (date > new Date()) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Reminder: My Notes",
            body: noteContent.replace(/<[^>]*>?/gm, '').substring(0, 100),
          },
          trigger: date,
        });
      } catch (e) {
        console.error("Failed to schedule notification", e);
      }
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Note content cannot be empty');
      return;
    }
    
    setSaving(true);
    const result = await saveTeacherNote(
      teacher!.school_id,
      teacher!.id,
      content,
      isReminder,
      isReminder ? reminderTime.toISOString() : null,
      editingNote?.id
    );
    setSaving(false);

    if (result.success) {
      if (isReminder) {
        await scheduleReminder(content, reminderTime);
      }
      setIsModalVisible(false);
      loadNotes();
    } else {
      Alert.alert('Error', result.error || 'Failed to save note');
    }
  };

  const renderItem = ({ item }: { item: TeacherNote }) => {
    return (
      <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: colors.border }]}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => setViewingNote(item)}
          style={{ marginBottom: 16, maxHeight: 100, overflow: 'hidden' }}
        >
          <View pointerEvents="none">
           <RenderHtml 
             contentWidth={width - 64}
             source={{ html: item.content.replace(/&nbsp;/g, ' ') }} 
             baseStyle={{ color: colors.text, fontSize: 15, margin: 0, padding: 0 }}
             tagsStyles={{
               b: { fontWeight: 'bold' },
               strong: { fontWeight: 'bold' },
               i: { fontStyle: 'italic' },
               em: { fontStyle: 'italic' },
               u: { textDecorationLine: 'underline' }
             }}
           />
          </View>
        </TouchableOpacity>
        
        <View style={styles.cardFooter}>
          {item.is_reminder && item.reminder_time ? (
            <View style={styles.reminderBadge}>
              <Ionicons name="notifications" size={14} color="#f59e0b" />
              <Text style={styles.reminderText}>
                {new Date(item.reminder_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ) : (
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          )}
          
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
              <Ionicons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Ionicons name="trash" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.filtersContainer}>
          <TouchableOpacity 
            style={[styles.dateFilterBtn, { backgroundColor: filterDate ? colors.primary : colors.surface, borderColor: colors.border }]}
            onPress={() => setShowFilterDatePicker(true)}
          >
            <Ionicons name="calendar" size={16} color={filterDate ? '#fff' : colors.textSecondary} />
            <Text style={{ color: filterDate ? '#fff' : colors.text, fontSize: 14 }}>
              {filterDate ? filterDate.toLocaleDateString() : 'Filter by Date'}
            </Text>
          </TouchableOpacity>

          {filterDate && (
            <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setFilterDate(null)}>
              <Ionicons name="close-circle" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {showFilterDatePicker && (
          <DateTimePicker
            value={filterDate || new Date()}
            mode="date"
            display="default"
            onChange={(e, date) => {
              setShowFilterDatePicker(Platform.OS === 'ios');
              if (date) setFilterDate(date);
            }}
          />
        )}

        {filteredNotes.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {notes.length === 0 ? "No notes found." : "No notes match the selected date."}
            </Text>
            {notes.length === 0 && (
              <TouchableOpacity 
                style={[styles.createBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
                onPress={handleCreateNew}
              >
                <Text style={styles.createBtnText}>Create your first note</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <FlatList
              data={filteredNotes}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
            />
          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={handleCreateNew}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
              {editingNote ? 'Edit Note' : 'New Note'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={colors.primary} /> : (
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <RichToolbar
            editor={richText}
            actions={[actions.setBold, actions.setItalic, actions.setUnderline, actions.setStrikethrough]}
            iconTint={colors.textSecondary}
            selectedIconTint={colors.primary}
            style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }}
          />

          <ScrollView style={{ flex: 1 }}>
            <View style={{ minHeight: 250 }}>
              <RichEditor
                ref={richText}
                initialContentHTML={content}
                onChange={setContent}
                placeholder="Write your note here..."
                editorStyle={{ 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  placeholderColor: colors.textSecondary,
                }}
              />
            </View>

            <View style={[styles.reminderSection, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
              <View style={styles.reminderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="notifications" size={22} color="#f59e0b" />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Set as reminder</Text>
                </View>
                <Switch 
                  value={isReminder}
                  onValueChange={setIsReminder}
                  trackColor={{ true: colors.primary, false: '#ccc' }}
                />
              </View>

              {isReminder && (
                <View style={styles.dateTimePickerContainer}>
                  <TouchableOpacity 
                    style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    <Text style={{ color: colors.text }}>{reminderTime.toLocaleDateString()}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <Text style={{ color: colors.text }}>{reminderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={reminderTime}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) {
                      const newDate = new Date(reminderTime);
                      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      setReminderTime(newDate);
                    }
                  }}
                />
              )}
              
              {showTimePicker && (
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display="default"
                  onChange={(e, time) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (time) {
                      const newDate = new Date(reminderTime);
                      newDate.setHours(time.getHours(), time.getMinutes());
                      setReminderTime(newDate);
                    }
                  }}
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!viewingNote} transparent animationType="fade">
        <View style={styles.viewModalOverlay}>
          <View style={[styles.viewModalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.viewModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>View Note</Text>
              <TouchableOpacity onPress={() => setViewingNote(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
              {viewingNote && (
                <RenderHtml 
                  contentWidth={width - 64}
                  source={{ html: viewingNote.content.replace(/&nbsp;/g, ' ') }} 
                  baseStyle={{ color: colors.text, fontSize: 16, margin: 0, padding: 0 }}
                  tagsStyles={{
                    b: { fontWeight: 'bold' },
                    strong: { fontWeight: 'bold' },
                    i: { fontStyle: 'italic' },
                    em: { fontStyle: 'italic' },
                    u: { textDecorationLine: 'underline' }
                  }}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { marginTop: 12, fontSize: 16, fontWeight: '500' },
  listContainer: { padding: 16 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  dateText: { fontSize: 12 },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reminderText: { color: '#b45309', fontSize: 12, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  createBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 40 : 0 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  editorToolbar: {
    flexDirection: 'row',
    padding: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  toolbarBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  reminderSection: {
    padding: 16,
    borderTopWidth: 1,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  viewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  viewModalContent: {
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 20
  },
  viewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 4,
  },
});
