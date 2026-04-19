// Complete test for faculty portal navigation with debugging
const http = require('http');

async function testFacultyNavigationComplete() {
  console.log('Complete Faculty Portal Navigation Test\n');

  try {
    // Login as faculty
    console.log('1. Faculty Login...');
    const facultyLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/staff/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      employeeId: 'FAC001',
      password: 'Faculty@123'
    });

    if (facultyLogin.status !== 200) {
      console.log('   Faculty login failed');
      return;
    }

    const facultyToken = facultyLogin.data.token;
    console.log('   Faculty login successful');

    // Test all faculty routes and data
    console.log('\n2. Testing Faculty Routes and Data...');

    // Test dashboard route data
    console.log('\n   Testing /faculty/dashboard data:');
    const dashboardResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (dashboardResponse.status === 200) {
      console.log('     Dashboard data: SUCCESS');
      console.log(`     Students: ${dashboardResponse.data.length}`);
      console.log('     Expected: Should show Student Registrations tab (approvals)');
    }

    // Test students route data
    console.log('\n   Testing /faculty/students data:');
    const studentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (studentsResponse.status === 200) {
      console.log('     Students data: SUCCESS');
      console.log(`     Students: ${studentsResponse.data.length}`);
      console.log('     Expected: Should show Student Registrations tab (approvals)');
    }

    // Test courses route data
    console.log('\n   Testing /faculty/courses data:');
    const coursesResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/course-registrations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (coursesResponse.status === 200) {
      console.log('     Courses data: SUCCESS');
      console.log(`     Registrations: ${coursesResponse.data.registrations?.length || 0}`);
      console.log(`     Subject groups: ${coursesResponse.data.subjectGroups?.length || 0}`);
      console.log('     Expected: Should show Course Registrations tab (courses)');
    }

    // Test faculty stats
    console.log('\n   Testing faculty stats:');
    const statsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (statsResponse.status === 200) {
      console.log('     Stats data: SUCCESS');
      console.log(`     Pending: ${statsResponse.data.pending || 0}`);
      console.log(`     Approved: ${statsResponse.data.approved || 0}`);
      console.log(`     Rejected: ${statsResponse.data.rejected || 0}`);
    }

    console.log('\n3. Frontend Behavior Analysis:');
    console.log('   Expected frontend behavior:');
    console.log('   - Tab navigation with "Student Registrations" and "Course Registrations"');
    console.log('   - URL-based routing: /faculty/dashboard -> approvals tab');
    console.log('   - URL-based routing: /faculty/students -> approvals tab');
    console.log('   - URL-based routing: /faculty/courses -> courses tab');
    console.log('   - Conditional rendering based on activeTab state');
    console.log('   - Tab click handlers should update URL and activeTab');

    console.log('\n4. Debugging Information:');
    console.log('   With debugging enabled, you should see in browser console:');
    console.log('   - "Current path: /faculty/..." messages');
    console.log('   - "Setting active tab based on path..." messages');
    console.log('   - "Student Registrations tab clicked" or "Course Registrations tab clicked"');
    console.log('   - "Rendering Student Approvals tab" or "Rendering Course Registrations tab"');

    console.log('\n5. Troubleshooting Steps:');
    console.log('   If navigation is still not working:');
    console.log('   1. Check browser console for debugging messages');
    console.log('   2. Verify the URL changes when clicking tabs');
    console.log('   3. Check if the activeTab state is updating');
    console.log('   4. Verify conditional rendering is working');
    console.log('   5. Check for JavaScript errors in browser console');

    console.log('\n6. Expected Test Results:');
    console.log('   - All API endpoints should return 200 status');
    console.log('   - Data should be available for both tabs');
    console.log('   - Frontend should switch between tabs correctly');
    console.log('   - URL should update when clicking tabs');
    console.log('   - Different content should display for each tab');

    console.log('\nFaculty Navigation Complete Test Finished!');

  } catch (error) {
    console.error('Error in faculty navigation test:', error.message);
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

testFacultyNavigationComplete();
