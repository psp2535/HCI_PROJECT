// Test verification portal navigation functionality
const http = require('http');

async function testVerificationNavigation() {
  console.log('Testing Verification Portal Navigation\n');

  try {
    // Login as verification staff
    console.log('1. Verification Staff Login...');
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
      console.log('   Verification staff login failed');
      return;
    }

    const staffToken = staffLogin.data.token;
    console.log('   Verification staff login successful');

    // Test verification dashboard data
    console.log('\n2. Testing Verification Dashboard (/verification/dashboard)...');
    const dashboardResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/verification/all',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (dashboardResponse.status === 200) {
      console.log('   Dashboard data loaded successfully');
      console.log(`   Total payments: ${dashboardResponse.data.length}`);
      console.log('   This should show: Dashboard view with stats and all payments');
    }

    // Test pending verifications
    console.log('\n3. Testing Pending Verifications (/verification/pending)...');
    const pendingResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/verification/all',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (pendingResponse.status === 200) {
      const pendingPayments = pendingResponse.data.filter(p => p.status === 'submitted');
      console.log(`   Pending payments: ${pendingPayments.length}`);
      console.log('   This should show: Pending Verifications page with only submitted payments');
    }

    // Test all payments
    console.log('\n4. Testing All Payments (/verification/all)...');
    const allPaymentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/verification/all',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (allPaymentsResponse.status === 200) {
      console.log(`   All payments loaded: ${allPaymentsResponse.data.length} payments`);
      console.log('   This should show: All Payments page with all payment statuses');
      
      // Show status breakdown
      const statusCounts = {};
      allPaymentsResponse.data.forEach(payment => {
        statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1;
      });
      console.log('   Payment status breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     ${status}: ${count}`);
      });
    }

    // Test verification stats
    console.log('\n5. Testing Verification Stats...');
    const statsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/verification/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (statsResponse.status === 200) {
      console.log('   Stats loaded successfully');
      console.log('   Dashboard stats should show:');
      console.log(`     Total Submissions: ${statsResponse.data.total || 0}`);
      console.log(`     Pending Verification: ${statsResponse.data.pending || 0}`);
      console.log(`     Verified: ${statsResponse.data.verified || 0}`);
      console.log(`     Rejected: ${statsResponse.data.rejected || 0}`);
    }

    console.log('\nVerification Portal Navigation Test Complete!');
    console.log('\nExpected Behavior:');
    console.log('1. /verification/dashboard -> Shows Dashboard view with stats and all payments');
    console.log('2. /verification/pending -> Shows Pending Verifications page with only submitted payments');
    console.log('3. /verification/all -> Shows All Payments page with all payment statuses');
    console.log('\nNavigation should work between sections with proper URL updates.');

  } catch (error) {
    console.error('Error testing verification navigation:', error.message);
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

testVerificationNavigation();
