import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useStudent } from '../hooks/useStudent';
import { useTheme } from '../contexts/ThemeContext';

export function SchoolAccessBlocker() {
  const { userRole, driver, signOut } = useAuth();
  const { selectedStudent } = useStudent();
  const { isDark } = useTheme();
  const [status, setStatus] = useState<string | null>('active');
  const [reason, setReason] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  const schoolId = userRole === 'driver' ? driver?.school_id : selectedStudent?.school_id;

  const cardColor = isDark ? '#0F172A' : '#FFFFFF';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const primaryColor = '#0284C7';

  useEffect(() => {
    if (!schoolId) return;

    // Fetch initial status
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('schools')
        .select('status, suspension_reason, payment_reason, payment_due_amount')
        .eq('id', schoolId)
        .single();
      
      if (data) {
        setStatus(data.status);
        setReason(data.status === 'suspended' ? data.suspension_reason : data.payment_reason);
        setAmount(data.payment_due_amount || 0);
      }
    };
    
    fetchStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`school-status-${schoolId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'schools', filter: `id=eq.${schoolId}` },
        (payload) => {
          setStatus(payload.new.status);
          setReason(payload.new.status === 'suspended' ? payload.new.suspension_reason : payload.new.payment_reason);
          setAmount(payload.new.payment_due_amount || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId]);

  if (status === 'active' || !status) return null;

  return (
    <Modal visible={true} transparent={false} animationType="fade">
      <View style={[styles.container, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.title, { color: status === 'suspended' ? '#EF4444' : '#F59E0B' }]}>
            {status === 'suspended' ? 'Portal Suspended' : 'Payment Required'}
          </Text>
          
          <Text style={[styles.description, { color: textColor }]}>
            {status === 'suspended' 
              ? "Your school's Mera Elegant portal has been suspended by the administrator. Normal access is disabled."
              : (amount > 0 
                  ? "Your school's Mera Elegant portal is temporarily unavailable because a payment is pending."
                  : "Your subscription has been expired , Pay to DevforDevs to continue"
                )}
          </Text>

          {reason ? (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Reason:</Text>
              <Text style={[styles.reasonText, { color: textColor }]}>{reason}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: primaryColor }]} 
            onPress={() => signOut()}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  reasonBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
