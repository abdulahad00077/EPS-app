import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Easing, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Student, TransportException } from '../types';
import { transliterateToHindi } from '../services/transliteration';

type Props = {
  student: Student;
  onPickupConfirmed: (student: Student) => void;
  onDropConfirmed: (student: Student) => void;
  initialPickupState?: boolean;
  initialDropState?: boolean;
  exceptionData?: TransportException | null;
  shift?: 'morning' | 'evening';
};

const StudentTransportCard = ({ student, onPickupConfirmed, onDropConfirmed, initialPickupState = false, initialDropState = false, exceptionData, shift }: Props) => {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const [pickupChecked, setPickupChecked] = useState(initialPickupState);
  const [dropChecked, setDropChecked] = useState(initialDropState);
  const [timerActive, setTimerActive] = useState<'pickup' | 'drop' | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [displayName, setDisplayName] = useState(student.name);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const bgColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (language === 'hi') {
      transliterateToHindi(student.name).then(setDisplayName);
    } else {
      setDisplayName(student.name);
    }
  }, [student.name, language]);

  useEffect(() => {
    setPickupChecked(initialPickupState);
  }, [initialPickupState]);

  useEffect(() => {
    setDropChecked(initialDropState);
  }, [initialDropState]);

  const startTimer = (type: 'pickup' | 'drop') => {
    setTimerActive(type);
    setTimeLeft(10);
    progressAnim.setValue(0);
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 10000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    let time = 10;
    timerRef.current = setInterval(() => {
      time -= 1;
      setTimeLeft(time);
      if (time <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setTimerActive(null);
        if (type === 'pickup') onPickupConfirmed(student);
        else onDropConfirmed(student);
      }
    }, 1000);
  };

  const handleTogglePickup = () => {
    if (initialPickupState || pickupChecked) {
      if (timerActive === 'pickup') {
        // Undo
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setTimerActive(null);
        setPickupChecked(false);
        progressAnim.stopAnimation();
      }
      return; // Already confirmed or undoing
    }
    
    setPickupChecked(true);
    startTimer('pickup');
  };

  const handleToggleDrop = () => {
    // Cannot drop if not picked up
    if (!pickupChecked && !initialPickupState) return;

    if (initialDropState || dropChecked) {
      if (timerActive === 'drop') {
        // Undo
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setTimerActive(null);
        setDropChecked(false);
        progressAnim.stopAnimation();
      }
      return;
    }

    setDropChecked(true);
    startTimer('drop');
  };

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {student.photo_url ? (
            <Text style={{ fontSize: 20 }}>🧑‍🎓</Text>
          ) : (
            <Feather name="user" size={24} color="#0284C7" />
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: textColor }]}>{displayName || student.name}</Text>
          <Text style={[styles.class, { color: subtextColor }]}>
            {t('class', 'Class')} {student.class} {student.section ? `- ${student.section}` : ''}
          </Text>
        </View>
        {student.parent_phone && (
          <TouchableOpacity 
            style={styles.callButton}
            onPress={() => Linking.openURL(`tel:${student.parent_phone}`)}
          >
            <Feather name="phone-call" size={20} color="#0284C7" />
          </TouchableOpacity>
        )}
      </View>

      {exceptionData?.exception_type === 'absent' || (exceptionData?.exception_type === 'parent_drop' && shift === 'morning') ? (
        <View style={{ backgroundColor: '#EF444420', padding: 8, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}>
          <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>
            {exceptionData.exception_type === 'absent' ? 'On leave today' : 'Parent will drop today'}
          </Text>
        </View>
      ) : null}

      {timerActive && (
        <View style={styles.timerContainer}>
          <View style={styles.timerHeader}>
            <Text style={styles.timerText}>
              {timerActive === 'pickup' ? t('confirmingPickup', 'Confirming pickup') : t('confirmingDrop', 'Confirming drop')} {t('in', 'in')} {timeLeft}s...
            </Text>
            <TouchableOpacity onPress={timerActive === 'pickup' ? handleTogglePickup : handleToggleDrop}>
              <Text style={styles.undoText}>{t('undo', 'Undo')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressBarBg}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: timerActive === 'pickup' ? '#0284C7' : '#10B981'
                }
              ]} 
            />
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[
            styles.actionBtn, 
            { borderColor },
            (pickupChecked || initialPickupState) && !timerActive && styles.actionBtnActivePickup
          ]}
          onPress={handleTogglePickup}
          disabled={
            (initialPickupState && timerActive !== 'pickup') || 
            (pickupChecked && timerActive !== 'pickup') ||
            (exceptionData?.exception_type === 'absent') ||
            (exceptionData?.exception_type === 'parent_drop' && shift === 'morning')
          }
        >
          <View style={[styles.checkbox, (pickupChecked || initialPickupState) && styles.checkboxActivePickup]}>
            {(pickupChecked || initialPickupState) && <Feather name="check" size={14} color="#FFF" />}
          </View>
          <Text style={[styles.actionText, { color: (pickupChecked || initialPickupState) && !timerActive ? '#FFF' : textColor }]}>
            {t('pickup', 'Pickup')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.actionBtn, 
            { borderColor },
            (!pickupChecked && !initialPickupState) && { opacity: 0.5 },
            (dropChecked || initialDropState) && !timerActive && styles.actionBtnActiveDrop
          ]}
          onPress={handleToggleDrop}
          disabled={
            (!pickupChecked && !initialPickupState) || 
            (initialDropState && timerActive !== 'drop') || 
            (dropChecked && timerActive !== 'drop') ||
            (exceptionData?.exception_type === 'absent') ||
            (exceptionData?.exception_type === 'parent_drop' && shift === 'morning')
          }
        >
          <View style={[styles.checkbox, (dropChecked || initialDropState) && styles.checkboxActiveDrop]}>
            {(dropChecked || initialDropState) && <Feather name="check" size={14} color="#FFF" />}
          </View>
          <Text style={[styles.actionText, { color: (dropChecked || initialDropState) && !timerActive ? '#FFF' : textColor }]}>
            {t('drop', 'Drop')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  class: {
    fontSize: 13,
    marginTop: 2,
  },
  callButton: {
    padding: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 24,
    marginLeft: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  actionBtnActivePickup: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  actionBtnActiveDrop: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActivePickup: {
    backgroundColor: '#0369A1',
    borderColor: '#0369A1',
  },
  checkboxActiveDrop: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timerContainer: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timerText: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: 13,
  },
  undoText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default StudentTransportCard;
