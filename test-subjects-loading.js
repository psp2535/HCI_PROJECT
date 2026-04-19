// Test subjects loading issue in semester registration portal
const http = require('http');

async function testSubjectsLoading() {
  console.log('Testing Subjects Loading Issue\n');
  console.log('=================================\n');

  try {
    // Step 1: Check servers
    console.log('1. CHECKING SERVERS...');
    
    const frontendCheck = await makeRequest({
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET'
    });
    
    if (frontendCheck.status !== 200) {
      console.log('   Frontend server: NOT RUNNING');
      console.log('   SOLUTION: Start frontend with: npm run dev');
      return;
    }
    console.log('   Frontend server: RUNNING');

    const backendCheck = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    
    if (backendCheck.status !== 200) {
      console.log('   Backend server: NOT RUNNING');
      console.log('   SOLUTION: Start backend with: npm run server');
      return;
    }
    console.log('   Backend server: RUNNING');

    // Step 2: Test student login
    console.log('\n2. TESTING STUDENT LOGIN...');
    
    const studentLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/student/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      rollNo: 'STU001',
      password: 'Student@123'
    });

    if (studentLogin.status !== 200) {
      console.log('   Student login failed:', studentLogin.status);
      console.log('   Trying alternative credentials...');
      
      // Try with different student credentials
      const altLogin = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/student/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        rollNo: '2023001',
        password: 'Student@123'
      });
      
      if (altLogin.status !== 200) {
        console.log('   All student login attempts failed');
        return;
      }
      
      console.log('   Student login: SUCCESS (alternative credentials)');
      var studentToken = altLogin.data.token;
      var studentUser = altLogin.data.user;
    } else {
      console.log('   Student login: SUCCESS');
      var studentToken = studentLogin.data.token;
      var studentUser = studentLogin.data.user;
    }

    console.log('   Student:', studentUser.name);
    console.log('   Program:', studentUser.program);
    console.log('   Semester:', studentUser.semester);

    // Step 3: Test subjects API endpoint
    console.log('\n3. TESTING SUBJECTS API ENDPOINT...');
    
    const subjectsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/subjects/available',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    console.log('   Subjects API status:', subjectsResponse.status);
    
    if (subjectsResponse.status === 200) {
      console.log('   Subjects API: SUCCESS');
      console.log('   Response type:', typeof subjectsResponse.data);
      console.log('   Response keys:', Object.keys(subjectsResponse.data));
      
      if (subjectsResponse.data.allSubjects) {
        console.log('   All subjects count:', subjectsResponse.data.allSubjects.length);
        console.log('   Sample subjects:');
        subjectsResponse.data.allSubjects.slice(0, 3).forEach((subject, i) => {
          console.log(`     ${i + 1}. ${subject.subjectName} (${subject.subjectCode}) - ${subject.type}`);
        });
      } else {
        console.log('   ERROR: allSubjects property not found in response');
        console.log('   Response data:', subjectsResponse.data);
      }
    } else {
      console.log('   Subjects API: FAILED');
      console.log('   Error:', subjectsResponse.data);
    }

    // Step 4: Test student registration status
    console.log('\n4. TESTING STUDENT REGISTRATION STATUS...');
    
    const registrationResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/registration-status',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    console.log('   Registration status:', registrationResponse.status);
    if (registrationResponse.status === 200) {
      console.log('   Registration data:', registrationResponse.data);
    } else {
      console.log('   Registration status failed:', registrationResponse.data);
    }

    // Step 5: Test admin subjects endpoint
    console.log('\n5. TESTING ADMIN SUBJECTS ENDPOINT...');
    
    // Login as admin
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
      const adminToken = adminLogin.data.token;
      
      const adminSubjectsResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/subjects',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      console.log('   Admin subjects API:', adminSubjectsResponse.status);
      if (adminSubjectsResponse.status === 200) {
        console.log('   Admin subjects count:', adminSubjectsResponse.data.length);
        console.log('   Sample admin subjects:');
        adminSubjectsResponse.data.slice(0, 3).forEach((subject, i) => {
          console.log(`     ${i + 1}. ${subject.subjectName} (${subject.subjectCode}) - ${subject.type}`);
        });
      }
    }

    // Step 6: Expected behavior analysis
    console.log('\n6. EXPECTED BEHAVIOR ANALYSIS...');
    console.log('   Frontend expects:');
    console.log('   - GET /api/subjects/available to return { allSubjects: [...] }');
    console.log('   - Subjects should have: _id, subjectCode, subjectName, type, credits, ltp');
    console.log('   - Subjects should be filtered by student program and semester');
    console.log('   - Core subjects should be auto-selected');
    console.log('   - Elective subjects should be selectable');

    // Step 7: Troubleshooting guide
    console.log('\n7. TROUBLESHOOTING GUIDE...');
    console.log('   If no subjects are showing:');
    console.log('   a) Check if /api/subjects/available exists and works');
    console.log('   b) Verify admin has uploaded subjects for the student\'s program/semester');
    console.log('   c) Check if subjects are properly filtered by program and semester');
    console.log('   d) Verify the response structure matches frontend expectations');
    console.log('   e) Check browser console for JavaScript errors');
    console.log('   f) Look at network tab for API call failures');

    console.log('\nSubjects Loading Test Complete!');
    console.log('=================================\n');

  } catch (error) {
    console.error('Error testing subjects loading:', error.message);
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

testSubjectsLoading();
