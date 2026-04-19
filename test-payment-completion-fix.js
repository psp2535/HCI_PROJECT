// Test payment completion fix
const http = require('http');

async function testPaymentCompletionFix() {
  console.log('Testing Payment Completion Fix\n');
  console.log('================================\n');

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

    // Step 3: Get current payment
    console.log('\n3. GETTING CURRENT PAYMENT...');
    
    const currentPaymentResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/payments',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    console.log('   Current payment API:', currentPaymentResponse.status);
    if (currentPaymentResponse.status === 200) {
      const payments = currentPaymentResponse.data;
      console.log('   Found', payments.length, 'payments');
      
      if (payments.length > 0) {
        const payment = payments[0];
        console.log('   Current payment:');
        console.log('   - ID:', payment._id);
        console.log('   - Status:', payment.status);
        console.log('   - Amount:', payment.totalAmount || payment.amount);
        console.log('   - Assigned to:', payment.assignedTo?.name || 'Unassigned');

        // Step 4: Test payment completion update
        console.log('\n4. TESTING PAYMENT COMPLETION UPDATE...');
        
        const updateResponse = await makeRequest({
          hostname: 'localhost',
          port: 5000,
          path: `/api/student/payments/${payment._id}/status`,
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json'
          },
          data: { status: 'completed' }
        });

        console.log('   Payment completion update API:', updateResponse.status);
        if (updateResponse.status === 200) {
          console.log('   Payment completion update: SUCCESS');
          console.log('   New status:', updateResponse.data.payment.status);
          
          // Step 5: Verify verification staff can see the payment
          console.log('\n5. VERIFYING VERIFICATION STAFF ACCESS...');
          
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
              
              const updatedPayment = verificationPaymentsResponse.data.find(p => p._id === payment._id);
              if (updatedPayment) {
                console.log('   Updated payment found in verification queue:');
                console.log('   - Student:', updatedPayment.rollNo);
                console.log('   - Status:', updatedPayment.status);
                console.log('   - Amount:', updatedPayment.totalAmount || updatedPayment.amount);
                console.log('   SUCCESS: Payment is now visible to verification staff!');
              } else {
                console.log('   Updated payment not found in verification queue');
              }
            }
          }

          // Step 6: Check registration status
          console.log('\n6. CHECKING REGISTRATION STATUS...');
          
          const registrationResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/student/registration-status',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${studentToken}` }
          });

          console.log('   Registration status API:', registrationResponse.status);
          if (registrationResponse.status === 200) {
            console.log('   Updated registration status:');
            console.log('   - Overall status:', registrationResponse.data.overallStatus);
            console.log('   - Payment status:', registrationResponse.data.paymentStatus);
            console.log('   - Verification status:', registrationResponse.data.verificationStatus);
          }

        } else {
          console.log('   Payment completion update failed:', updateResponse.data);
        }
      } else {
        console.log('   No payments found for student');
      }
    } else {
      console.log('   Failed to get payments:', currentPaymentResponse.data);
    }

    // Step 7: Expected workflow analysis
    console.log('\n7. EXPECTED WORKFLOW ANALYSIS...');
    console.log('   Fixed payment completion workflow:');
    console.log('   1. Student submits payment → status: submitted');
    console.log('   2. Student clicks "Mark Payment as Completed"');
    console.log('   3. Frontend calls PUT /api/student/payments/:id/status');
    console.log('   4. Backend updates payment status to: completed');
    console.log('   5. Payment appears in verification staff queue');
    console.log('   6. Staff can verify payment → status: verified');
    console.log('   7. Faculty approves → status: faculty_approved');
    console.log('   8. Academic approval → status: final_approved');
    console.log('   9. Registration complete');

    // Step 8: Testing instructions for user
    console.log('\n8. TESTING INSTRUCTIONS FOR USER...');
    console.log('   To test fixed payment completion:');
    console.log('   1. Open browser and go to: http://localhost:5173/login');
    console.log('   2. Login as a student');
    console.log('   3. Navigate to fee payment page');
    console.log('   4. Submit payment details');
    console.log('   5. Click "Mark Payment as Completed" button');
    console.log('   6. Check browser network tab for API call');
    console.log('   7. Login as verification staff to check queue');
    console.log('   8. Verify payment appears in verification portal');

    console.log('\nPayment Completion Fix Test Complete!');
    console.log('================================\n');

  } catch (error) {
    console.error('Error testing payment completion fix:', error.message);
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

testPaymentCompletionFix();
