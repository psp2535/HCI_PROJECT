// Test faculty portal navigation functionality
const http = require('http');

async function testFacultyNavigation() {
  console.log('Testing Faculty Portal Navigation\n');

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

    // Test faculty dashboard data (should show student approvals)
    console.log('\n2. Testing Faculty Dashboard (/faculty/dashboard)...');
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
      console.log('   This should show: Student Registrations tab');
    }

    // Test faculty students page (should show student registrations)
    console.log('\n3. Testing Student Registrations (/faculty/students)...');
    const studentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (studentsResponse.status === 200) {
      console.log('   Student registrations data loaded successfully');
      console.log(`   Students: ${studentsResponse.data.length}`);
      console.log('   This should show: Student Registrations tab with approval interface');
      
      // Check if there are any pending approvals
      const pending = studentsResponse.data.filter(r => 
        r.verificationStatus === 'approved' && r.facultyApprovalStatus === 'pending'
      );
      console.log(`   Pending approvals: ${pending.length}`);
    }

    // Test faculty courses page (should show course registrations)
    console.log('\n4. Testing Course Registrations (/faculty/courses)...');
    const coursesResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/course-registrations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (coursesResponse.status === 200) {
      console.log('   Course registrations data loaded successfully');
      console.log(`   Registrations: ${coursesResponse.data.registrations?.length || 0}`);
      console.log(`   Subject groups: ${coursesResponse.data.subjectGroups?.length || 0}`);
      console.log('   This should show: Course Registrations tab with subject-wise lists');
    }

    console.log('\nFaculty Portal Navigation Test Complete!');
    console.log('\nExpected Behavior:');
    console.log('1. /faculty/dashboard -> Shows Student Registrations tab (active)');
    console.log('2. /faculty/students -> Shows Student Registrations tab (active)');
    console.log('3. /faculty/courses -> Shows Course Registrations tab (active)');
    console.log('\nNavigation should work between tabs with proper URL updates.');

  } catch (error) {
    console.error('Error testing faculty navigation:', error.message);
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

testFacultyNavigation();
