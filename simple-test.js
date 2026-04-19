// Simple test to check payment workflow
const http = require('http');

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

async function testWorkflow() {
  console.log('🧪 Testing Payment Verification Workflow...\n');

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

    // Step 3: Login as verification staff
    console.log('\n3️⃣ Logging in as verification staff...');
    const staffLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/staff/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      employeeId: 'VER001',
      password: 'Verification@123'
    });

    if (staffLogin.status !== 200) {
      console.log('❌ Staff login failed:', staffLogin.data);
      return;
    }

    const staffToken = staffLogin.data.token;
    console.log('✅ Verification staff logged in successfully');

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

testWorkflow();
