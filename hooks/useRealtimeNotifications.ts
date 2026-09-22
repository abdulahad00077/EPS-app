import { useEffect } from 'react';
import Notifications from '../utils/NotificationsWrapper';
import { supabase } from '../services/supabase';
import { useStudent } from './useStudent';
import { Platform } from 'react-native';

export const useRealtimeNotifications = () => {
  const { students } = useStudent();

  useEffect(() => {
    if (!students || students.length === 0) return;

    const schoolIds = Array.from(new Set(students.map(s => s.school_id)));
    const studentIds = students.map(s => s.id);
    const classes = Array.from(new Set(students.map(s => s.class)));

    // Request permissions again just in case
    const requestPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    };
    
    if (Platform.OS !== 'web') {
      requestPermissions();
    }

    // Subscribe to new homeworks for the students' classes
    const homeworkChannel = supabase
      .channel('public:homeworks-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'homeworks' },
        (payload: any) => {
          const newHomework = payload.new;
          // Check if this homework belongs to any of our students' classes
          const relevantStudent = students.find(s => 
            s.school_id === newHomework.school_id && 
            s.class === newHomework.class &&
            (!newHomework.section || s.section === newHomework.section)
          );

          if (relevantStudent) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: '📚 New Homework Assigned',
                body: `${relevantStudent.name} has new homework: ${newHomework.title}.`,
                data: { type: 'homework', id: newHomework.id, studentId: relevantStudent.id },
                sound: 'default',
                ...(Platform.OS === 'android' ? { channelId: 'homework' } : {}),
              },
              trigger: null, // show immediately
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new messages addressed to the student
    const messagesChannel = supabase
      .channel('public:parent_messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'parent_messages' },
        (payload: any) => {
          const newMessage = payload.new;
          
          // Only show if the message is from a teacher to the parent/student
          if (newMessage.sender_type === 'teacher' && studentIds.includes(newMessage.student_id)) {
            const relevantStudent = students.find(s => s.id === newMessage.student_id);
            
            Notifications.scheduleNotificationAsync({
              content: {
                title: '💬 New Message from Teacher',
                body: `You received a message regarding ${relevantStudent?.name || 'your child'}.`,
                data: { type: 'message', id: newMessage.id, studentId: newMessage.student_id },
                sound: 'default',
                ...(Platform.OS === 'android' ? { channelId: 'messages' } : {}),
              },
              trigger: null,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to attendance updates
    const attendanceChannel = supabase
      .channel('public:attendance-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_records' },
        (payload: any) => {
          const record = payload.new;
          
          if (studentIds.includes(record.student_id)) {
            const relevantStudent = students.find(s => s.id === record.student_id);
            const status = record.status === 'present' ? 'Present ✅' : 'Absent ❌';
            const isVerification = record.attendance_type === 'verification';
            
            const title = isVerification ? '📋 Evening Attendance' : '📋 Morning Attendance';
            const body = isVerification 
              ? `${relevantStudent?.name || 'Your child'}'s evening attendance is marked.`
              : `${relevantStudent?.name || 'Your child'} was marked ${status} this morning.`;
            
            Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: { type: 'attendance', studentId: record.student_id },
                sound: 'default',
                ...(Platform.OS === 'android' ? { channelId: 'attendance' } : {}),
              },
              trigger: null,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to fee updates
    const feesChannel = supabase
      .channel('public:fees-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fees' },
        (payload: any) => {
          const record = payload.new;
          
          if (studentIds.includes(record.student_id)) {
            const relevantStudent = students.find(s => s.id === record.student_id);
            const feeStatus = record.status === 'paid' ? 'paid ✅' : 'due';
            
            Notifications.scheduleNotificationAsync({
              content: {
                title: '💰 Fee Update',
                body: `Fee of ₹${record.amount} for ${record.month || 'this month'} is ${feeStatus} for ${relevantStudent?.name || 'your child'}.`,
                data: { type: 'fees', id: record.id, studentId: record.student_id },
                sound: 'default',
                ...(Platform.OS === 'android' ? { channelId: 'fees' } : {}),
              },
              trigger: null,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'fees' },
        (payload: any) => {
          const record = payload.new;
          const oldRecord = payload.old;
          
          // Only notify if status changed (e.g., from unpaid to paid)
          if (studentIds.includes(record.student_id) && record.status !== oldRecord.status) {
            const relevantStudent = students.find(s => s.id === record.student_id);
            const feeStatus = record.status === 'paid' ? 'paid ✅' : (record.status === 'overdue' ? 'overdue ⚠️' : 'updated');
            
            Notifications.scheduleNotificationAsync({
              content: {
                title: '💰 Fee Status Updated',
                body: `Fee of ₹${record.amount} for ${record.month || 'this month'} is now ${feeStatus} for ${relevantStudent?.name || 'your child'}.`,
                data: { type: 'fees', id: record.id, studentId: record.student_id },
                sound: 'default',
                ...(Platform.OS === 'android' ? { channelId: 'fees' } : {}),
              },
              trigger: null,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to exam results / marks
    const marksChannel = supabase
      .channel('public:exam_results-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'exam_results' },
        (payload: any) => {
          const record = payload.new;
          
          if (studentIds.includes(record.student_id)) {
            const relevantStudent = students.find(s => s.id === record.student_id);
            
            Notifications.scheduleNotificationAsync({
              content: {
                title: '📝 New Results Published',
                body: `${relevantStudent?.name || 'Your child'}'s exam results are out! Score: ${record.score}/${record.total_marks}`,
                data: { type: 'marks', id: record.id, studentId: record.student_id },
                sound: 'default',
                ...(Platform.OS === 'android' ? { channelId: 'marks' } : {}),
              },
              trigger: null,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new exams scheduled
    const examsChannel = supabase
      .channel('public:exams-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'exams' },
        (payload: any) => {
          const record = payload.new;
          
          // Check if exam belongs to any of the students' schools
          if (schoolIds.includes(record.school_id)) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: '📅 New Exam Scheduled',
                body: `New exam: ${record.name || 'Exam'} scheduled for ${record.date ? new Date(record.date).toLocaleDateString() : 'upcoming'}.`,
                data: { type: 'exams', id: record.id },
                sound: 'default',
                ...(Platform.OS === 'android' ? { channelId: 'exams' } : {}),
              },
              trigger: null,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(homeworkChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(feesChannel);
      supabase.removeChannel(marksChannel);
      supabase.removeChannel(examsChannel);
    };
  }, [students]);
};
