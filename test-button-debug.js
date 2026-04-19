// Test button functionality debug
const http = require('http');

async function testButtonDebug() {
  console.log('Testing Button Functionality Debug\n');
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
    let payment = null;
    if (currentPaymentResponse.status === 200) {
      const payments = currentPaymentResponse.data;
      console.log('   Found', payments.length, 'payments');
      
      if (payments.length > 0) {
        payment = payments[0];
        console.log('   Current payment:');
        console.log('   - ID:', payment._id);
        console.log('   - Status:', payment.status);
        console.log('   - Amount:', payment.totalAmount || payment.amount);
        console.log('   - Payment object exists:', !!payment);
        console.log('   - Payment._id exists:', !!payment._id);
      }
    }

    // Step 4: Test different scenarios
    console.log('\n4. TESTING DIFFERENT SCENARIOS...');
    
    if (payment) {
      // Scenario 1: Test payment status update
      console.log('\n   SCENARIO 1: Testing payment status update...');
      
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

      console.log('   Status update API:', updateResponse.status);
      if (updateResponse.status === 200) {
        console.log('   Status update: SUCCESS');
        console.log('   New status:', updateResponse.data.payment.status);
      } else {
        console.log('   Status update failed:', updateResponse.data);
      }

      // Scenario 2: Test if button would work
      console.log('\n   SCENARIO 2: Testing button logic...');
      console.log('   Payment object before button click:');
      console.log('   - payment exists:', !!payment);
      console.log('   - payment._id exists:', !!(payment && payment._id));
      console.log('   - payment.status:', payment?.status);
      console.log('   - Button should be enabled:', !!(payment && payment._id) ? false : true);
      
      // Simulate button click conditions
      const buttonShouldWork = payment && payment._id;
      console.log('   Button should work:', buttonShouldWork);
      
      if (!buttonShouldWork) {
        console.log('   ISSUE: Button should be disabled but might not be');
      } else {
        console.log('   Button should work - check frontend implementation');
      }
    } else {
      console.log('   No payment found - button should be disabled');
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
      }
    }

    // Step 6: Frontend debugging guide
    console.log('\n6. FRONTEND DEBUGGING GUIDE...');
    console.log('   If "Mark Payment as Completed" button is not working:');
    console.log('   a) Open browser developer tools (F12)');
    console.log('   b) Go to Elements tab and inspect the button');
    console.log('   c) Check if button has correct onClick handler');
    console.log('   d) Look for console errors when clicking button');
    console.log('   e) Check Network tab for API calls when clicking');
    console.log('   f) Verify payment object is not null');
    console.log('   g) Check if button is disabled when it should be enabled');
    console.log('   h) Look for JavaScript errors in FeePayment.jsx');

    console.log('\nButton Debug Test Complete!');
    console.log('===================================\n');

  } catch (error) {
    console.error('Error testing button debug:', error.message);
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

testButtonDebug();
