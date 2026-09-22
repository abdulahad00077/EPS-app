import { supabase } from './supabase';

export interface SyllabusItem {
  id: string;
  created_at: string;
  school_id: string;
  class: string;
  subject: string;
  chapter_name: string;
  description: string;
  attachment_url?: string;
}

export async function getSyllabusByClass(schoolId: string, className: string): Promise<SyllabusItem[]> {
  try {
    const { data, error } = await supabase
      .from('syllabus')
      .select('*')
      .eq('school_id', schoolId)
      .eq('class', className)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching syllabus:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getSyllabusByClass error:', error);
    return [];
  }
}
