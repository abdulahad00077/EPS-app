import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../hooks/useAuth';
import { useStudent } from '../hooks/useStudent';
import { useTheme } from '../contexts/ThemeContext';
import { getStudentDocuments, submitDocument, StudentDocument } from '../services/documents';
import CustomDropdown from '../components/CustomDropdown';

const DOCUMENT_TYPES = [
  "Student's Adhar card",
  "Mother's Adhar Card",
  "Father's Adhar card",
  'Marksheet',
  'TC',
  'Birth Certificate',
  'Other'
];

export default function DocumentsScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { selectedStudent } = useStudent();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStudent) {
      loadDocuments();
    }
  }, [selectedStudent]);

  const loadDocuments = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    const docs = await getStudentDocuments(selectedStudent.id);
    
    const adminDocs: StudentDocument[] = [];
    const docFields = [
      { key: 'student_aadhaar_doc_url' as const, title: "Student's Adhar card" },
      { key: 'mother_aadhaar_doc_url' as const, title: "Mother's Adhar Card" },
      { key: 'father_aadhaar_doc_url' as const, title: "Father's Adhar card" },
      { key: 'marksheet_doc_url' as const, title: "Marksheet" },
      { key: 'tc_doc_url' as const, title: "TC" },
      { key: 'birth_certificate_doc_url' as const, title: "Birth Certificate" }
    ];

    docFields.forEach((field, index) => {
      const url = selectedStudent[field.key];
      if (url && typeof url === 'string') {
        adminDocs.push({
          id: `admin_doc_${index}`,
          student_id: selectedStudent.id,
          school_id: selectedStudent.school_id || '',
          document_type: field.title,
          file_url: url,
          status: 'approved',
          uploaded_by: 'admin',
          created_at: selectedStudent.created_at || new Date().toISOString(),
        });
      }
    });

    setDocuments([...adminDocs, ...docs]);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!selectedDocType) {
      Alert.alert('Error', 'Please select a document type first.');
      return;
    }
    
    if (!selectedStudent) {
      Alert.alert('Error', 'No student selected.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      if (!result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      
      // Since actual file upload requires Supabase Storage configuration and formData,
      // For this demo, we'll store a mock URL. In a real scenario, you'd upload `file.uri` 
      // to Supabase Storage and get the public URL here.
      setIsUploading(true);
      
      const mockFileUrl = file.uri; 

      const res = await submitDocument(
        selectedStudent.id,
        selectedStudent.school_id || '',
        selectedDocType,
        mockFileUrl
      );

      if (res.success) {
        Alert.alert('Success', 'Document uploaded successfully!');
        setSelectedDocType(null);
        loadDocuments();
      } else {
        Alert.alert('Upload Failed', res.error || 'Unknown error');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick document');
    } finally {
      setIsUploading(false);
    }
  };

  const renderDoc = ({ item }: { item: StudentDocument }) => {
    const isApproved = item.status === 'approved';
    const isRejected = item.status === 'rejected';

    return (
      <View style={[styles.docCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.docHeader}>
          <Text style={[styles.docType, { color: colors.text }]}>{item.document_type}</Text>
          <View style={[
            styles.badge, 
            { backgroundColor: isApproved ? '#10b98120' : isRejected ? '#ef444420' : '#f59e0b20' }
          ]}>
            <Text style={[
              styles.badgeText,
              { color: isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b' }
            ]}>
              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
            </Text>
          </View>
        </View>
        <Text style={[styles.docDate, { color: colors.textSecondary }]}>
          Uploaded on: {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <View style={[styles.fileContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={[styles.fileName, { color: colors.primary }]} numberOfLines={1}>
            {item.file_url.split('/').pop() || 'Document'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={[styles.headerWrapper, { backgroundColor: headerBg }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#ffffff', '#F8FAFC']}
          style={[styles.headerGradient, { borderBottomColor: borderColor }]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color={textColor} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: textColor }]}>Documents</Text>
              <Text style={[styles.headerSubtitle, { color: subtextColor }]}>Manage student files</Text>
            </View>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Feather name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        
        {/* Upload Section */}
        <View style={[styles.uploadSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upload New Document</Text>
          <View style={styles.inputGroup}>
            <CustomDropdown
              label="Select Document Type"
              data={DOCUMENT_TYPES}
              selectedValue={selectedDocType}
              onSelect={setSelectedDocType}
              placeholder="Choose a document type"
            />
          </View>
          <TouchableOpacity 
            style={[styles.uploadBtn, { backgroundColor: colors.primary, opacity: isUploading ? 0.7 : 1 }]} 
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadBtnText}>Select & Upload File</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: 20, marginTop: 20, marginBottom: 10 }]}>
          My Documents
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={documents}
            keyExtractor={item => item.id}
            renderItem={renderDoc}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No documents uploaded yet</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingTop: 20 },
  center: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 12, fontSize: 16 },

  headerWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  
  uploadSection: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
    zIndex: 10,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  docCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  docType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  docDate: {
    fontSize: 12,
    marginBottom: 12,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  }
});
