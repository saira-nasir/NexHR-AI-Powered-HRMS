// Test utility for payslip generation
import payrollService from '@/services/payrollService';

export const testPayslipGeneration = async () => {
  console.log('🧪 Testing Payslip Generation...');
  
  try {
    // Test 1: Get all payrolls
    console.log('📋 Fetching all payrolls...');
    const payrolls = await payrollService.listPayrolls();
    console.log('Payrolls:', payrolls);
    
    // Test 2: Get all payslips
    console.log('📄 Fetching all payslips...');
    const payslips = await payrollService.listPayslips();
    console.log('Payslips:', payslips);
    
    // Test 3: Find Sara Malik's payroll
    const saraMalikPayroll = payrolls.find(p => p.employee === 3);
    console.log('Sara Malik payroll:', saraMalikPayroll);
    
    if (saraMalikPayroll) {
      // Test 4: Try to generate payslip for Sara Malik
      console.log('🔄 Attempting to generate payslip for Sara Malik...');
      try {
        const newPayslip = await payrollService.generatePayslip(saraMalikPayroll.id);
        console.log('✅ Sara Malik payslip generated:', newPayslip);
      } catch (error) {
        console.error('❌ Sara Malik payslip generation failed:', error);
      }
    }
    
    // Test 5: Check which employees need payslips
    const paidPayrollsWithoutPayslips = payrolls.filter(p => 
      p.payment_status === 'PAID' && 
      !payslips.some(ps => ps.payroll === p.id)
    );
    console.log('Employees needing payslips:', paidPayrollsWithoutPayslips);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Make it available globally for testing
(window as any).testPayslipGeneration = testPayslipGeneration;
