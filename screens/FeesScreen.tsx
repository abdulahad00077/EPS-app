import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  StatusBar, 
  StyleSheet, 
  Platform, 
  Dimensions,
  Modal
} from 'react-native';
import { useStudent } from '../hooks/useStudent';
import { getStudentFees, FeeRecord, getSchoolDetails } from '../services/fees';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as Print from 'expo-print';
import { Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransliteration } from '../hooks/useTransliteration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FeesScreen = () => {
  const navigation = useNavigation();
  const { selectedStudent } = useStudent();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{payment: any, fee: FeeRecord} | null>(null);
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const transSelectedName = useTransliteration(selectedStudent?.name);
  const transFatherName = useTransliteration(selectedStudent?.father_name);

  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const headerBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#F1F5F9';

  useEffect(() => {
    if (selectedStudent) {
      setLoading(true);
      getStudentFees(selectedStudent.id).then(data => {
        setFees(data);
        setLoading(false);
      });
    }
  }, [selectedStudent]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={[styles.loadingText, { color: subtextColor }]}>{t('loading')}</Text>
      </View>
    );
  }
  const generatePDF = async (paymentItem: {payment: any, fee: FeeRecord}) => {
    try {
      const { payment, fee } = paymentItem;
      if (!selectedStudent) return;
      const schoolDetails = await getSchoolDetails(selectedStudent.school_id);
      
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #E2E8F0; padding-bottom: 20px; }
              .school-name { font-size: 28px; font-weight: normal; color: #0284C7; margin: 0; margin-bottom: 8px;}
              .school-details { font-size: 14px; color: #64748B; margin: 0; }
              .title-container { text-align: center; margin-top: 30px; margin-bottom: 30px; }
              .title { font-size: 20px; font-weight: normal; color: #000; text-transform: uppercase; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .info-item { display: flex; font-size: 14px; }
              .info-label { width: 120px; }
              .info-value { font-weight: normal; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { background-color: #3b82f6; color: white; padding: 10px; text-align: left; font-size: 14px; font-weight: normal;}
              td { padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #333; }
              .remarks { font-size: 14px; color: #333; margin-top: 20px; margin-bottom: 60px; }
              .signature { text-align: right; font-size: 14px; color: #000; border-top: 1px solid #ccc; width: 200px; padding-top: 5px; float: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="school-name">${schoolDetails?.name || 'School Name'}</h1>
              <p class="school-details">
                ${schoolDetails?.address ? `${schoolDetails.address}<br/>` : ''}
                ${schoolDetails?.phone ? `Ph: ${schoolDetails.phone} | ` : ''}
                ${schoolDetails?.email ? `Email: ${schoolDetails.email}<br/>` : ''}
                ${schoolDetails?.affiliation_number ? `Affiliation No: ${schoolDetails.affiliation_number} | ` : ''} 
                ${schoolDetails?.school_code ? `School Code: ${schoolDetails.school_code}` : ''}
              </p>
            </div>
            
            <div class="title-container">
              <span class="title">FEE RECEIPT</span>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Receipt No:</span>
                <span class="info-value">${(payment?.id || fee.id).substring(0, 8)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date:</span>
                <span class="info-value">${payment?.payment_date ? new Date(payment.payment_date).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Student Name:</span>
                <span class="info-value">${selectedStudent?.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Session:</span>
                <span class="info-value">${selectedStudent?.session || '2026-2027'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Class:</span>
                <span class="info-value">${selectedStudent?.class}${selectedStudent?.section ? ` - ${selectedStudent?.section}` : ''}</span>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Fee Description</th>
                  <th>Payment Mode</th>
                  <th>Transaction ID</th>
                  <th>Amount Paid (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${fee.description || fee.fee_head_name || fee.fee_type || fee.month || (fee.months ? fee.months.join(', ') : 'Annual fees')}</td>
                  <td>${payment?.payment_mode || 'Cash'}</td>
                  <td>${payment?.transaction_id || '-'}</td>
                  <td>${(payment?.amount || fee.amount).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="remarks">
              Remarks: ${payment?.remarks || `Paid for: ${fee.month || (fee.months ? fee.months.join(', ') : 'Fees')}`}
            </div>
            
            <div style="clear: both; margin-top: 60px;">
              <div class="signature">Authorized Signatory</div>
            </div>
          </body>
        </html>
      `;
      
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Could not generate PDF');
    }
  };

  const handlePayFeesOnline = async () => {
    if (!selectedStudent?.admission_number) {
      Alert.alert('Error', 'Student admission number not found.');
      return;
    }
    
    setIsGeneratingLink(true);
    try {
      // Use local IP for dev testing (matching expo network) or switch to production url later
      const apiUrl = 'http://192.168.1.43:3000/api/public/generate-payment-link';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId: selectedStudent.admission_number })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.link) {
        throw new Error(data.error || 'Failed to generate payment link');
      }
      
      // Open the generated link
      await Linking.openURL(data.link);
      
    } catch (error: any) {
      console.error('Payment Link Error:', error);
      Alert.alert('Error', 'Could not open payment portal. Ensure backend is running.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.paid_amount || (f.status === 'paid' || f.status === 'PAID' ? f.amount : 0)), 0);
  const totalOutstanding = totalFees - totalPaid;

  const allPayments = fees.flatMap(fee => {
    if (fee.fee_payments && fee.fee_payments.length > 0) {
      return fee.fee_payments.map(p => ({ payment: p, fee }));
    } else if (fee.status === 'paid' || fee.status === 'PAID' || (fee.paid_amount && fee.paid_amount > 0)) {
      return [{
        payment: {
          id: fee.id,
          fee_id: fee.id,
          amount: fee.paid_amount || fee.amount,
          payment_date: fee.payment_date || fee.created_at,
          payment_mode: 'Cash',
          remarks: `Paid for: ${fee.month || (fee.months ? fee.months.join(', ') : 'Fees')}`,
          created_at: fee.created_at
        },
        fee
      }];
    }
    return [];
  }).sort((a: { payment: any, fee: FeeRecord }, b: { payment: any, fee: FeeRecord }) => new Date(b.payment.payment_date).getTime() - new Date(a.payment.payment_date).getTime());

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.headerWrapper, { backgroundColor: headerBg }]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#ffffff', '#F8FAFC']}
          style={[styles.headerGradient, { borderBottomColor: borderColor }]}
        >
          <View style={[styles.headerTop, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={{ padding: 8, marginRight: 12, borderRadius: 12, backgroundColor: 'rgba(148, 163, 184, 0.1)' }} 
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={24} color={textColor} />
              </TouchableOpacity>
              <View>
                <Text style={[styles.headerTitle, { color: textColor }]}>{t('fees')}</Text>
                <Text style={[styles.headerSubtitle, { color: subtextColor }]}>{t('feeOverview')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Feather name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Fee Details & Payment Section */}
        <View style={styles.feeDetailsContainer}>
          <Text style={[styles.sectionTitleMain, { color: textColor }]}>{t('feeDetailsPayment', 'Fee Details & Payment')}</Text>
          <Text style={[styles.sectionSubtitle, { color: subtextColor }]}>{t('viewFeeHistory', 'View fee history and record new payments.')}</Text>

          <View style={[styles.feeDetailsCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.feeDetailsRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feeLabel, { color: subtextColor }]}>{t('student', 'Student')}</Text>
                <Text style={[styles.feeValue, { color: textColor }]}>{transSelectedName}</Text>
                <Text style={[styles.feeSubValue, { color: subtextColor }]}>
                  {selectedStudent?.roll_number} • {t('class')} {selectedStudent?.class}{selectedStudent?.section ? ` ${selectedStudent.section}` : ''}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[styles.feeLabel, { color: subtextColor }]}>{t('feeItem', 'Fee Item')}</Text>
                <Text style={[styles.feeValue, { color: textColor }]}>{t('annualFees', 'Annual fees')}</Text>
                <Text style={[styles.feeMonths, { color: subtextColor, textAlign: 'right' }]} numberOfLines={3}>
                  {fees.length > 0 ? Array.from(new Set(fees.flatMap(f => f.months || (f.month ? [f.month] : [])))).join(', ') || t('fees') : t('noFees', 'No fees')}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor, marginVertical: 20 }]} />

            <View style={styles.feeTotalsRow}>
              <View style={styles.totalCol}>
                <Text style={[styles.feeLabel, { color: subtextColor }]}>{t('totalFee', 'Total Fee')}</Text>
                <Text style={[styles.feeTotalValue, { color: textColor }]}>₹ {totalFees.toLocaleString()}</Text>
              </View>
              <View style={styles.totalCol}>
                <Text style={[styles.feeLabel, { color: subtextColor }]}>{t('totalPaid', 'Total Paid')}</Text>
                <Text style={[styles.feeTotalValue, { color: '#16a34a' }]}>₹ {totalPaid.toLocaleString()}</Text>
              </View>
              <View style={styles.totalCol}>
                <Text style={[styles.feeLabel, { color: subtextColor }]}>{t('pendingDue', 'Pending Due')}</Text>
                <Text style={[styles.feeTotalValue, { color: textColor }]}>₹ {totalOutstanding.toLocaleString()}</Text>
              </View>
            </View>

            {totalOutstanding > 0 && (
              <TouchableOpacity 
                style={{ backgroundColor: '#0ea5e9', paddingVertical: 14, borderRadius: 12, marginTop: 24, alignItems: 'center', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, opacity: isGeneratingLink ? 0.7 : 1 }}
                onPress={handlePayFeesOnline}
                disabled={isGeneratingLink}
              >
                {isGeneratingLink ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Pay Fees Online</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment History Section */}
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
             <Feather name="clock" size={20} color={textColor} style={{ marginRight: 8 }} />
             <Text style={[styles.historyTitle, { color: textColor }]}>{t('paymentHistory', 'Payment History')}</Text>
          </View>
          
          {allPayments.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
              <Text style={[styles.emptyTitle, { color: textColor }]}>{t('noRecordsFound', 'No Records Found')}</Text>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              <View style={[styles.timelineLine, { backgroundColor: borderColor }]} />
              
              {allPayments.map((item, index) => {
                const { payment, fee } = item;
                const isLeft = index % 2 === 0;
                
                return (
                  <View key={payment.id} style={[styles.timelineItem, isLeft ? styles.timelineItemLeft : styles.timelineItemRight]}>
                     <View style={[styles.timelineIconContainer, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
                        <Text style={[styles.timelineIconText, { color: subtextColor }]}>₹</Text>
                     </View>
                     
                     <TouchableOpacity 
                       style={[styles.timelineCard, { backgroundColor: cardColor, borderColor }, isLeft ? styles.timelineCardLeft : styles.timelineCardRight]}
                       onPress={() => setSelectedReceipt(item)}
                       activeOpacity={0.7}
                     >
                        <View style={styles.timelineCardHeader}>
                          <Text style={[styles.timelineAmount, { color: '#16a34a' }]}>
                            ₹{payment.amount.toLocaleString()}
                          </Text>
                          <Text style={[styles.timelineDate, { color: subtextColor }]}>
                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                          </Text>
                        </View>
                        <View style={styles.timelineCardFooter}>
                           <Text style={[styles.timelineMethod, { color: subtextColor }]}>{payment.payment_mode === 'Cash' ? t('cash', 'Cash') : payment.payment_mode}</Text>
                           <TouchableOpacity style={[styles.timelinePdfButton, { borderColor: borderColor }]} onPress={() => generatePDF(item)}>
                             <Feather name="download" size={14} color={textColor} />
                             <Text style={[styles.timelinePdfText, { color: textColor }]}>PDF</Text>
                           </TouchableOpacity>
                        </View>
                     </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={!!selectedReceipt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>{t('paymentDetails', 'Payment Details')}</Text>
              <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                <Feather name="x" size={24} color={subtextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>Payment ID</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{selectedReceipt?.payment?.id?.substring(0, 8) || 'N/A'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>Date</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {selectedReceipt?.payment?.payment_date ? new Date(selectedReceipt.payment.payment_date).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>Time</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {selectedReceipt?.payment?.created_at ? new Date(selectedReceipt.payment.created_at).toLocaleTimeString() : (selectedReceipt?.payment?.payment_date ? new Date(selectedReceipt.payment.payment_date).toLocaleTimeString() : 'N/A')}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: borderColor, marginVertical: 15 }]} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>{t('studentName', 'Student Name')}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{transSelectedName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>{t('classAndSection')}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{t('class')} {selectedStudent?.class} {selectedStudent?.section ? `- ${selectedStudent.section}` : ''}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>{t('fathersName', "Father's Name")}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{transFatherName || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>{t('phoneNumber', 'Phone Number')}</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>{selectedStudent?.parent_phone || 'N/A'}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: borderColor, marginVertical: 15 }]} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: textColor, fontWeight: '800', fontSize: 16 }]}>Amount Paid</Text>
                <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '900', fontSize: 18 }]}>
                  Rs. {selectedReceipt?.payment?.amount?.toLocaleString() || '0'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ... retaining styles below
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 15, fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
  flex1: { flex: 1 },
  headerWrapper: { zIndex: 10 },
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: 20, paddingHorizontal: 25, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  menuButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 100 },
  feeDetailsContainer: { marginBottom: 30 },
  sectionTitleMain: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, marginBottom: 16 },
  feeDetailsCard: { borderRadius: 16, padding: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  feeDetailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontWeight: '600' },
  feeValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  feeSubValue: { fontSize: 13 },
  feeMonths: { fontSize: 13, lineHeight: 18 },
  feeTotalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalCol: { flex: 1, alignItems: 'center' },
  feeTotalValue: { fontSize: 20, fontWeight: 'bold' },
  divider: { height: 1, width: '100%' },
  
  historyContainer: { marginTop: 10 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  historyTitle: { fontSize: 18, fontWeight: 'bold' },
  timelineContainer: { position: 'relative', paddingLeft: 40 },
  timelineLine: { position: 'absolute', left: 19, top: 0, bottom: 0, width: 2 },
  timelineItem: { marginBottom: 20, position: 'relative' },
  timelineItemLeft: {},
  timelineItemRight: {},
  timelineIconContainer: { position: 'absolute', left: -40, top: 0, width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  timelineIconText: { fontSize: 18, fontWeight: 'bold' },
  timelineCard: { borderRadius: 16, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  timelineCardLeft: {},
  timelineCardRight: {},
  timelineCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  timelineAmount: { fontSize: 18, fontWeight: 'bold' },
  timelineDate: { fontSize: 13, fontWeight: '500' },
  timelineCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineMethod: { fontSize: 14, fontWeight: '500' },
  timelinePdfButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  timelinePdfText: { fontSize: 13, marginLeft: 6, fontWeight: 'bold' },
  
  emptyCard: { borderRadius: 16, padding: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginVertical: 8 },
  detailLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  detailValue: { fontSize: 13, fontWeight: '700', flex: 1.5, textAlign: 'right' },
});

export default FeesScreen;
