import { supabase } from './supabase';
import { Worksheet } from '../types';

export const getStudentWorksheets = async (
  schoolId: string,
  className: string,
  section?: string
) => {
  let query = supabase
    .from('worksheets')
    .select('*')
    .eq('school_id', schoolId)
    .eq('class', className);

  if (section) {
    query = query.or(`section.eq.${section},section.is.null`);
  } else {
    query = query.is('section', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching worksheets:', error.message);
    throw error;
  }

  return data as Worksheet[];
};
