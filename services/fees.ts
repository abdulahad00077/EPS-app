export interface FeePayment {
  id: string;
  fee_id: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  transaction_id?: string;
  receipt_number?: string;
  remarks?: string;
  created_at: string;
}

export interface FeeRecord {
  id: string;
  student_id: string;
  school_id: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial' | 'PAID' | 'PENDING' | 'PARTIAL' | 'CANCELLED';
  month?: string;
  months?: string[];
  payment_date?: string;
  receipt_url?: string;
  pdf_url?: string;
  created_at: string;
  paid_amount?: number;
  description?: string;
  fee_type?: string;
  fee_payments?: FeePayment[];
  // ERP fields
  due_month?: string;
  academic_year?: string;
  net_payable?: number;
  adjustment_amount?: number;
  fee_head_name?: string;
}

import { supabase } from './supabase';

export async function getStudentFees(studentId: string): Promise<FeeRecord[]> {
  // Fetch from BOTH old `fees` table and new `erp_fee_dues` table,
  // then merge results so parents see all their fees regardless of which system created them.

  const results: FeeRecord[] = [];

  // 1. Fetch from old "fees" table (legacy)
  try {
    const { data: oldFees, error: oldError } = await supabase
      .from('fees')
      .select('*, fee_payments(*)')
      .eq('student_id', studentId)
      .order('due_date', { ascending: false });

    if (!oldError && oldFees) {
      results.push(...oldFees);
    }
  } catch (e) {
    // Old table might not exist, that's OK
    console.log('Old fees table not available:', e);
  }

  // 2. Fetch from new "erp_fee_dues" table (ERP system)
  try {
    const { data: erpDues, error: erpError } = await supabase
      .from('erp_fee_dues')
      .select(`
        *,
        erp_fee_heads (name, description)
      `)
      .eq('student_id', studentId)
      .order('due_date', { ascending: false });

    if (!erpError && erpDues && erpDues.length > 0) {
      // For ERP dues, also fetch any payments made against them
      const dueIds = erpDues.map(d => d.id);
      
      let paymentAllocations: any[] = [];
      try {
        const { data: allocations } = await supabase
          .from('erp_fee_payment_allocations')
          .select(`
            allocated_amount,
            fee_due_id,
            erp_fee_payments (
              id, amount, payment_date, payment_mode, transaction_id, remarks, created_at,
              erp_fee_receipts (receipt_number, pdf_url)
            )
          `)
          .in('fee_due_id', dueIds);
        
        if (allocations) paymentAllocations = allocations;
      } catch (e) {
        console.log('Could not fetch payment allocations:', e);
      }

      // Transform ERP dues into the FeeRecord format the screen expects
      for (const due of erpDues) {
        const dueAllocations = paymentAllocations.filter(a => a.fee_due_id === due.id);
        
        // Build fee_payments array from allocations
        const feePayments: FeePayment[] = dueAllocations.map(alloc => {
          const p = alloc.erp_fee_payments;
          const receiptNum = p?.erp_fee_receipts?.[0]?.receipt_number || p?.erp_fee_receipts?.receipt_number;
          return {
            id: p?.id || alloc.id || due.id,
            fee_id: due.id,
            amount: Number(alloc.allocated_amount),
            payment_date: p?.payment_date || due.created_at,
            payment_mode: p?.payment_mode || 'Cash',
            transaction_id: p?.transaction_id || undefined,
            receipt_number: receiptNum || undefined,
            remarks: p?.remarks || undefined,
            created_at: p?.created_at || due.created_at,
          };
        });

        const headName = due.erp_fee_heads?.name || 'Fee';
        
        // Map ERP status to old-style status for the UI
        let displayStatus: FeeRecord['status'] = due.status;

        results.push({
          id: due.id,
          student_id: due.student_id,
          school_id: due.school_id,
          amount: Number(due.net_payable || due.amount),
          due_date: due.due_date,
          status: displayStatus,
          month: due.due_month || undefined,
          months: due.due_month ? [due.due_month] : undefined,
          payment_date: feePayments.length > 0 ? feePayments[0].payment_date : undefined,
          created_at: due.created_at,
          paid_amount: Number(due.paid_amount || 0),
          description: `${headName} - ${due.due_month || ''} ${due.academic_year || ''}`.trim(),
          fee_type: headName,
          fee_payments: feePayments,
          // ERP-specific fields
          due_month: due.due_month,
          academic_year: due.academic_year,
          net_payable: Number(due.net_payable),
          adjustment_amount: Number(due.adjustment_amount || 0),
          fee_head_name: headName,
        });
      }
    }
  } catch (e) {
    // ERP tables might not exist yet, that's OK
    console.log('ERP fee dues table not available:', e);
  }

  return results;
}

export interface SchoolDetails {
  id?: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  affiliation_number?: string;
  school_code?: string;
}

export async function getSchoolDetails(schoolId: string): Promise<SchoolDetails | null> {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('name, address, email, phone')
      .eq('id', schoolId)
      .single();
      
    if (error) {
      console.error('Error fetching school details:', error);
      return null;
    }
    
    return data as SchoolDetails;
  } catch (error) {
    console.error('getSchoolDetails error:', error);
    return null;
  }
}
