import { supabase } from './supabase';

export interface ParentMessage {
  id: string;
  school_id: string;
  student_id: string;
  teacher_id: string;
  message: string;
  sender_type: 'parent' | 'teacher';
  created_at: string;
}

export async function getStudentMessages(studentId: string): Promise<ParentMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('recipient_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching parent messages:', error);
    return [];
  }

  return data || [];
}

export async function sendMessage(schoolId: string, studentId: string, teacherId: string, text: string): Promise<boolean> {
  // Parents are no longer allowed to send messages in this version of the app.
  // This function is kept for reference but should not be called.
  console.warn('sendMessage called from parent app, which is now read-only.');
  return false;

  /* Original implementation:
  const { error } = await supabase
    .from('messages')
    .insert({
      school_id: schoolId,
      student_id: studentId,
      teacher_id: teacherId,
      message: text,
      sender_type: 'parent',
    });

  if (error) {
    console.error('Error sending parent message:', error);
    return false;
  }

  return true;
  */
}
