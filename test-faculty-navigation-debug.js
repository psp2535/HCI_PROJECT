// Debug faculty portal navigation functionality
const http = require('http');

async function testFacultyNavigationDebug() {
  console.log('Debugging Faculty Portal Navigation\n');

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

    // Test faculty dashboard data
    console.log('\n2. Testing Faculty Dashboard Data...');
    const dashboardResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (dashboardResponse.status === 200) {
      console.log('   Dashboard data loaded successfully');
      console.log(`   Students: ${dashboardResponse.data.length}`);
      console.log('   This should show: Dashboard view with student registrations');
    }

    // Test faculty course registrations
    console.log('\n3. Testing Faculty Course Registrations...');
    const coursesResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/course-registrations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (coursesResponse.status === 200) {
      console.log('   Course registrations loaded successfully');
      console.log(`   Registrations: ${coursesResponse.data.registrations?.length || 0}`);
      console.log(`   Subject groups: ${coursesResponse.data.subjectGroups?.length || 0}`);
      console.log('   This should show: Course Registrations view with subject-wise lists');
    }

    // Test faculty stats
    console.log('\n4. Testing Faculty Stats...');
    const statsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (statsResponse.status === 200) {
      console.log('   Stats loaded successfully');
      console.log('   Dashboard stats should show:');
      console.log(`     Pending: ${statsResponse.data.pending || 0}`);
      console.log(`     Approved: ${statsResponse.data.approved || 0}`);
      console.log(`     Rejected: ${statsResponse.data.rejected || 0}`);
    }

    console.log('\n5. Expected Frontend Behavior:');
    console.log('   Faculty portal should have:');
    console.log('   - Tab navigation between "Student Registrations" and "Course Registrations"');
    console.log('   - URL-based routing (/faculty/dashboard vs /faculty/students vs /faculty/courses)');
    console.log('   - Different content based on active tab');
    console.log('   - Proper state management for active section');

    console.log('\n6. Troubleshooting:');
    console.log('   If navigation is not working:');
    console.log('   - Check browser console for JavaScript errors');
    console.log('   - Verify route switching logic in FacultyDashboard component');
    console.log('   - Check if useLocation and useNavigate hooks are working');
    console.log('   - Verify useEffect for route-based section switching');

    console.log('\nFaculty Navigation Debug Complete!');

  } catch (error) {
    console.error('Error debugging faculty navigation:', error.message);
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

testFacultyNavigationDebug();
