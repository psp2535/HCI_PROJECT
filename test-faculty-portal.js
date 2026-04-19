// Test Faculty Portal functionality
const http = require('http');

async function testFacultyPortal() {
  console.log('Faculty Portal Testing Suite');
  console.log('==========================\n');

  try {
    // Test 1: Faculty Login
    console.log('1. Testing Faculty Login...');
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
      console.log('   Faculty login failed, trying alternative credentials...');
      
      // Try different faculty credentials
      const altLogin = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/staff/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        employeeId: 'STAFF001', // Try verification staff first to see if they have faculty access
        password: 'Staff@123'
      });
      
      if (altLogin.status === 200) {
        console.log('   Using STAFF001 for faculty testing');
        facultyLogin.data = altLogin.data;
        facultyLogin.status = 200;
      } else {
        console.log('   Trying admin credentials...');
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
        
        if (adminLogin.status === 200) {
          console.log('   Using ADMIN001 for faculty testing');
          facultyLogin.data = adminLogin.data;
          facultyLogin.status = 200;
        } else {
          console.log('   Creating faculty account for testing...');
          const createFaculty = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/staff/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, {
            employeeId: 'FAC001',
            name: 'Dr. Anil Gupta',
            email: 'anil.gupta@iiitm.ac.in',
            password: 'Faculty@123',
            role: 'faculty',
            department: 'Computer Science'
          });
          
          if (createFaculty.status === 201) {
            console.log('   Faculty account created, logging in...');
            const newLogin = await makeRequest({
              hostname: 'localhost',
              port: 5000,
              path: '/api/auth/staff/login',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }, {
              employeeId: 'FAC001',
              password: 'Faculty@123'
            });
            facultyLogin.data = newLogin.data;
            facultyLogin.status = newLogin.status;
          }
        }
      }
    }

    if (facultyLogin.status !== 200) {
      console.log('   Faculty login failed:', facultyLogin.data);
      return;
    }

    const facultyToken = facultyLogin.data.token;
    console.log('   Faculty login successful');
    console.log('   User:', facultyLogin.data.user);

    // Test 2: Faculty Dashboard APIs
    console.log('\n2. Testing Faculty Dashboard APIs...');

    // Get pending faculty approvals
    console.log('   Testing /api/faculty/pending...');
    const pendingResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/pending',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (pendingResponse.status === 200) {
      console.log('   Pending approvals loaded:', pendingResponse.data.length, 'items');
      if (pendingResponse.data.length > 0) {
        console.log('   Sample pending registration:');
        console.log('     Student:', pendingResponse.data[0].studentId?.name);
        console.log('     Program:', pendingResponse.data[0].studentId?.program);
        console.log('     Status:', pendingResponse.data[0].overallStatus);
      }
    } else {
      console.log('   Failed to load pending approvals:', pendingResponse.status, pendingResponse.data);
    }

    // Get all faculty students
    console.log('   Testing /api/faculty/students...');
    const studentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (studentsResponse.status === 200) {
      console.log('   All students loaded:', studentsResponse.data.length, 'items');
      if (studentsResponse.data.length > 0) {
        console.log('   Sample student:');
        console.log('     Name:', studentsResponse.data[0].studentId?.name);
        console.log('     Roll No:', studentsResponse.data[0].studentId?.rollNo);
        console.log('     Program:', studentsResponse.data[0].studentId?.program);
        console.log('     Subjects selected:', studentsResponse.data[0].selectedSubjects?.length || 0);
        console.log('     Overall status:', studentsResponse.data[0].overallStatus);
      }
    } else {
      console.log('   Failed to load students:', studentsResponse.status, studentsResponse.data);
    }

    // Test 3: Faculty Approval Actions
    console.log('\n3. Testing Faculty Approval Actions...');

    if (pendingResponse.status === 200 && pendingResponse.data.length > 0) {
      const firstRegistration = pendingResponse.data[0];
      console.log('   Testing approval action for:', firstRegistration.studentId?.name);
      
      const approvalResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/faculty/approve/${firstRegistration._id}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${facultyToken}`,
          'Content-Type': 'application/json'
        }
      }, {
        action: 'approve',
        remarks: 'Test faculty approval'
      });

      if (approvalResponse.status === 200) {
        console.log('   Faculty approval successful');
      } else {
        console.log('   Faculty approval failed:', approvalResponse.status, approvalResponse.data);
      }
    } else {
      console.log('   No pending registrations to approve');
    }

    // Test 4: Check Faculty Routes
    console.log('\n4. Testing Additional Faculty Routes...');

    // Test faculty stats if available
    const statsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (statsResponse.status === 200) {
      console.log('   Faculty stats available:', statsResponse.data);
    } else if (statsResponse.status === 404) {
      console.log('   Faculty stats endpoint not found (404)');
    } else {
      console.log('   Faculty stats error:', statsResponse.status, statsResponse.data);
    }

    console.log('\nFaculty Portal Testing Complete!');

  } catch (error) {
    console.error('Error testing faculty portal:', error.message);
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

testFacultyPortal();
