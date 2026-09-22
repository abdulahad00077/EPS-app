import { supabase } from './supabase';
import { TimetableEntry } from '../types';

export async function getStudentTimetable(schoolId: string, className: string, section?: string): Promise<TimetableEntry[]> {
  let query = supabase
    .from('timetable')
    .select('*, teachers(name)')
    .eq('school_id', schoolId)
    .eq('class', className);

  if (section) {
    query = query.eq('section', section);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching timetable:', error);
    return [];
  }

  return data || [];
}
