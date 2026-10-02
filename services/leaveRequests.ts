import { supabase } from './supabase';

export interface LeaveRequest {
  id: string;
  student_id: string;
  school_id: string;
  reason: string;
  duration_type: '1' | '2_or_more';
  start_date: string;
  end_date: string | null;
  status: 'pending' | 'approved' | 'disapproved';
  created_at: string;
}

export const getStudentLeaveRequests = async (studentId: string): Promise<LeaveRequest[]> => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leave requests:', error);
    return [];
  }

  return data as LeaveRequest[];
};

export const submitLeaveRequest = async (
  studentId: string,
  schoolId: string,
  reason: string,
  durationType: '1' | '2_or_more',
  startDate: string,
  endDate: string | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error: insertError } = await supabase
      .from('leave_requests')
      .insert({
        student_id: studentId,
        school_id: schoolId,
        reason,
        duration_type: durationType,
        start_date: startDate,
        end_date: endDate,
        status: 'pending'
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
};

export const getTeacherLeaveRequests = async (schoolId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      student:students(name, class, section, roll_number)
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching teacher leave requests:', error);
    return [];
  }

  return data as any[];
};

export const updateLeaveRequestStatus = async (
  requestId: string,
  status: 'approved' | 'disapproved'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error: updateError } = await supabase
      .from('leave_requests')
      .update({ status })
      .eq('id', requestId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
};
