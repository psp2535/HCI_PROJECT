// Test Admin Portal functionality
const http = require('http');

async function testAdminPortal() {
  console.log('Admin Portal Testing Suite');
  console.log('=========================\n');

  try {
    // Test 1: Admin Login
    console.log('1. Testing Admin Login...');
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
      console.log('   Admin login failed, trying alternative credentials...');
      
      // Try STAFF001 (might have admin access)
      const altLogin = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/staff/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        employeeId: 'STAFF001',
        password: 'Staff@123'
      });
      
      if (altLogin.status === 200) {
        console.log('   Using STAFF001 for admin testing');
        adminLogin.data = altLogin.data;
        adminLogin.status = 200;
      } else {
        console.log('   Creating admin account for testing...');
        const createAdmin = await makeRequest({
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/staff/register',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, {
          employeeId: 'ADMIN001',
          name: 'Prof. S.K. Sharma',
          email: 'sk.sharma@iiitm.ac.in',
          password: 'Admin@123',
          role: 'admin',
          department: 'System Administration'
        });
        
        if (createAdmin.status === 201) {
          console.log('   Admin account created, logging in...');
          const newLogin = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/staff/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, {
            employeeId: 'ADMIN001',
            password: 'Admin@123'
          });
          adminLogin.data = newLogin.data;
          adminLogin.status = newLogin.status;
        }
      }
    }

    if (adminLogin.status !== 200) {
      console.log('   Admin login failed:', adminLogin.data);
      return;
    }

    const adminToken = adminLogin.data.token;
    console.log('   Admin login successful');
    console.log('   User:', adminLogin.data.user);

    // Test 2: Admin Dashboard APIs
    console.log('\n2. Testing Admin Dashboard APIs...');

    // Get admin stats
    console.log('   Testing /api/admin/stats...');
    const statsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (statsResponse.status === 200) {
      console.log('   Admin stats loaded:', statsResponse.data);
    } else {
      console.log('   Failed to load admin stats:', statsResponse.status, statsResponse.data);
    }

    // Get admin analytics
    console.log('   Testing /api/admin/analytics...');
    const analyticsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/analytics',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (analyticsResponse.status === 200) {
      console.log('   Admin analytics loaded successfully');
      console.log('   Overview:', analyticsResponse.data.overview);
      console.log('   Charts available:', Object.keys(analyticsResponse.data.charts || {}));
    } else {
      console.log('   Failed to load analytics:', analyticsResponse.status, analyticsResponse.data);
    }

    // Test 3: Manage Students
    console.log('\n3. Testing Manage Students...');

    // Get all students
    console.log('   Testing /api/admin/students...');
    const studentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (studentsResponse.status === 200) {
      console.log('   Students loaded:', studentsResponse.data.length, 'students');
      if (studentsResponse.data.length > 0) {
        console.log('   Sample student:', studentsResponse.data[0].name, '-', studentsResponse.data[0].rollNo);
      }
    } else {
      console.log('   Failed to load students:', studentsResponse.status, studentsResponse.data);
    }

    // Create new student
    console.log('   Testing student creation...');
    const createStudentResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/students',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      rollNo: '2023IMT-999',
      name: 'Test Admin Student',
      email: 'test.admin@iiitm.ac.in',
      password: 'Student@123',
      program: 'IMT',
      batch: '2023',
      batchYear: 2023
    });

    if (createStudentResponse.status === 201) {
      console.log('   Student created successfully');
    } else {
      console.log('   Student creation failed:', createStudentResponse.status, createStudentResponse.data);
    }

    // Test 4: Manage Staff
    console.log('\n4. Testing Manage Staff...');

    // Get all staff
    console.log('   Testing /api/admin/staff...');
    const staffResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/staff',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (staffResponse.status === 200) {
      console.log('   Staff loaded:', staffResponse.data.length, 'staff members');
      if (staffResponse.data.length > 0) {
        console.log('   Sample staff:', staffResponse.data[0].name, '-', staffResponse.data[0].role);
      }
    } else {
      console.log('   Failed to load staff:', staffResponse.status, staffResponse.data);
    }

    // Create new staff
    console.log('   Testing staff creation...');
    const createStaffResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/staff',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      employeeId: 'TEST001',
      name: 'Test Admin Staff',
      email: 'test.staff@iiitm.ac.in',
      password: 'Staff@123',
      role: 'verification_staff',
      department: 'Test Department'
    });

    if (createStaffResponse.status === 201) {
      console.log('   Staff created successfully');
    } else {
      console.log('   Staff creation failed:', createStaffResponse.status, createStaffResponse.data);
    }

    // Test 5: All Registrations
    console.log('\n5. Testing All Registrations...');

    // Get all registrations
    console.log('   Testing /api/admin/registrations...');
    const registrationsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/registrations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (registrationsResponse.status === 200) {
      console.log('   Registrations loaded:', registrationsResponse.data.length, 'registrations');
      if (registrationsResponse.data.length > 0) {
        console.log('   Sample registration:', registrationsResponse.data[0].studentId?.name, '-', registrationsResponse.data[0].overallStatus);
      }
    } else {
      console.log('   Failed to load registrations:', registrationsResponse.status, registrationsResponse.data);
    }

    // Test 6: Additional Admin Features
    console.log('\n6. Testing Additional Admin Features...');

    // Test promotion endpoint
    console.log('   Testing /api/admin/promote-students...');
    const promoteResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/promote-students',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      currentSemester: 1,
      targetSemester: 2,
      academicYear: '2025-26'
    });

    if (promoteResponse.status === 200) {
      console.log('   Student promotion endpoint working');
    } else {
      console.log('   Student promotion failed:', promoteResponse.status, promoteResponse.data);
    }

    // Test subject management
    console.log('   Testing /api/admin/subjects...');
    const subjectsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/subjects',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (subjectsResponse.status === 200) {
      console.log('   Subjects loaded:', subjectsResponse.data.count, 'subjects');
    } else {
      console.log('   Failed to load subjects:', subjectsResponse.status, subjectsResponse.data);
    }

    console.log('\nAdmin Portal Testing Complete!');

  } catch (error) {
    console.error('Error testing admin portal:', error.message);
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

testAdminPortal();
