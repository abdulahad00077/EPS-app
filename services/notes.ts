import { supabase } from './supabase';

export interface TeacherNote {
  id: string;
  school_id: string;
  teacher_id: string;
  content: string;
  is_reminder: boolean;
  reminder_time: string | null;
  created_at: string;
}

export const getTeacherNotes = async (schoolId: string, teacherId: string) => {
  try {
    const { data, error } = await supabase
      .from('teacher_notes')
      .select('*')
      .eq('school_id', schoolId)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching teacher notes:', error);
    return [];
  }
};

export const saveTeacherNote = async (
  schoolId: string, 
  teacherId: string, 
  content: string, 
  isReminder: boolean, 
  reminderTime: string | null,
  id?: string
) => {
  try {
    const payload = {
      school_id: schoolId,
      teacher_id: teacherId,
      content,
      is_reminder: isReminder,
      reminder_time: isReminder ? reminderTime : null,
    };

    if (id) {
      const { data, error } = await supabase
        .from('teacher_notes')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('teacher_notes')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    }
  } catch (error: any) {
    console.error('Error saving teacher note:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTeacherNote = async (id: string) => {
  try {
    const { error } = await supabase
      .from('teacher_notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting teacher note:', error);
    return { success: false, error: error.message };
  }
};
