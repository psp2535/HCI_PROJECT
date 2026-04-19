// Test the Semester 1 subjects fix
const http = require('http');

async function testSemester1Fix() {
  console.log('Testing Semester 1 Subjects Fix\n');
  console.log('===============================\n');

  try {
    // Step 1: Login as admin
    console.log('1. ADMIN LOGIN...');
    
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

    // Step 2: Run the seed demo to add Semester 1 subjects
    console.log('\n2. SEEDING SEMESTER 1 SUBJECTS...');
    
    const seedResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/seed-demo',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('   Seed demo status:', seedResponse.status);
    if (seedResponse.status === 200) {
      console.log('   Seed demo: SUCCESS');
      console.log('   Semester 1 subjects should now be added');
    } else {
      console.log('   Seed demo failed:', seedResponse.data);
    }

    // Step 3: Verify Semester 1 subjects were added
    console.log('\n3. VERIFYING SEMESTER 1 SUBJECTS...');
    
    const programs = ['IMT', 'BCS', 'BEE'];
    let totalSemester1Subjects = 0;

    for (const program of programs) {
      const subjectsResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/subjects?program=${program}&semester=1`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (subjectsResponse.status === 200) {
        const subjects = subjectsResponse.data.subjects || subjectsResponse.data;
        console.log(`   ${program} Semester 1: ${subjects.length} subjects`);
        totalSemester1Subjects += subjects.length;
        
        if (subjects.length > 0) {
          subjects.slice(0, 2).forEach((subject, i) => {
            console.log(`     ${i + 1}. ${subject.subjectName} (${subject.subjectCode})`);
          });
        }
      }
    }

    console.log(`   Total Semester 1 subjects: ${totalSemester1Subjects}`);

    // Step 4: Test student access to subjects
    console.log('\n4. TESTING STUDENT ACCESS...');
    
    // Get a student from IMT Semester 1
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
        console.log(`   Found IMT Semester 1 student: ${imtSemester1Student.name}`);
        
        // Try student login with different passwords
        const passwords = ['Student@123', imtSemester1Student.rollNo, 'password'];
        
        for (const password of passwords) {
          const studentLogin = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/student/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, {
            rollNo: imtSemester1Student.rollNo,
            password: password
          });

          if (studentLogin.status === 200) {
            console.log(`   Student login: SUCCESS with password: ${password}`);
            const studentToken = studentLogin.data.token;
            
            // Test subjects API
            const subjectsResponse = await makeRequest({
              hostname: 'localhost',
              port: 5000,
              path: '/api/subjects/available',
              method: 'GET',
              headers: { 'Authorization': `Bearer ${studentToken}` }
            });

            console.log('   Student subjects API:', subjectsResponse.status);
            if (subjectsResponse.status === 200) {
              console.log('   Student subjects response:', subjectsResponse.data);
              if (subjectsResponse.data.allSubjects) {
                console.log(`   Subjects available for student: ${subjectsResponse.data.allSubjects.length}`);
                
                if (subjectsResponse.data.allSubjects.length > 0) {
                  console.log('   Sample subjects:');
                  subjectsResponse.data.allSubjects.slice(0, 3).forEach((subject, i) => {
                    console.log(`     ${i + 1}. ${subject.subjectName} (${subject.subjectCode}) - ${subject.credits} credits`);
                  });
                  console.log('\n   SUCCESS: Student can now see subjects!');
                }
              }
            }
            break;
          } else {
            console.log(`   Student login failed with password: ${password}`);
          }
        }
      } else {
        console.log('   No IMT Semester 1 student found');
      }
    }

    // Step 5: Final verification
    console.log('\n5. FINAL VERIFICATION...');
    
    const finalSubjectsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/subjects',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (finalSubjectsResponse.status === 200) {
      const allSubjects = finalSubjectsResponse.data.subjects || finalSubjectsResponse.data;
      const semester1Subjects = allSubjects.filter(s => s.semester === 1);
      
      console.log('   Total subjects in database:', allSubjects.length);
      console.log('   Semester 1 subjects:', semester1Subjects.length);
      
      if (semester1Subjects.length > 0) {
        console.log('\n   SUCCESS: Semester 1 subjects are now available!');
        console.log('   Students should be able to see subjects in the Subject Selection page.');
        console.log('   The issue has been resolved.');
      } else {
        console.log('\n   ISSUE: Semester 1 subjects still missing');
        console.log('   Manual database intervention may be required.');
      }
    }

    // Step 6: Testing instructions for user
    console.log('\n6. TESTING INSTRUCTIONS FOR USER...');
    console.log('   To test the Subject Selection page:');
    console.log('   1. Open browser and go to: http://localhost:5173/login');
    console.log('   2. Login as a student with IMT program, Semester 1');
    console.log('   3. Navigate to: http://localhost:5173/student/subjects');
    console.log('   4. Should now see subjects listed');
    console.log('   5. Core subjects should be auto-enrolled');
    console.log('   6. Should be able to select electives if available');

    console.log('\nSemester 1 Fix Test Complete!');
    console.log('===============================\n');

  } catch (error) {
    console.error('Error testing Semester 1 fix:', error.message);
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

testSemester1Fix();
