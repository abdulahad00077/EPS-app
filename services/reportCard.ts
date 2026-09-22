import { supabase } from './supabase';
import { ReportCard, ExamResult } from '../types';

export const getStudentReportCards = async (studentId: string): Promise<ReportCard[]> => {
  const { data, error } = await supabase
    .from('exam_results')
    .select(`
      *,
      exams:exam_id (
        id,
        name,
        date,
        max_marks,
        subject,
        type
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching report cards:', error);
    return [];
  }

  // Map the exam_results to the existing ReportCard interface for backward compatibility
  // Or create new objects mapping from exam + result to ReportCard format
  const formattedData: ReportCard[] = (data as any[]).map((result) => {
    const exam = result.exams;
    const percentage = result.total_marks > 0 ? (result.score / result.total_marks) * 100 : 0;
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    return {
      id: result.id,
      student_id: result.student_id,
      school_id: exam?.school_id || '',
      term: exam?.name || 'Term Exam',
      year: exam?.date ? new Date(exam.date).getFullYear().toString() : new Date().getFullYear().toString(),
      total_marks: result.total_marks,
      obtained_marks: result.score,
      grade: grade,
      remarks: result.remarks || exam?.subject || '',
      created_at: result.created_at
    };
  });

  return formattedData;
};
