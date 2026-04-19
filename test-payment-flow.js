// Test script to verify payment workflow
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testPaymentFlow() {
  console.log('🧪 Testing Payment Verification Workflow...\n');

  try {
    // Step 1: Login as student
    console.log('1️⃣ Logging in as student...');
    const studentLogin = await axios.post(`${API_URL}/auth/student/login`, {
      rollNo: '2023IMT-001',
      password: 'Student@123'
    });
    const studentToken = studentLogin.data.token;
    console.log('✅ Student logged in successfully');

    // Step 2: Submit a payment
    console.log('\n2️⃣ Submitting payment...');
    const paymentData = new FormData();
    paymentData.append('transactions', JSON.stringify([{
      amount: '111000',
      date: '2025-04-19',
      utrNo: 'TEST123456',
      bankName: 'Test Bank',
      depositorName: 'Test Student',
      debitAccountNo: '1234567890'
    }]));
    paymentData.append('totalAmount', '111000');
    paymentData.append('academicFee', '93000');
    paymentData.append('messFee', '18000');

    const paymentResponse = await axios.post(`${API_URL}/payment/submit`, paymentData, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('✅ Payment submitted:', paymentResponse.data.message);

    // Step 3: Login as verification staff
    console.log('\n3️⃣ Logging in as verification staff...');
    const staffLogin = await axios.post(`${API_URL}/auth/staff/login`, {
      employeeId: 'VER001',
      password: 'Verification@123'
    });
    const staffToken = staffLogin.data.token;
    console.log('✅ Verification staff logged in successfully');

    // Step 4: Check payments for verification
    console.log('\n4️⃣ Fetching payments for verification...');
    const paymentsResponse = await axios.get(`${API_URL}/verification/all`, {
      headers: {
        'Authorization': `Bearer ${staffToken}`
      }
    });
    console.log('✅ Payments found:', paymentsResponse.data.length);
    
    if (paymentsResponse.data.length > 0) {
      console.log('📋 Payment details:');
      paymentsResponse.data.forEach((payment, index) => {
        console.log(`   ${index + 1}. Student: ${payment.studentId?.name || 'N/A'}`);
        console.log(`      Amount: ₹${payment.totalAmount?.toLocaleString('en-IN') || 'N/A'}`);
        console.log(`      UTR: ${payment.transactions?.[0]?.utrNo || 'N/A'}`);
        console.log(`      Status: ${payment.status || 'N/A'}`);
        console.log(`      Assigned to: ${payment.assignedTo || 'N/A'}`);
      });
    } else {
      console.log('❌ No payments found for verification');
    }

    console.log('\n🎉 Payment workflow test completed!');

  } catch (error) {
    console.error('❌ Error in payment workflow:', error.response?.data || error.message);
  }
}

testPaymentFlow();
