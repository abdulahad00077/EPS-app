import { supabase } from './supabase';
import { Exam, ExamResult } from '../types';

export async function getStudentExams(schoolId: string): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('school_id', schoolId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching exams:', error);
    return [];
  }

  return data || [];
}

export async function getStudentResults(studentId: string): Promise<ExamResult[]> {
  const { data, error } = await supabase
    .from('exam_results')
    .select('*, exams(*)')
    .eq('student_id', studentId);

  if (error) {
    console.error('Error fetching exam results:', error);
    return [];
  }

  return data || [];
}
