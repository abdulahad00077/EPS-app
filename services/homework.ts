import { supabase } from './supabase';
import { Homework } from '../types';

export async function getStudentHomework(studentClass: string, studentSection?: string): Promise<Homework[]> {
  let query = supabase
    .from('homeworks')
    .select('*')
    .eq('class', studentClass);

  if (studentSection) {
    query = query.eq('section', studentSection);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching homework:', error);
    return [];
  }

  return data || [];
}

export async function getHomeworkSubmissions(studentId: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('homework_submissions')
    .select('*')
    .eq('student_id', studentId);

  if (error) {
    console.error('Error fetching homework submissions:', error);
    return {};
  }

  const submissionsMap: Record<string, string> = {};
  if (data) {
    data.forEach(sub => {
      submissionsMap[sub.homework_id] = sub.submitted_date || new Date().toISOString();
    });
  }
  return submissionsMap;
}
