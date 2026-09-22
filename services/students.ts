import { supabase } from './supabase';
import { Student } from '../types';

export async function getChildStudents(parentPhone: string): Promise<Student[]> {
  // Clean phone number to get only digits
  const digits = parentPhone.replace(/\D/g, '');
  
  // Create variations of the phone number
  const variations = [
    digits, // 8826324063
    `+91${digits}`, // +918826324063
    digits.startsWith('91') ? digits.substring(2) : digits, // 8826324063 (if it had 91)
    `0${digits}`, // 08826324063
  ];

  // Remove duplicates
  const uniqueVariations = Array.from(new Set(variations));
  
  // Construct OR filter
  const orFilter = uniqueVariations.map(v => `parent_phone.eq.${v}`).join(',');

  console.log('--- LOGIN ATTEMPT ---');
  console.log('Digits only:', digits);
  console.log('OR Filter:', orFilter);

  const { data, error } = await supabase
    .from('students')
    .select('*, schools(name)')
    .or(orFilter);

  if (error) {
    console.error('Error fetching child students:', error);
    return [];
  }

  console.log('Student data found:', data?.length || 0);

  return data || [];
}

export async function getStudentDetails(studentId: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*, schools(name)')
    .eq('id', studentId)
    .single();

  if (error) {
    console.error('Error fetching student details:', error);
    return null;
  }

  return data;
}
