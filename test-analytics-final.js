// Final test for analytics functionality
const http = require('http');

async function testAnalyticsFinal() {
  console.log('Final Analytics Test\n');

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

    // Test analytics API
    console.log('\n2. Testing Analytics API...');
    const analyticsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/analytics',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (analyticsResponse.status === 200) {
      console.log('   Analytics API successful');
      
      const data = analyticsResponse.data;
      console.log('\n3. Analytics Data Summary:');
      
      console.log('   Overview Statistics:');
      console.log(`     Total Students: ${data.overview?.totalStudents || 0}`);
      console.log(`     Total Registrations: ${data.overview?.totalRegistrations || 0}`);
      console.log(`     Total Receipts: ${data.overview?.totalReceipts || 0}`);
      console.log(`     Pending Payments: ${data.overview?.pendingPayments || 0}`);
      console.log(`     Verified Payments: ${data.overview?.verifiedPayments || 0}`);
      console.log(`     Rejected Payments: ${data.overview?.rejectedPayments || 0}`);
      console.log(`     Faculty Pending: ${data.overview?.facultyPending || 0}`);
      console.log(`     Final Approved: ${data.overview?.finalApproved || 0}`);
      
      console.log('\n   Chart Data:');
      
      // Students by Program
      const studentsByProgram = data.charts?.studentsByProgram || [];
      console.log(`     Students by Program: ${studentsByProgram.length} items`);
      studentsByProgram.forEach((item, index) => {
        console.log(`       ${index + 1}. ${item._id}: ${item.count} students`);
      });
      
      // Payments by Status
      const paymentsByStatus = data.charts?.paymentsByStatus || [];
      console.log(`     Payments by Status: ${paymentsByStatus.length} items`);
      paymentsByStatus.forEach((item, index) => {
        console.log(`       ${index + 1}. ${item._id}: ${item.count} payments`);
      });
      
      // Registrations by Status
      const registrationsByStatus = data.charts?.registrationsByStatus || [];
      console.log(`     Registrations by Status: ${registrationsByStatus.length} items`);
      registrationsByStatus.forEach((item, index) => {
        console.log(`       ${index + 1}. ${item._id}: ${item.count} registrations`);
      });
      
      console.log('\n4. Expected Frontend Behavior:');
      console.log('   Analytics page should show:');
      console.log('   - Debug info panel with data counts');
      console.log('   - Students by Program pie chart with 3 segments (IMT: 12, BCS: 1, BEE: 1)');
      console.log('   - Payments by Status bar chart with 2 bars (submitted: 3, verified: 1)');
      console.log('   - Registrations by Status bar chart with 2 bars (draft: 12, faculty_approved: 1)');
      console.log('   - Back to Dashboard button');
      
      console.log('\n5. Troubleshooting:');
      console.log('   If charts still show "No data available":');
      console.log('   - Check browser console for JavaScript errors');
      console.log('   - Verify analytics state is being updated (check debug info)');
      console.log('   - Clear browser cache and refresh');
      console.log('   - Check network tab for API calls');
      
    } else {
      console.log('   Analytics API failed:', analyticsResponse.status, analyticsResponse.data);
    }

    console.log('\nFinal Analytics Test Complete!');

  } catch (error) {
    console.error('Error in final analytics test:', error.message);
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

testAnalyticsFinal();
