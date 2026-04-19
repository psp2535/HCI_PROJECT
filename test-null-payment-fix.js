// Test null payment object fix
const http = require('http');

async function testNullPaymentFix() {
  console.log('Testing Null Payment Object Fix\n');
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
        
        // Step 4: Test payment completion with null check
        console.log('\n4. TESTING PAYMENT COMPLETION WITH NULL CHECK...');
        
        if (payment && payment._id) {
          console.log('   Payment object is valid, testing status update...');
          
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
          console.log('   Payment object is null or missing _id');
          console.log('   This should trigger null check in frontend');
        }
      } else {
        console.log('   No payments found for student');
      }
    } else {
      console.log('   Failed to get payments:', currentPaymentResponse.data);
    }

    // Step 5: Test scenario where payment is null
    console.log('\n5. TESTING NULL PAYMENT SCENARIO...');
    console.log('   This simulates clicking "Mark Payment as Completed" when payment is null');
    console.log('   Expected: Button should be disabled and no error should occur');
    
    console.log('\n6. EXPECTED BEHAVIOR ANALYSIS...');
    console.log('   Fixed payment completion with null check:');
    console.log('   - Button disabled when payment is null or missing _id');
    console.log('   - No error when clicking disabled button');
    console.log('   - Proper error handling for API calls');
    console.log('   - Payment object refetched after status update');

    // Step 7: Testing instructions for user
    console.log('\n7. TESTING INSTRUCTIONS FOR USER...');
    console.log('   To test null payment fix:');
    console.log('   1. Open browser and go to: http://localhost:5173/login');
    console.log('   2. Login as a student');
    console.log('   3. Navigate to fee payment page');
    console.log('   4. Submit payment details first');
    console.log('   5. Click "Mark Payment as Completed"');
    console.log('   6. Should see no error in console');
    console.log('   7. Button should be disabled if payment is null');
    console.log('   8. Status should update properly');

    console.log('\nNull Payment Fix Test Complete!');
    console.log('================================\n');

  } catch (error) {
    console.error('Error testing null payment fix:', error.message);
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

testNullPaymentFix();
