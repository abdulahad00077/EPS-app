import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { useTeacherFilter } from '../../contexts/TeacherFilterContext';
import CustomDropdown from '../../components/CustomDropdown';
import { supabase } from '../../services/supabase';
import * as DocumentPicker from 'expo-document-picker';

import { PDFDocument } from 'pdf-lib';

export default function TeacherSyllabusScreen() {
  const { teacher } = useAuth();
  const { colors, isDark } = useTheme();
  
  const insets = useSafeAreaInsets();
  const { data: syllabus, loading, refetch } = useRealtimeData<any>('syllabus', teacher?.school_id, { column: 'created_at', ascending: false });
  const { selectedClass } = useTeacherFilter();
  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [globalSubjects, setGlobalSubjects] = useState<string[]>([]);
  
  // Add Syllabus Modal State
  const predefinedClasses = ['Play-Nursery', 'Nursery', 'LKG', 'UKG', 'Prep', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [pdfFile, setPdfFile] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newSyllabus, setNewSyllabus] = useState({
    class: '',
    subject: '',
    chapter_name: '',
    description: ''
  });

  useEffect(() => {
    if (teacher?.school_id) {
      fetchGlobalSubjects();
    }
  }, [teacher?.school_id]);

  const fetchGlobalSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('name')
        .eq('school_id', teacher?.school_id)
        .order('name');
      if (error) throw error;
      setGlobalSubjects(data.map((s: any) => s.name));
    } catch (e) {
      console.error('Error fetching global subjects:', e);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        // Limit to 10MB
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a PDF smaller than 10MB.');
          return;
        }
        setPdfFile(file);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const subjects = useMemo(() => {
    if (!syllabus) return [];
    const classFiltered = selectedClass ? syllabus.filter((s: any) => s.class === selectedClass) : syllabus;
    const uniqueSubjects = Array.from(new Set(classFiltered.map((s: any) => s.subject))).filter(Boolean) as string[];
    return uniqueSubjects;
  }, [syllabus, selectedClass]);

  const filteredSyllabus = useMemo(() => {
    if (!syllabus) return [];
    let filtered = syllabus;
    if (selectedClass) {
      filtered = filtered.filter((s: any) => s.class === selectedClass);
    }
    if (selectedSubject) {
      filtered = filtered.filter((s: any) => s.subject === selectedSubject);
    }
    return filtered;
  }, [syllabus, selectedClass, selectedSubject]);

  const handleAddSyllabus = async () => {
    const finalSubject = isCustomSubject ? customSubjectName.trim() : newSyllabus.subject;
    
    if (!newSyllabus.class || !finalSubject || !newSyllabus.chapter_name) {
      Alert.alert('Error', 'Please fill in Class, Subject, and Chapter Name.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Insert new subject if it is custom
      if (isCustomSubject) {
        const { data: existingSubject } = await supabase
          .from('subjects')
          .select('id')
          .eq('school_id', teacher?.school_id)
          .ilike('name', finalSubject)
          .maybeSingle();
          
        if (!existingSubject) {
          await supabase.from('subjects').insert([
            { school_id: teacher?.school_id, name: finalSubject }
          ]);
          fetchGlobalSubjects();
        }
      }

      // 2. Upload PDF if selected (with compression)
      let fileUrl = null;
      if (pdfFile) {
        const sanitizedName = pdfFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const fileName = `syllabus/${teacher?.school_id}/${Date.now()}_${sanitizedName}`;
        
        // Read file safely using fetch and FileReader to bypass Android file read restrictions
        const response = await fetch(pdfFile.uri);
        const blob = await response.blob();
        
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        });
        
        // Decode base64 to Uint8Array
        const binaryString = atob(base64Data);
        const originalBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          originalBytes[i] = binaryString.charCodeAt(i);
        }

        // Compress PDF using pdf-lib
        let uploadBytes: Uint8Array;
        try {
          const pdfDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
          
          // Strip metadata to reduce size
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setKeywords([]);
          pdfDoc.setProducer('');
          pdfDoc.setCreator('');

          // Re-serialize with maximum compression (object streams use deflate)
          const optimizedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 100,
          });
          uploadBytes = new Uint8Array(optimizedBytes);
          
          const savedPercent = ((1 - uploadBytes.length / originalBytes.length) * 100).toFixed(1);
          console.log(`PDF compressed: ${(originalBytes.length / 1024).toFixed(0)}KB → ${(uploadBytes.length / 1024).toFixed(0)}KB (saved ${savedPercent}%)`);
        } catch (compressError) {
          console.warn('PDF compression failed, uploading original:', compressError);
          uploadBytes = originalBytes;
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, uploadBytes.buffer as ArrayBuffer, {
            contentType: 'application/pdf',
          });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(fileName);
          
        fileUrl = publicUrlData.publicUrl;
      }

      // 3. Insert or Update Syllabus
      const payload: any = {
        class: newSyllabus.class,
        subject: finalSubject,
        chapter_name: newSyllabus.chapter_name,
        description: newSyllabus.description,
      };
      
      if (fileUrl) payload.attachment_url = fileUrl;

      if (editingId) {
        const { error } = await supabase
          .from('syllabus')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        Alert.alert('Success', 'Syllabus updated successfully!');
      } else {
        payload.school_id = teacher?.school_id;
        const { error } = await supabase.from('syllabus').insert([payload]);
        if (error) throw error;
        Alert.alert('Success', 'Syllabus added successfully!');
      }
      
      setIsAddModalVisible(false);
      setEditingId(null);
      setNewSyllabus({ class: '', subject: '', chapter_name: '', description: '' });
      setIsCustomSubject(false);
      setCustomSubjectName('');
      setPdfFile(null);
      refetch();

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to save syllabus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setNewSyllabus({
      class: item.class,
      subject: item.subject,
      chapter_name: item.chapter_name,
      description: item.description || ''
    });
    setIsCustomSubject(false);
    setCustomSubjectName('');
    setPdfFile(null);
    setIsAddModalVisible(true);
  };

  const handleDeleteSyllabus = (id: string) => {
    Alert.alert(
      "Delete Syllabus",
      "Are you sure you want to delete this syllabus? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('syllabus')
                .delete()
                .eq('id', id);
              if (error) throw error;
              Alert.alert('Success', 'Syllabus deleted.');
              refetch();

            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete syllabus');
            }
          }
        }
      ]
    );
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.filterRow}>
          <CustomDropdown 
            label="Subject"
            data={subjects}
            selectedValue={selectedSubject}
            onSelect={setSelectedSubject}
            placeholder="All Subjects"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSyllabus}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="book" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>{item.chapter_name || 'Chapter'}</Text>
                    <Text style={[styles.subjectText, { color: colors.textSecondary }]}>{item.subject}</Text>
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: isDark ? '#1e3a8a' : '#dbeafe' }]}>
                  <Text style={[styles.badgeText, { color: '#2563eb' }]}>Class {item.class}</Text>
                </View>
              </View>
              
              <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.description}</Text>
              
              {item.attachment_url && (
                <TouchableOpacity 
                  style={[styles.attachmentBtn, { backgroundColor: colors.primary + '10' }]}
                  onPress={() => Linking.openURL(item.attachment_url)}
                >
                  <Ionicons name="document-text" size={16} color={colors.primary} />
                  <Text style={[styles.attachmentText, { color: colors.primary }]}>View Attachment</Text>
                </TouchableOpacity>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.primary + '10' }]} 
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} 
                  onPress={() => handleDeleteSyllabus(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={60} color={colors.border} style={{marginBottom: 15}} />
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>No syllabus records found.</Text>
            </View>
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setIsAddModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Add Syllabus Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Syllabus</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* Class Dropdown */}
              <View style={styles.formGroup}>
                <CustomDropdown 
                  label="Class"
                  data={predefinedClasses}
                  selectedValue={newSyllabus.class}
                  onSelect={(val) => setNewSyllabus({...newSyllabus, class: val || ''})}
                  placeholder="Select Class"
                />
              </View>

              {/* Subject Dropdown & Custom Option */}
              <View style={styles.formGroup}>
                {!isCustomSubject ? (
                  <CustomDropdown 
                    label="Subject"
                    data={[...globalSubjects, '+ Add new Subject']}
                    selectedValue={newSyllabus.subject}
                    onSelect={(val) => {
                      if (val === '+ Add new Subject') {
                        setIsCustomSubject(true);
                        setNewSyllabus({...newSyllabus, subject: ''});
                      } else {
                        setNewSyllabus({...newSyllabus, subject: val || ''});
                      }
                    }}
                    placeholder="Select Subject"
                  />
                ) : (
                  <View style={styles.customSubjectRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="Enter new subject name"
                      placeholderTextColor={colors.textSecondary}
                      value={customSubjectName}
                      onChangeText={setCustomSubjectName}
                      autoFocus
                    />
                    <TouchableOpacity 
                      style={[styles.cancelBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        setIsCustomSubject(false);
                        setCustomSubjectName('');
                      }}
                    >
                      <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Chapter Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. Algebra"
                  placeholderTextColor={colors.textSecondary}
                  value={newSyllabus.chapter_name}
                  onChangeText={(text) => setNewSyllabus({...newSyllabus, chapter_name: text})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Topics covered..."
                  placeholderTextColor={colors.textSecondary}
                  value={newSyllabus.description}
                  onChangeText={(text) => setNewSyllabus({...newSyllabus, description: text})}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Attach PDF (Optional)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity 
                    style={[styles.uploadBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={pickDocument}
                  >
                    <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: '500' }}>Choose PDF</Text>
                  </TouchableOpacity>
                  {pdfFile && (
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="document-text" size={16} color={colors.textSecondary} />
                      <Text style={{ color: colors.text, fontSize: 13, flex: 1 }} numberOfLines={1} ellipsizeMode="middle">
                        {pdfFile.name}
                      </Text>
                      <TouchableOpacity onPress={() => setPdfFile(null)}>
                        <Ionicons name="close-circle" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
                onPress={handleAddSyllabus}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Add Syllabus</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersContainer: { padding: 15, borderBottomWidth: 1, zIndex: 10 },
  filterRow: { flexDirection: 'row', zIndex: 10 },
  listContent: { padding: 20 },
  card: { padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  subjectText: { fontSize: 13, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  desc: { fontSize: 14, marginBottom: 15, lineHeight: 22 },
  attachmentBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  attachmentText: { fontSize: 13, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  formGroup: { marginBottom: 16, zIndex: 1 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  textArea: { height: 100 },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  customSubjectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cancelBtn: { padding: 12, borderWidth: 1, borderRadius: 12, justifyContent: 'center' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  }
});
