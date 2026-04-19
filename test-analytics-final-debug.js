// Final comprehensive test for analytics functionality
const http = require('http');

async function testAnalyticsFinalDebug() {
  console.log('Final Comprehensive Analytics Test\n');

  try {
    // Login as admin
    console.log('1. Admin Login...');
    const adminLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/staff/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      employeeId: 'ADMIN001',
      password: 'Admin@123'
    });

    if (adminLogin.status !== 200) {
      console.log('   Admin login failed');
      return;
    }

    const adminToken = adminLogin.data.token;
    console.log('   Admin login successful');

    // Test analytics API multiple times to ensure consistency
    console.log('\n2. Testing Analytics API Consistency...');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\n   Test ${i}:`);
      const analyticsResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/analytics',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (analyticsResponse.status === 200) {
        const data = analyticsResponse.data;
        console.log(`     Status: SUCCESS`);
        console.log(`     Overview keys: ${Object.keys(data.overview || {}).length}`);
        console.log(`     Charts keys: ${Object.keys(data.charts || {}).length}`);
        console.log(`     Students by program: ${data.charts?.studentsByProgram?.length || 0} items`);
        console.log(`     Payments by status: ${data.charts?.paymentsByStatus?.length || 0} items`);
        console.log(`     Registrations by status: ${data.charts?.registrationsByStatus?.length || 0} items`);
        
        // Verify data structure
        const isValid = 
          data.overview && 
          data.charts && 
          Array.isArray(data.charts.studentsByProgram) &&
          Array.isArray(data.charts.paymentsByStatus) &&
          Array.isArray(data.charts.registrationsByStatus);
        
        console.log(`     Data structure valid: ${isValid ? 'YES' : 'NO'}`);
        
        if (!isValid) {
          console.log(`     ERROR: Invalid data structure detected`);
        }
      } else {
        console.log(`     Status: FAILED (${analyticsResponse.status})`);
      }
    }

    console.log('\n3. Expected Frontend Behavior:');
    console.log('   With enhanced debugging, you should see:');
    console.log('   - "Loading analytics data..." in console');
    console.log('   - "Analytics response:" with full data object');
    console.log('   - "Analytics response charts:" with charts object');
    console.log('   - Individual chart data arrays');
    console.log('   - "Analytics state set" confirmation');
    console.log('   - "Forcing analytics state update..." after 100ms');
    console.log('   - "Analytics section active" when rendering');
    console.log('   - Detailed analytics state information');
    console.log('   - Enhanced debug info panel with all data counts');

    console.log('\n4. Troubleshooting Guide:');
    console.log('   If charts still show "No data available":');
    console.log('   1. Check browser console for all debugging messages');
    console.log('   2. Verify "Analytics response:" shows correct data');
    console.log('   3. Check "Analytics state set" appears');
    console.log('   4. Look for "Analytics section active" message');
    console.log('   5. Verify debug info panel shows correct counts');
    console.log('   6. Check for any JavaScript errors in console');
    console.log('   7. Clear browser cache and refresh page');

    console.log('\n5. Expected Debug Info Panel:');
    console.log('   Analytics loaded: YES');
    console.log('   Analytics keys: overview, charts');
    console.log('   Charts available: 3');
    console.log('   Charts keys: studentsByProgram, paymentsByStatus, registrationsByStatus');
    console.log('   Students by program: 3 items');
    console.log('   Payments by status: 2 items');
    console.log('   Registrations by status: 2 items');
    console.log('   Should render charts: YES');

    console.log('\n6. Chart Data Expected:');
    console.log('   Students by Program: IMT (12), BCS (1), BEE (1)');
    console.log('   Payments by Status: submitted (3), verified (1)');
    console.log('   Registrations by Status: draft (12), faculty_approved (1)');

    console.log('\nAnalytics Final Debug Test Complete!');

  } catch (error) {
    console.error('Error in final analytics debug test:', error.message);
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

testAnalyticsFinalDebug();
