import { supabase } from './supabase';
import { AttendanceRecord } from '../types';

export async function getStudentAttendance(studentId: string, month?: number, year?: number): Promise<AttendanceRecord[]> {
  let query = supabase
    .from('attendance_records')
    .select('*')
    .eq('student_id', studentId);

  if (month && year) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    query = query.gte('date', startDate).lte('date', endDate);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }

  if (data && data.length > 0) {
    console.log('Attendance keys:', Object.keys(data[0]));
  }

  return data || [];
}
