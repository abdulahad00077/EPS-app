import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface TeacherFilterContextType {
  selectedClass: string | null;
  setSelectedClass: (cls: string | null) => void;
  selectedSection: string | null;
  setSelectedSection: (sec: string | null) => void;
}

const TeacherFilterContext = createContext<TeacherFilterContextType | undefined>(undefined);

export function TeacherFilterProvider({ children }: { children: ReactNode }) {
  const { teacher } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    if (teacher?.assigned_class && !selectedClass) {
      setSelectedClass(teacher.assigned_class);
    }
  }, [teacher]);

  return (
    <TeacherFilterContext.Provider
      value={{
        selectedClass,
        setSelectedClass,
        selectedSection,
        setSelectedSection,
      }}
    >
      {children}
    </TeacherFilterContext.Provider>
  );
}

export function useTeacherFilter() {
  const context = useContext(TeacherFilterContext);
  if (context === undefined) {
    throw new Error('useTeacherFilter must be used within a TeacherFilterProvider');
  }
  return context;
}
