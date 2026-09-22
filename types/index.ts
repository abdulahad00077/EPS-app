export interface Student {
  id: string;
  school_id: string;
  name: string;
  roll_id: string;
  class: string;
  section?: string;
  photo_url?: string;
  father_name?: string;
  mother_name?: string;
  parent_phone?: string;
  parent_id?: string;
  date_of_birth?: string;
  created_at: string;
  session?: string;
  admission_number?: string;
  roll_number?: string;
  
  // New fields from ERP
  student_aadhaar?: string;
  parent_aadhaar?: string;
  parent_pan?: string;
  apaar_abc_id?: string;
  father_occupation?: string;
  mother_occupation?: string;
  father_qualification?: string;
  mother_qualification?: string;
  blood_group?: string;
  address?: string;
  secondary_address?: string;
  schools?: { name: string };
  show_report_card?: boolean;
  father_photo_url?: string;
  mother_photo_url?: string;
  mother_aadhaar_doc_url?: string;
  father_aadhaar_doc_url?: string;
  student_aadhaar_doc_url?: string;
  tc_doc_url?: string;
  marksheet_doc_url?: string;
  birth_certificate_doc_url?: string;
}



export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent';
  remarks?: string;
  roll_id?: string;
  student_name?: string;
}

export interface Homework {
  id: string;
  class: string;
  section?: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  status: 'submitted' | 'pending' | 'late';
  created_at: string;
}

export interface Exam {
  id: string;
  school_id: string;
  name: string;
  date: string;
  subject?: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  total_marks: number;
  exams?: Exam;
}

export interface Message {
  id: string;
  school_id: string;
  sender_id: string;
  recipient_id: string;
  recipient_type: string;
  message_text: string;
  created_at: string;
}

export interface ParentMessage {
  id: string;
  school_id: string;
  student_id: string;
  teacher_id: string;
  message: string;
  sender_type: 'parent' | 'teacher';
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  school_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: string;
  class: string;
  section?: string;
  teachers?: { name: string };
}

export type NotificationType = 'homework' | 'attendance' | 'message' | 'fees' | 'marks' | 'exams';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface Grievance {
  id: string;
  student_id: string;
  school_id: string;
  message: string;
  created_at: string;
  status?: string;
}

export interface ReportCard {
  id: string;
  student_id: string;
  school_id: string;
  term?: string;
  year?: string;
  total_marks?: number;
  obtained_marks?: number;
  grade?: string;
  remarks?: string;
  created_at: string;
}

export interface Driver {
  id: string;
  school_id: string;
  name: string;
  phone: string;
  password?: string;
  is_first_login?: boolean;
  vehicle_number?: string;
  vehicle_name?: string;
  route_name?: string;
  route_id?: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  is_first_login?: boolean;
  role?: string;
  created_at?: string;
  assigned_class?: string;
  assigned_section?: string;
  username?: string;
  photo_url?: string;
  teacher_id?: string;
  age?: number | string;
  gender?: string;
  blood_group?: string;
  aadhaar_number?: string;
  address?: string;
  joining_date?: string;
  qualifications?: string;
  specialization_subject?: string;
  subject?: string;
  classes_taught?: string | string[];
}

export interface TransportLog {
  id: string;
  student_id: string;
  driver_id: string;
  school_id: string;
  type: 'pickup' | 'drop';
  status: 'waiting' | 'picked_up' | 'reached_school' | 'dropped';
  timestamp: string;
  created_at?: string;
}

export interface TransportException {
  id: string;
  student_id: string;
  school_id: string;
  date: string;
  exception_type: 'absent' | 'parent_drop';
  reason?: string;
  created_at?: string;
}
