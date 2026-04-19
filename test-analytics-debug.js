// Debug analytics data loading issue
const http = require('http');

async function testAnalyticsDebug() {
  console.log('Debugging Analytics Data Loading Issue\n');

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

    // Test analytics API with detailed debugging
    console.log('\n2. Testing Analytics API with Debug Info...');
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
      
      console.log('\n3. Detailed Data Structure Analysis:');
      console.log('   Full analytics object keys:', Object.keys(data));
      console.log('   Overview object keys:', data.overview ? Object.keys(data.overview) : 'NO OVERVIEW');
      console.log('   Charts object keys:', data.charts ? Object.keys(data.charts) : 'NO CHARTS');
      
      if (data.charts) {
        console.log('\n4. Chart Data Analysis:');
        
        // Check studentsByProgram
        const studentsByProgram = data.charts.studentsByProgram;
        console.log('   studentsByProgram type:', typeof studentsByProgram);
        console.log('   studentsByProgram is array:', Array.isArray(studentsByProgram));
        console.log('   studentsByProgram length:', studentsByProgram?.length || 'UNDEFINED');
        console.log('   studentsByProgram value:', studentsByProgram);
        
        // Check paymentsByStatus
        const paymentsByStatus = data.charts.paymentsByStatus;
        console.log('   paymentsByStatus type:', typeof paymentsByStatus);
        console.log('   paymentsByStatus is array:', Array.isArray(paymentsByStatus));
        console.log('   paymentsByStatus length:', paymentsByStatus?.length || 'UNDEFINED');
        console.log('   paymentsByStatus value:', paymentsByStatus);
        
        // Check registrationsByStatus
        const registrationsByStatus = data.charts.registrationsByStatus;
        console.log('   registrationsByStatus type:', typeof registrationsByStatus);
        console.log('   registrationsByStatus is array:', Array.isArray(registrationsByStatus));
        console.log('   registrationsByStatus length:', registrationsByStatus?.length || 'UNDEFINED');
        console.log('   registrationsByStatus value:', registrationsByStatus);
      } else {
        console.log('   ERROR: No charts object found in analytics response');
      }
      
      // Simulate frontend debug info
      console.log('\n5. Frontend Debug Info Simulation:');
      const frontendDebug = {
        analyticsLoaded: Object.keys(data).length > 0,
        chartsAvailable: data.charts ? Object.keys(data.charts).length : 0,
        studentsByProgramCount: data.charts?.studentsByProgram?.length || 0,
        paymentsByStatusCount: data.charts?.paymentsByStatus?.length || 0,
        registrationsByStatusCount: data.charts?.registrationsByStatus?.length || 0
      };
      
      console.log('   Analytics loaded:', frontendDebug.analyticsLoaded ? 'YES' : 'NO');
      console.log('   Charts available:', frontendDebug.chartsAvailable);
      console.log('   Students by program:', frontendDebug.studentsByProgramCount, 'items');
      console.log('   Payments by status:', frontendDebug.paymentsByStatusCount, 'items');
      console.log('   Registrations by status:', frontendDebug.registrationsByStatusCount, 'items');
      
    } else {
      console.log('   Analytics API failed:', analyticsResponse.status, analyticsResponse.data);
    }

    console.log('\nAnalytics Debug Complete!');

  } catch (error) {
    console.error('Error debugging analytics:', error.message);
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

testAnalyticsDebug();
