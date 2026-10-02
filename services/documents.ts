import { supabase } from './supabase';

export interface StudentDocument {
  id: string;
  student_id: string;
  school_id: string;
  document_type: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_by: string;
  created_at: string;
  student?: any;
}

export const getStudentDocuments = async (studentId: string): Promise<StudentDocument[]> => {
  const { data, error } = await supabase
    .from('student_documents')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching student documents:', error);
    return [];
  }

  return data as StudentDocument[];
};

export const getSchoolDocuments = async (schoolId: string): Promise<StudentDocument[]> => {
  const { data, error } = await supabase
    .from('student_documents')
    .select('*, student:students(name, class, section, roll_number)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching school documents:', error);
    return [];
  }

  return data as StudentDocument[];
};

export const submitDocument = async (
  studentId: string,
  schoolId: string,
  documentType: string,
  fileUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error: insertError } = await supabase
      .from('student_documents')
      .insert({
        student_id: studentId,
        school_id: schoolId,
        document_type: documentType,
        file_url: fileUrl,
        uploaded_by: 'parent',
        status: 'pending'
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
};

export const updateDocumentStatus = async (
  docId: string,
  status: 'approved' | 'rejected'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error: updateError } = await supabase
      .from('student_documents')
      .update({ status })
      .eq('id', docId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
};
