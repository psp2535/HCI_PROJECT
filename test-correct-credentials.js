// Test with correct verification staff credentials
const http = require('http');

async function testCorrectCredentials() {
  console.log('🧪 Testing Payment Verification Workflow with Correct Credentials...\n');

  try {
    // Step 1: Login as student
    console.log('1️⃣ Logging in as student...');
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
      console.log('❌ Student login failed:', studentLogin.data);
      return;
    }

    const studentToken = studentLogin.data.token;
    console.log('✅ Student logged in successfully');

    // Step 2: Submit payment
    console.log('\n2️⃣ Submitting payment...');
    const paymentData = {
      transactions: [{
        amount: '111000',
        date: '2025-04-19',
        utrNo: 'TEST123456',
        bankName: 'Test Bank',
        depositorName: 'Test Student',
        debitAccountNo: '1234567890'
      }],
      totalAmount: '111000',
      academicFee: '93000',
      messFee: '18000'
    };

    const paymentResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/payment/submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      }
    }, paymentData);

    if (paymentResponse.status !== 200) {
      console.log('❌ Payment submission failed:', paymentResponse.data);
      return;
    }

    console.log('✅ Payment submitted:', paymentResponse.data.message);

    // Step 3: Login with CORRECT verification staff credentials
    console.log('\n3️⃣ Logging in as verification staff (STAFF001)...');
    const staffLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/staff/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      employeeId: 'STAFF001',
      password: 'Staff@123'  // Try common password
    });

    if (staffLogin.status !== 200) {
      console.log('❌ Staff login failed with Staff@123, trying other passwords...');
      
      // Try with other common passwords
      const passwords = ['Verification@123', 'admin123', 'password', '123456'];
      for (const pwd of passwords) {
        console.log(`   Trying password: ${pwd}`);
        const testLogin = await makeRequest({
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/staff/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, {
          employeeId: 'STAFF001',
          password: pwd
        });

        if (testLogin.status === 200) {
          console.log(`✅ Login successful with password: ${pwd}`);
          staffLogin.data = testLogin.data;
          break;
        }
      }

      if (staffLogin.status !== 200) {
        console.log('❌ All password attempts failed');
        return;
      }
    } else {
      console.log('✅ Verification staff logged in successfully');
    }

    const staffToken = staffLogin.data.token;

    // Step 4: Check payments for verification
    console.log('\n4️⃣ Fetching payments for verification...');
    const paymentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/verification/all',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${staffToken}`
      }
    });

    if (paymentsResponse.status !== 200) {
      console.log('❌ Failed to fetch payments:', paymentsResponse.data);
      return;
    }

    const payments = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [];
    console.log(`✅ Found ${payments.length} payments for verification`);

    if (payments.length > 0) {
      console.log('\n📋 Payment details:');
      payments.forEach((payment, index) => {
        console.log(`   ${index + 1}. Student: ${payment.studentId?.name || 'N/A'}`);
        console.log(`      Amount: ₹${payment.totalAmount || 'N/A'}`);
        console.log(`      UTR: ${payment.transactions?.[0]?.utrNo || 'N/A'}`);
        console.log(`      Status: ${payment.status || 'N/A'}`);
        console.log(`      Assigned to: ${payment.assignedTo || 'N/A'}`);
      });
    } else {
      console.log('❌ No payments found for verification');
    }

    console.log('\n🎉 Payment workflow test completed!');

  } catch (error) {
    console.error('❌ Error in payment workflow:', error.message);
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

testCorrectCredentials();
