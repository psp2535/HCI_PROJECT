// Test Admin Portal navigation functionality
const http = require('http');

async function testAdminNavigation() {
  console.log('Testing Admin Portal Navigation\n');

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

    // Test admin dashboard data
    console.log('\n2. Testing Admin Dashboard (/admin/dashboard)...');
    const dashboardResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (dashboardResponse.status === 200) {
      console.log('   Dashboard stats loaded successfully');
      console.log('   This should show: Dashboard view with stats and charts');
    }

    // Test manage students
    console.log('\n3. Testing Manage Students (/admin/students)...');
    const studentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (studentsResponse.status === 200) {
      console.log(`   Students loaded: ${studentsResponse.data.length} students`);
      console.log('   This should show: Manage Students page with student list');
    }

    // Test manage staff
    console.log('\n4. Testing Manage Staff (/admin/staff)...');
    const staffResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/staff',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (staffResponse.status === 200) {
      console.log(`   Staff loaded: ${staffResponse.data.length} staff members`);
      console.log('   This should show: Manage Staff page with staff list');
    }

    // Test all registrations
    console.log('\n5. Testing All Registrations (/admin/registrations)...');
    const registrationsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/registrations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (registrationsResponse.status === 200) {
      console.log(`   Registrations loaded: ${registrationsResponse.data.length} registrations`);
      console.log('   This should show: All Registrations page with registration list');
    }

    // Test analytics
    console.log('\n6. Testing Analytics (/admin/analytics)...');
    const analyticsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/analytics',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (analyticsResponse.status === 200) {
      console.log('   Analytics loaded successfully');
      console.log('   This should show: Analytics page with charts and graphs');
      console.log(`     Charts available: ${Object.keys(analyticsResponse.data.charts || {}).length}`);
    }

    console.log('\nAdmin Portal Navigation Test Complete!');
    console.log('\nExpected Behavior:');
    console.log('1. /admin/dashboard -> Shows Dashboard view with stats and charts');
    console.log('2. /admin/students -> Shows Manage Students page with student list');
    console.log('3. /admin/staff -> Shows Manage Staff page with staff list');
    console.log('4. /admin/registrations -> Shows All Registrations page');
    console.log('5. /admin/analytics -> Shows Analytics page with charts');
    console.log('\nNavigation should work between sections with proper URL updates.');

  } catch (error) {
    console.error('Error testing admin navigation:', error.message);
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

testAdminNavigation();
