// Test payment workflow fix
const http = require('http');

async function testPaymentFix() {
  console.log('Testing Payment Workflow Fix\n');
  console.log('============================\n');

  try {
    // Step 1: Check servers
    console.log('1. CHECKING SERVERS...');
    
    const frontendCheck = await makeRequest({
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET'
    });
    
    if (frontendCheck.status !== 200) {
      console.log('   Frontend server: NOT RUNNING');
      return;
    }
    console.log('   Frontend server: RUNNING');

    const backendCheck = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    
    if (backendCheck.status !== 200) {
      console.log('   Backend server: NOT RUNNING');
      return;
    }
    console.log('   Backend server: RUNNING');

    // Step 2: Login as student
    console.log('\n2. STUDENT LOGIN...');
    
    const studentLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/student/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      rollNo: '2023IMT-001',
      password: 'Student@123'
    });

    if (studentLogin.status !== 200) {
      console.log('   Student login failed:', studentLogin.status);
      return;
    }

    const studentToken = studentLogin.data.token;
    const studentUser = studentLogin.data.user;
    console.log('   Student login: SUCCESS');
    console.log('   Student:', studentUser.name);
    console.log('   Program:', studentUser.program);
    console.log('   Semester:', studentUser.semester);

    // Step 3: Test new payments endpoint
    console.log('\n3. TESTING NEW PAYMENTS ENDPOINT...');
    
    const paymentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/payments',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    console.log('   Student payments API:', paymentsResponse.status);
    if (paymentsResponse.status === 200) {
      console.log('   Payments endpoint: SUCCESS');
      console.log('   Existing payments:', paymentsResponse.data.length);
      paymentsResponse.data.forEach((payment, i) => {
        console.log(`     ${i + 1}. ${payment.type} - ${payment.status} - ₹${payment.totalAmount || payment.amount}`);
        console.log(`        Assigned to: ${payment.assignedTo?.name || 'Unassigned'}`);
        console.log(`        Created: ${payment.createdAt}`);
      });
    } else {
      console.log('   Payments endpoint failed:', paymentsResponse.data);
    }

    // Step 4: Test payment submission
    console.log('\n4. TESTING PAYMENT SUBMISSION...');
    
    const paymentData = {
      type: 'academic',
      totalAmount: 50000,
      academicFee: 93000,
      messFee: 18000,
      transactions: JSON.stringify([{ id: 'TXN' + Date.now(), amount: 50000, date: new Date().toISOString() }])
    };

    const submitPaymentResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/payments',
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      data: paymentData
    });

    console.log('   Submit payment API:', submitPaymentResponse.status);
    if (submitPaymentResponse.status === 200) {
      console.log('   Payment submission: SUCCESS');
      console.log('   Payment ID:', submitPaymentResponse.data.payment._id);
      console.log('   Initial status:', submitPaymentResponse.data.payment.status);
      console.log('   Assigned to staff:', submitPaymentResponse.data.payment.assignedTo?.name);
      
      var paymentId = submitPaymentResponse.data.payment._id;
    } else {
      console.log('   Payment submission failed:', submitPaymentResponse.data);
    }

    // Step 5: Check verification staff access
    console.log('\n5. CHECKING VERIFICATION STAFF ACCESS...');
    
    const staffLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/staff/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      employeeId: 'STAFF001',
      password: 'Staff@123'
    });

    if (staffLogin.status === 200) {
      const staffToken = staffLogin.data.token;
      
      const verificationPaymentsResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/verification/all',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });

      console.log('   Verification payments API:', verificationPaymentsResponse.status);
      if (verificationPaymentsResponse.status === 200) {
        console.log('   Payments available for verification:', verificationPaymentsResponse.data.length);
        verificationPaymentsResponse.data.slice(0, 3).forEach((payment, i) => {
          console.log(`     ${i + 1}. ${payment.rollNo} - ${payment.status} - ₹${payment.totalAmount || payment.amount}`);
        });
      }
    }

    // Step 6: Test payment status update
    if (paymentId) {
      console.log('\n6. TESTING PAYMENT STATUS UPDATE...');
      
      const updateStatusResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/student/payments/${paymentId}/status`,
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${studentToken}`,
          'Content-Type': 'application/json'
        },
        data: { status: 'completed' }
      });

      console.log('   Update payment status API:', updateStatusResponse.status);
      if (updateStatusResponse.status === 200) {
        console.log('   Payment status update: SUCCESS');
        console.log('   New status:', updateStatusResponse.data.payment.status);
      } else {
        console.log('   Update payment status failed:', updateStatusResponse.data);
      }
    }

    // Step 7: Check registration status after payment
    console.log('\n7. CHECKING REGISTRATION STATUS AFTER PAYMENT...');
    
    const registrationResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/registration-status',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    console.log('   Registration status API:', registrationResponse.status);
    if (registrationResponse.status === 200) {
      console.log('   Registration data:');
      console.log('   - Overall status:', registrationResponse.data.overallStatus);
      console.log('   - Payment status:', registrationResponse.data.paymentStatus);
      console.log('   - Verification status:', registrationResponse.data.verificationStatus);
      console.log('   - Faculty approval status:', registrationResponse.data.facultyApprovalStatus);
    }

    // Step 8: Expected workflow analysis
    console.log('\n8. EXPECTED WORKFLOW ANALYSIS...');
    console.log('   Fixed payment workflow:');
    console.log('   1. Student submits payment via /api/student/payments');
    console.log('   2. Payment saved with status: submitted');
    console.log('   3. Payment auto-assigned to verification staff');
    console.log('   4. Payment appears in verification staff queue');
    console.log('   5. Staff can verify payment → status: verified');
    console.log('   6. Faculty approves → status: faculty_approved');
    console.log('   7. Academic approval → status: final_approved');
    console.log('   8. Registration complete');

    // Step 9: Testing instructions for user
    console.log('\n9. TESTING INSTRUCTIONS FOR USER...');
    console.log('   To test fixed payment workflow:');
    console.log('   1. Open browser and go to: http://localhost:5173/login');
    console.log('   2. Login as a student');
    console.log('   3. Navigate to payment submission page');
    console.log('   4. Submit payment details');
    console.log('   5. Check if payment appears in verification staff portal');
    console.log('   6. Verify payment status updates correctly');
    console.log('   7. Check if registration status updates properly');

    console.log('\nPayment Workflow Fix Test Complete!');
    console.log('============================\n');

  } catch (error) {
    console.error('Error testing payment fix:', error.message);
  }
}

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

testPaymentFix();
