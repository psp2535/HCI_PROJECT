// Test verification dashboard functionality
const http = require('http');

async function testVerificationDashboard() {
  console.log('🧪 Testing Verification Dashboard Functionality\n');

  try {
    // Login as verification staff
    console.log('1️⃣ Logging in as verification staff...');
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

    if (staffLogin.status !== 200) {
      console.log('❌ Staff login failed:', staffLogin.data);
      return;
    }

    const staffToken = staffLogin.data.token;
    console.log('✅ Verification staff logged in successfully');

    // Get all payments
    console.log('\n2️⃣ Fetching all payments...');
    const paymentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/verification/all',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (paymentsResponse.status !== 200) {
      console.log('❌ Failed to fetch payments:', paymentsResponse.data);
      return;
    }

    const payments = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [];
    console.log(`✅ Found ${payments.length} payments`);

    // Get verification stats
    console.log('\n3️⃣ Fetching verification stats...');
    const statsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/verification/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (statsResponse.status === 200) {
      console.log('✅ Stats loaded:', statsResponse.data);
    }

    // Analyze payment data structure
    if (payments.length > 0) {
      console.log('\n📊 Payment Analysis:');
      payments.forEach((payment, index) => {
        console.log(`   Payment ${index + 1}:`);
        console.log(`     ID: ${payment._id}`);
        console.log(`     Student: ${payment.studentId?.name || 'N/A'}`);
        console.log(`     Roll No: ${payment.rollNo || payment.studentId?.rollNo || 'N/A'}`);
        console.log(`     Program: ${payment.studentId?.program || 'N/A'}`);
        console.log(`     Amount: ₹${payment.totalAmount || 'N/A'}`);
        console.log(`     Status: ${payment.status || 'N/A'}`);
        console.log(`     Transactions: ${payment.transactions?.length || 0}`);
        if (payment.transactions && payment.transactions.length > 0) {
          const txn = payment.transactions[0];
          console.log(`     UTR: ${txn.utrNo || 'N/A'}`);
          console.log(`     Bank: ${txn.bankName || 'N/A'}`);
          console.log(`     Date: ${txn.date || 'N/A'}`);
        }
        console.log(`     Assigned to: ${payment.assignedTo || 'N/A'}`);
        console.log('');
      });

      // Test filtering
      const submitted = payments.filter(p => p.status === 'submitted');
      const verified = payments.filter(p => p.status === 'verified');
      const rejected = payments.filter(p => p.status === 'rejected');

      console.log('🔍 Status Breakdown:');
      console.log(`   Submitted: ${submitted.length}`);
      console.log(`   Verified: ${verified.length}`);
      console.log(`   Rejected: ${rejected.length}`);
      console.log(`   Total: ${payments.length}`);
    }

    console.log('\n🎉 Verification dashboard test completed!');

  } catch (error) {
    console.error('❌ Error testing verification dashboard:', error.message);
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

testVerificationDashboard();
