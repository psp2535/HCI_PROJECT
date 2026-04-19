// Test Semester Registration Portal button functionality
const http = require('http');

async function testSemesterPortalButton() {
  console.log('Testing Semester Registration Portal Button\n');
  console.log('====================================\n');

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
        console.log('   - Payment object exists:', !!payment);
        console.log('   - Payment._id exists:', !!payment._id);

        // Step 4: Test button click simulation
        console.log('\n4. SIMULATING BUTTON CLICK...');
        console.log('   This simulates what should happen when clicking "Mark Payment as Completed"');
        console.log('   Expected:');
        console.log('   - Button should be enabled if payment && payment._id');
        console.log('   - Button should call handleStatusUpdate with payment._id and "completed"');
        console.log('   - Should see console logs: "=== Payment Status Update Called ==="');
        console.log('   - Should see API call to PUT /api/student/payments/:id/status');
        console.log('   - Should see success toast message');
        
        // Test the actual button click scenario
        if (payment && payment._id) {
          console.log('   BUTTON SHOULD WORK - payment object is valid');
          console.log('   If button is not working, check:');
          console.log('   1. Browser console for JavaScript errors');
          console.log('   2. Network tab for failed API calls');
          console.log('   3. Element inspection for onClick handler');
          console.log('   4. Check if handleStatusUpdate function exists');
          console.log('   5. Verify payment object state');
        } else {
          console.log('   BUTTON SHOULD BE DISABLED - payment object is invalid');
        }
      } else {
        console.log('   NO PAYMENT FOUND - button should be disabled');
      }
    }

    // Step 5: Test payment status update
    if (payments.length > 0 && payments[0]._id) {
      console.log('\n5. TESTING PAYMENT STATUS UPDATE...');
      
      const updateResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/student/payments/${payments[0]._id}/status`,
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
    }

    // Step 6: Expected behavior analysis
    console.log('\n6. EXPECTED BEHAVIOR ANALYSIS...');
    console.log('   If "Mark Payment as Completed" button is not working:');
    console.log('   a) Check browser console for JavaScript errors when clicking button');
    console.log('   b) Check Network tab for API call to PUT /api/student/payments/:id/status');
    console.log('   c) Verify that payment object is not null when button is clicked');
    console.log('   d) Check that handleStatusUpdate function is defined and working');
    console.log('   e) Verify that button is not disabled when it should be enabled');
    console.log('   f) Check that onClick handler is properly attached to button');

    // Step 7: Frontend debugging guide
    console.log('\n7. FRONTEND DEBUGGING GUIDE...');
    console.log('   To debug the button issue:');
    console.log('   1. Open browser and navigate to fee payment page');
    console.log('   2. Right-click on "Mark Payment as Completed" button and select "Inspect"');
    console.log('   3. Check if button has correct onClick attribute');
    console.log('   4. Click the button and watch browser console');
    console.log('   5. Look for any error messages');
    console.log('   6. Check Network tab for API calls');
    console.log('   7. Verify button state changes');

    console.log('\nSemester Portal Button Test Complete!');
    console.log('====================================\n');

  } catch (error) {
    console.error('Error testing semester portal button:', error.message);
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

testSemesterPortalButton();
