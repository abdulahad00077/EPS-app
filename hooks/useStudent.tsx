import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getChildStudents } from '../services/students';
import { Student } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StudentContextType = {
  students: Student[];
  selectedStudent: Student | null;
  selectStudent: (student: Student) => void;
  loading: boolean;
  refreshStudents: () => Promise<void>;
};

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async (phone: string) => {
    setLoading(true);
    try {
      const data = await getChildStudents(phone);
      setStudents(data);
      
      // Try to recover last selected student from storage
      const lastSelectedId = await AsyncStorage.getItem('selected_student_id');
      if (lastSelectedId) {
        const found = data.find(s => s.id === lastSelectedId);
        if (found) {
          setSelectedStudent(found);
        } else if (data.length > 0) {
          setSelectedStudent(data[0]);
        }
      } else if (data.length > 0) {
        setSelectedStudent(data[0]);
      } else {
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Error in fetchStudents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStudents = useCallback(async () => {
    if (user?.phone) {
      await fetchStudents(user.phone);
    }
  }, [user, fetchStudents]);

  useEffect(() => {
    if (user?.phone) {
      fetchStudents(user.phone);
    } else {
      setStudents([]);
      setSelectedStudent(null);
      setLoading(false);
    }
  }, [user, fetchStudents]);

  const selectStudent = async (student: Student) => {
    setSelectedStudent(student);
    await AsyncStorage.setItem('selected_student_id', student.id);
  };

  return (
    <StudentContext.Provider value={{ students, selectedStudent, selectStudent, loading, refreshStudents }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
