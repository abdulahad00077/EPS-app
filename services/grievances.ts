import { supabase } from './supabase';
import { Grievance } from '../types';

export const getStudentGrievances = async (studentId: string): Promise<Grievance[]> => {
  const { data, error } = await supabase
    .from('grievances')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching grievances:', error);
    return [];
  }

  return data as Grievance[];
};

export const submitGrievance = async (
  studentId: string,
  schoolId: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if a grievance was already submitted today
    const { data: existingGrievances, error: checkError } = await supabase
      .from('grievances')
      .select('id')
      .eq('student_id', studentId)
      .gte('created_at', today.toISOString());

    if (checkError) {
      return { success: false, error: 'Error checking previous grievances.' };
    }

    if (existingGrievances && existingGrievances.length > 0) {
      return { success: false, error: 'You can only submit one grievance per day.' };
    }

    // Insert new grievance
    const { error: insertError } = await supabase
      .from('grievances')
      .insert({
        student_id: studentId,
        school_id: schoolId,
        message: message,
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
};
