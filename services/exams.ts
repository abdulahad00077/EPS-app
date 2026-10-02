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

export async function getSchoolSettings(schoolId: string): Promise<any> {
  if (!schoolId) return null;

  const { data, error } = await supabase
    .from('school_settings')
    .select('affiliation_number, school_board, school_code, principal_name')
    .eq('school_id', schoolId)
    .single();

  if (error) {
    console.error('Error fetching school settings:', error);
    return null;
  }

  return data;
}

export async function getApprovedAdmitCards(student: any): Promise<any[]> {
  if (!student || !student.class || !student.school_id) return [];

  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('school_id', student.school_id)
    .eq('class', student.class)
    .not('date', 'is', null);

  if (error) {
    console.error('Error fetching exams for admit cards:', error);
    return [];
  }

  // Group exams by series name
  const grouped = new Map<string, any[]>();
  (data || []).forEach(exam => {
    if (exam.type === 'completed') return; // Don't show admit cards for completed exams
    if (!grouped.has(exam.name)) {
      grouped.set(exam.name, []);
    }
    grouped.get(exam.name)?.push(exam);
  });

  // Return a list of "admit card" objects
  return Array.from(grouped.entries()).map(([seriesName, exams]) => {
    return {
      seriesName,
      exams: exams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };
  });
}
