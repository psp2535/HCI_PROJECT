// Simple test for button functionality
const http = require('http');

async function testSimpleButton() {
  console.log('Testing Simple Button Functionality\n');
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
        
        // Step 4: Test payment status update
        console.log('\n4. TESTING PAYMENT STATUS UPDATE...');
        
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
      } else {
        console.log('   No payments found for student');
      }
    } else {
      console.log('   Failed to get payments:', currentPaymentResponse.data);
    }

    // Step 5: Instructions for user
    console.log('\n5. INSTRUCTIONS FOR USER...');
    console.log('   To test the "Mark Payment as Completed" button:');
    console.log('   1. Open browser and go to: http://localhost:5173/login');
    console.log('   2. Login as a student');
    console.log('   3. Navigate to the Fee Payment page');
    console.log('   4. Submit payment details first');
    console.log('   5. Click the "Mark Payment as Completed" button');
    console.log('   6. Check browser console for any errors');
    console.log('   7. Check Network tab for API calls');
    console.log('   8. Verify that the button shows "Mark Payment as Completed"');

    console.log('\nSimple Button Test Complete!');
    console.log('====================================\n');

  } catch (error) {
    console.error('Error testing simple button:', error.message);
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

testSimpleButton();
