// Test subjects API directly and check available students
const http = require('http');

async function testSubjectsAPIDirect() {
  console.log('Testing Subjects API Direct\n');
  console.log('==========================\n');

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
      return;
    }
    console.log('   Backend server: RUNNING');

    // Step 2: Test subjects API without authentication
    console.log('\n2. TESTING SUBJECTS API WITHOUT AUTH...');
    
    const subjectsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/subjects/available',
      method: 'GET'
    });

    console.log('   Subjects API status:', subjectsResponse.status);
    console.log('   Response:', subjectsResponse.data);

    // Step 3: Test admin login and check subjects
    console.log('\n3. TESTING ADMIN LOGIN AND SUBJECTS...');
    
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
      console.log('   Admin login: SUCCESS');
      const adminToken = adminLogin.data.token;
      
      // Test admin subjects endpoint
      const adminSubjectsResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/subjects',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      console.log('   Admin subjects API:', adminSubjectsResponse.status);
      if (adminSubjectsResponse.status === 200) {
        console.log('   Total subjects in database:', adminSubjectsResponse.data.length);
        if (adminSubjectsResponse.data.length > 0) {
          console.log('   Sample subjects:');
          adminSubjectsResponse.data.slice(0, 5).forEach((subject, i) => {
            console.log(`     ${i + 1}. ${subject.subjectName} (${subject.subjectCode})`);
            console.log(`        Program: ${subject.program}, Semester: ${subject.semester}, Type: ${subject.type}`);
          });
        } else {
          console.log('   NO SUBJECTS FOUND IN DATABASE');
          console.log('   This is likely the issue - admin needs to upload subjects');
        }
      } else {
        console.log('   Admin subjects API failed:', adminSubjectsResponse.data);
      }
    } else {
      console.log('   Admin login failed:', adminLogin.data);
    }

    // Step 4: Check available students
    console.log('\n4. CHECKING AVAILABLE STUDENTS...');
    
    const studentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminLogin.status === 200 ? adminLogin.data.token : ''}` }
    });

    if (studentsResponse.status === 200) {
      console.log('   Available students:', studentsResponse.data.length);
      if (studentsResponse.data.length > 0) {
        console.log('   Sample students:');
        studentsResponse.data.slice(0, 3).forEach((student, i) => {
          console.log(`     ${i + 1}. ${student.name} (${student.rollNo})`);
          console.log(`        Program: ${student.program}, Semester: ${student.semester}`);
        });
      }
    } else {
      console.log('   Students API failed:', studentsResponse.data);
    }

    // Step 5: Test with a student if available
    if (studentsResponse.status === 200 && studentsResponse.data.length > 0) {
      console.log('\n5. TESTING WITH AVAILABLE STUDENT...');
      
      const testStudent = studentsResponse.data[0];
      console.log('   Testing with student:', testStudent.name);
      
      // Try student login
      const studentLogin = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/student/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        rollNo: testStudent.rollNo,
        password: 'Student@123'
      });

      console.log('   Student login status:', studentLogin.status);
      if (studentLogin.status === 200) {
        const studentToken = studentLogin.data.token;
        
        // Test subjects API with student token
        const studentSubjectsResponse = await makeRequest({
          hostname: 'localhost',
          port: 5000,
          path: '/api/subjects/available',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${studentToken}` }
        });

        console.log('   Student subjects API:', studentSubjectsResponse.status);
        if (studentSubjectsResponse.status === 200) {
          console.log('   Student subjects response:', studentSubjectsResponse.data);
        }
      } else {
        console.log('   Student login failed:', studentLogin.data);
        console.log('   Trying default password...');
        
        const studentLoginAlt = await makeRequest({
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/student/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, {
          rollNo: testStudent.rollNo,
          password: testStudent.rollNo // Try roll number as password
        });

        console.log('   Student login with rollNo password:', studentLoginAlt.status);
      }
    }

    // Step 6: Analysis and recommendations
    console.log('\n6. ANALYSIS AND RECOMMENDATIONS...');
    
    if (adminSubjectsResponse.status === 200 && adminSubjectsResponse.data.length === 0) {
      console.log('   ISSUE: No subjects in database');
      console.log('   SOLUTION: Admin needs to upload subjects');
      console.log('   STEPS:');
      console.log('   1. Login as admin (ADMIN001 / Admin@123)');
      console.log('   2. Go to admin dashboard');
      console.log('   3. Navigate to Manage Students section');
      console.log('   4. Upload subjects for each program and semester');
      console.log('   5. Ensure subjects have proper program and semester mapping');
    } else if (adminSubjectsResponse.status === 200 && adminSubjectsResponse.data.length > 0) {
      console.log('   Subjects exist in database');
      console.log('   Issue might be with API endpoint or filtering logic');
      console.log('   Check if /api/subjects/available endpoint exists and works');
    }

    console.log('\nSubjects API Direct Test Complete!');
    console.log('==========================\n');

  } catch (error) {
    console.error('Error testing subjects API direct:', error.message);
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

testSubjectsAPIDirect();
