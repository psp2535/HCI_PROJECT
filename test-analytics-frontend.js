// Test analytics frontend data loading
const http = require('http');

async function testAnalyticsFrontend() {
  console.log('Testing Analytics Frontend Data Loading\n');

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

    // Test analytics API specifically for frontend
    console.log('\n2. Testing Analytics API for Frontend...');
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
      
      console.log('\n3. Frontend Data Structure Validation:');
      
      // Check if data structure matches what frontend expects
      console.log('   Overview object exists:', !!data.overview);
      console.log('   Charts object exists:', !!data.charts);
      
      if (data.charts) {
        console.log('   studentsByProgram array:', Array.isArray(data.charts.studentsByProgram));
        console.log('   paymentsByStatus array:', Array.isArray(data.charts.paymentsByStatus));
        console.log('   registrationsByStatus array:', Array.isArray(data.charts.registrationsByStatus));
        
        // Check data transformation for charts
        const studentsChartData = data.charts.studentsByProgram?.map(item => ({ 
          name: item._id, 
          value: item.count 
        }));
        console.log('   Students chart data transformed:', studentsChartData);
        
        const paymentsChartData = data.charts.paymentsByStatus?.map(item => ({ 
          name: item._id, 
          value: item.count 
        }));
        console.log('   Payments chart data transformed:', paymentsChartData);
        
        // Simulate frontend checks
        console.log('\n4. Frontend Condition Checks:');
        console.log('   analytics.charts?.studentsByProgram?.length > 0:', 
          data.charts?.studentsByProgram?.length > 0 ? 'TRUE' : 'FALSE');
        console.log('   analytics.charts?.paymentsByStatus?.length > 0:', 
          data.charts?.paymentsByStatus?.length > 0 ? 'TRUE' : 'FALSE');
        
        // Check if data would render
        if (data.charts?.studentsByProgram?.length > 0) {
          console.log('   Students chart would render: YES');
          console.log('   Data points:', data.charts.studentsByProgram.length);
        } else {
          console.log('   Students chart would render: NO');
        }
        
        if (data.charts?.paymentsByStatus?.length > 0) {
          console.log('   Payments chart would render: YES');
          console.log('   Data points:', data.charts.paymentsByStatus.length);
        } else {
          console.log('   Payments chart would render: NO');
        }
      }
      
    } else {
      console.log('   Analytics API failed:', analyticsResponse.status, analyticsResponse.data);
    }

    console.log('\nAnalytics Frontend Testing Complete!');
    console.log('\nExpected Frontend Behavior:');
    console.log('1. Analytics section should load data from /api/admin/analytics');
    console.log('2. Should show debug info with data counts');
    console.log('3. Should render charts if data is available');
    console.log('4. Should show "No data available" only if arrays are empty');

  } catch (error) {
    console.error('Error testing analytics frontend:', error.message);
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

testAnalyticsFrontend();
