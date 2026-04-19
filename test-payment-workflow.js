// Test fee payment workflow issue
const http = require('http');

async function testPaymentWorkflow() {
  console.log('Testing Fee Payment Workflow Issue\n');
  console.log('===================================\n');

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
      rollNo: '2025IMT-057',
      password: '2025IMT-057'
    });

    if (studentLogin.status !== 200) {
      console.log('   Student login failed:', studentLogin.status);
      console.log('   Trying alternative credentials...');
      
      const altLogin = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/student/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        rollNo: '2023IMT-001',
        password: 'Student@123'
      });
      
      if (altLogin.status !== 200) {
        console.log('   All student login attempts failed');
        return;
      }
      
      console.log('   Student login: SUCCESS (alternative)');
      var studentToken = altLogin.data.token;
      var studentUser = altLogin.data.user;
    } else {
      console.log('   Student login: SUCCESS');
      var studentToken = studentLogin.data.token;
      var studentUser = studentLogin.data.user;
    }

    console.log('   Student:', studentUser.name);
    console.log('   Program:', studentUser.program);
    console.log('   Semester:', studentUser.semester);

    // Step 3: Check existing payments
    console.log('\n3. CHECKING EXISTING PAYMENTS...');
    
    const paymentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/payments',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    console.log('   Student payments API:', paymentsResponse.status);
    if (paymentsResponse.status === 200) {
      console.log('   Existing payments:', paymentsResponse.data.length);
      paymentsResponse.data.forEach((payment, i) => {
        console.log(`     ${i + 1}. ${payment.type} - ${payment.status} - ₹${payment.amount}`);
        console.log(`        Transaction ID: ${payment.transactionId || 'N/A'}`);
        console.log(`        Created: ${payment.createdAt}`);
        console.log(`        Updated: ${payment.updatedAt}`);
      });
    }

    // Step 4: Check registration status
    console.log('\n4. CHECKING REGISTRATION STATUS...');
    
    const registrationResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/registration-status',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    console.log('   Registration status API:', registrationResponse.status);
    if (registrationResponse.status === 200) {
      console.log('   Registration data:', registrationResponse.data);
      console.log('   Overall status:', registrationResponse.data.overallStatus);
      console.log('   Payment status:', registrationResponse.data.paymentStatus);
      console.log('   Verification status:', registrationResponse.data.verificationStatus);
      console.log('   Faculty approval status:', registrationResponse.data.facultyApprovalStatus);
    }

    // Step 5: Test payment submission
    console.log('\n5. TESTING PAYMENT SUBMISSION...');
    
    const paymentData = {
      type: 'academic',
      amount: 50000,
      transactionId: 'TEST_' + Date.now(),
      paymentMethod: 'online',
      description: 'Academic fee payment test'
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
      console.log('   Payment ID:', submitPaymentResponse.data._id);
      console.log('   Initial status:', submitPaymentResponse.data.status);
    } else {
      console.log('   Payment submission failed:', submitPaymentResponse.data);
    }

    // Step 6: Check verification staff access
    console.log('\n6. CHECKING VERIFICATION STAFF ACCESS...');
    
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
          console.log(`     ${i + 1}. ${payment.studentId?.name || 'Unknown'} - ${payment.status} - ₹${payment.amount}`);
        });
      }
    }

    // Step 7: Check payment status update mechanism
    console.log('\n7. CHECKING PAYMENT STATUS UPDATE...');
    
    // Check if there's a payment update endpoint
    const updatePaymentResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/payments/update-status',
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        paymentId: submitPaymentResponse.data?._id || 'test-id',
        status: 'completed'
      }
    });

    console.log('   Update payment status API:', updatePaymentResponse.status);
    if (updatePaymentResponse.status === 200) {
      console.log('   Payment status update: SUCCESS');
    } else if (updatePaymentResponse.status === 404) {
      console.log('   Update payment status endpoint: NOT FOUND');
    } else {
      console.log('   Update payment status failed:', updatePaymentResponse.data);
    }

    // Step 8: Expected workflow analysis
    console.log('\n8. EXPECTED WORKFLOW ANALYSIS...');
    console.log('   Expected payment workflow:');
    console.log('   1. Student submits payment → status: submitted');
    console.log('   2. Payment appears in verification staff queue');
    console.log('   3. Staff verifies payment → status: verified');
    console.log('   4. Faculty approves → status: faculty_approved');
    console.log('   5. Academic approval → status: final_approved');
    console.log('   6. Registration complete');

    // Step 9: Troubleshooting guide
    console.log('\n9. TROUBLESHOOTING GUIDE...');
    console.log('   If payment is not showing as completed:');
    console.log('   a) Check if payment was actually saved to database');
    console.log('   b) Verify payment status is being updated correctly');
    console.log('   c) Check if verification staff can see the payment');
    console.log('   d) Look for JavaScript errors in browser console');
    console.log('   e) Check network tab for failed API calls');
    console.log('   f) Verify payment workflow automation');

    console.log('\nPayment Workflow Test Complete!');
    console.log('===================================\n');

  } catch (error) {
    console.error('Error testing payment workflow:', error.message);
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

testPaymentWorkflow();
