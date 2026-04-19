// Test subjects loading after seeding
const http = require('http');

async function testSubjectsAfterSeeding() {
  console.log('Testing Subjects Loading After Seeding\n');
  console.log('====================================\n');

  try {
    // Step 1: Login as admin to verify subjects
    console.log('1. VERIFYING SUBJECTS IN DATABASE...');
    
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
    console.log('   Admin login: SUCCESS');

    // Get subjects by program and semester
    const subjectsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/subjects?program=IMT&semester=1',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('   IMT Semester 1 subjects:', subjectsResponse.status);
    if (subjectsResponse.status === 200) {
      const subjects = subjectsResponse.data.subjects || subjectsResponse.data;
      console.log('   Found', subjects.length, 'subjects for IMT Semester 1');
      subjects.slice(0, 3).forEach((subject, i) => {
        console.log(`     ${i + 1}. ${subject.subjectName} (${subject.subjectCode}) - ${subject.credits} credits`);
      });
    }

    // Step 2: Create a test student or use existing one
    console.log('\n2. TESTING STUDENT SUBJECT ACCESS...');
    
    // Get students to find one with subjects
    const studentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (studentsResponse.status === 200) {
      const students = studentsResponse.data;
      const imtSemester1Student = students.find(s => s.program === 'IMT' && s.semester === 1);
      
      if (imtSemester1Student) {
        console.log('   Found IMT Semester 1 student:', imtSemester1Student.name);
        
        // Try to login as this student (using default password)
        const studentLogin = await makeRequest({
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/student/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, {
          rollNo: imtSemester1Student.rollNo,
          password: imtSemester1Student.rollNo // Try roll number as password
        });

        if (studentLogin.status === 200) {
          console.log('   Student login: SUCCESS');
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
            if (studentSubjectsResponse.data.allSubjects) {
              console.log('   Subjects available for student:', studentSubjectsResponse.data.allSubjects.length);
              studentSubjectsResponse.data.allSubjects.slice(0, 3).forEach((subject, i) => {
                console.log(`     ${i + 1}. ${subject.subjectName} (${subject.subjectCode})`);
              });
            }
          }
        } else {
          console.log('   Student login failed, trying default password...');
          
          const studentLoginAlt = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/student/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, {
            rollNo: imtSemester1Student.rollNo,
            password: 'Student@123'
          });

          console.log('   Student login with default password:', studentLoginAlt.status);
        }
      } else {
        console.log('   No IMT Semester 1 student found');
      }
    }

    // Step 3: Test the subjects API endpoint directly
    console.log('\n3. TESTING SUBJECTS API ENDPOINT...');
    
    // Check if the subjects/available endpoint exists
    const directSubjectsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/subjects/available',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('   Direct subjects API:', directSubjectsResponse.status);
    console.log('   Response:', directSubjectsResponse.data);

    // Step 4: Expected behavior analysis
    console.log('\n4. EXPECTED BEHAVIOR ANALYSIS...');
    console.log('   After seeding:');
    console.log('   - Students should see subjects in Subject Selection page');
    console.log('   - Core subjects should be auto-selected');
    console.log('   - Elective subjects should be selectable');
    console.log('   - Credit counter should work properly');

    // Step 5: Testing instructions for user
    console.log('\n5. TESTING INSTRUCTIONS FOR USER...');
    console.log('   To test the Subject Selection page:');
    console.log('   1. Open browser and go to: http://localhost:5173/login');
    console.log('   2. Login as a student with IMT program, Semester 1');
    console.log('   3. Navigate to: http://localhost:5173/student/subjects');
    console.log('   4. Should see subjects listed now');
    console.log('   5. Core subjects should be auto-enrolled');
    console.log('   6. Should be able to select electives');

    console.log('\nSubjects After Seeding Test Complete!');
    console.log('====================================\n');

  } catch (error) {
    console.error('Error testing subjects after seeding:', error.message);
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

testSubjectsAfterSeeding();
