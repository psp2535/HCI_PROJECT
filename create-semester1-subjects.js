// Direct script to create Semester 1 subjects for all programs
const http = require('http');

async function createSemester1Subjects() {
  console.log('Creating Semester 1 Subjects for All Programs\n');
  console.log('============================================\n');

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

    // Step 2: Create Semester 1 subjects for all programs
    console.log('\n2. CREATING SEMESTER 1 SUBJECTS...');
    
    const SEMESTER_1_SUBJECTS = {
      'IMT': [
        { subjectCode: 'MA101', subjectName: 'Mathematics I', ltp: '3-1-0', credits: 4, type: 'core' },
        { subjectCode: 'PH101', subjectName: 'Physics I', ltp: '3-0-2', credits: 4, type: 'core' },
        { subjectCode: 'CH101', subjectName: 'Chemistry I', ltp: '3-0-2', credits: 4, type: 'core' },
        { subjectCode: 'CS101', subjectName: 'Programming Fundamentals', ltp: '3-1-0', credits: 4, type: 'core' },
        { subjectCode: 'EE101', subjectName: 'Basic Electrical Engineering', ltp: '3-0-2', credits: 4, type: 'core' },
        { subjectCode: 'ME101', subjectName: 'Basic Mechanical Engineering', ltp: '3-0-2', credits: 4, type: 'core' },
        { subjectCode: 'HS101', subjectName: 'Communication Skills', ltp: '2-0-2', credits: 3, type: 'core' },
        { subjectCode: 'ES101', subjectName: 'Engineering Workshop', ltp: '0-0-3', credits: 2, type: 'core' }
      ],
      'BCS': [
        { subjectCode: 'BCS101', subjectName: 'Introduction to Computer Science', ltp: '3-1-0', credits: 4, type: 'core' },
        { subjectCode: 'BCS102', subjectName: 'Digital Logic', ltp: '3-0-2', credits: 4, type: 'core' },
        { subjectCode: 'MA101', subjectName: 'Mathematics I', ltp: '3-1-0', credits: 4, type: 'core' },
        { subjectCode: 'PH101', subjectName: 'Physics I', ltp: '3-0-2', credits: 4, type: 'core' },
        { subjectCode: 'CS101', subjectName: 'Programming Fundamentals', ltp: '3-1-0', credits: 4, type: 'core' },
        { subjectCode: 'HS101', subjectName: 'Communication Skills', ltp: '2-0-2', credits: 3, type: 'core' }
      ],
      'BEE': [
        { subjectCode: 'BEE101', subjectName: 'Basic Electrical Engineering', ltp: '3-0-2', credits: 4, type: 'core' },
        { subjectCode: 'BEE102', subjectName: 'Circuit Analysis', ltp: '3-1-0', credits: 4, type: 'core' },
        { subjectCode: 'MA101', subjectName: 'Mathematics I', ltp: '3-1-0', credits: 4, type: 'core' },
        { subjectCode: 'PH101', subjectName: 'Physics I', ltp: '3-0-2', credits: 4, type: 'core' },
        { subjectCode: 'CS101', subjectName: 'Programming Fundamentals', ltp: '3-1-0', credits: 4, type: 'core' },
        { subjectCode: 'ME101', subjectName: 'Basic Mechanical Engineering', ltp: '3-0-2', credits: 4, type: 'core' }
      ]
    };

    // Since we don't have a direct API to create subjects, let's try to use the upload endpoint
    // or create a custom endpoint. For now, let's try to use the existing seed mechanism
    
    console.log('   Subjects to create:');
    Object.keys(SEMESTER_1_SUBJECTS).forEach(program => {
      console.log(`     ${program} Semester 1: ${SEMESTER_1_SUBJECTS[program].length} subjects`);
    });

    // Step 3: Try to use the existing seed mechanism with custom data
    console.log('\n3. ATTEMPTING TO CREATE SUBJECTS...');
    
    // Let's try to create subjects by making a POST request to a subjects endpoint
    // We'll try different endpoints that might exist
    
    const programs = ['IMT', 'BCS', 'BEE'];
    let totalCreated = 0;

    for (const program of programs) {
      const subjects = SEMESTER_1_SUBJECTS[program];
      
      for (const subject of subjects) {
        const subjectData = {
          ...subject,
          program,
          semester: 1,
          batch: 2025,
          academicYear: '2025-26'
        };

        // Try to create subject via admin endpoint
        try {
          const createResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/admin/subjects',
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            },
            data: subjectData
          });

          if (createResponse.status === 201 || createResponse.status === 200) {
            console.log(`   Created: ${subject.subjectName} (${subject.subjectCode})`);
            totalCreated++;
          } else {
            console.log(`   Failed to create ${subject.subjectCode}: ${createResponse.status}`);
          }
        } catch (error) {
          console.log(`   Error creating ${subject.subjectCode}: ${error.message}`);
        }
      }
    }

    console.log(`   Total subjects created: ${totalCreated}`);

    // Step 4: Verify the subjects were created
    console.log('\n4. VERIFYING CREATED SUBJECTS...');
    
    for (const program of programs) {
      const verifyResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/subjects?program=${program}&semester=1`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (verifyResponse.status === 200) {
        const subjects = verifyResponse.data.subjects || verifyResponse.data;
        console.log(`   ${program} Semester 1: ${subjects.length} subjects`);
        
        if (subjects.length > 0) {
          subjects.slice(0, 3).forEach((subject, i) => {
            console.log(`     ${i + 1}. ${subject.subjectName} (${subject.subjectCode})`);
          });
        }
      }
    }

    // Step 5: Test student access
    console.log('\n5. TESTING STUDENT ACCESS...');
    
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
      const imtStudent = students.find(s => s.program === 'IMT' && s.semester === 1);
      
      if (imtStudent) {
        console.log(`   Found IMT Semester 1 student: ${imtStudent.name} (${imtStudent.rollNo})`);
        
        // Try student login
        const studentLogin = await makeRequest({
          hostname: 'localhost',
          port: 5000,
          path: '/api/auth/student/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, {
          rollNo: imtStudent.rollNo,
          password: imtStudent.rollNo // Try roll number as password
        });

        if (studentLogin.status === 200) {
          console.log('   Student login: SUCCESS');
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
              console.log('   Subjects available for student:', subjectsResponse.data.allSubjects.length);
            }
          }
        } else {
          console.log('   Student login failed');
        }
      }
    }

    // Step 6: Final summary
    console.log('\n6. FINAL SUMMARY...');
    
    const finalCheck = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/subjects',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (finalCheck.status === 200) {
      const allSubjects = finalCheck.data.subjects || finalCheck.data;
      const semester1Subjects = allSubjects.filter(s => s.semester === 1);
      
      console.log('   Total subjects in database:', allSubjects.length);
      console.log('   Semester 1 subjects:', semester1Subjects.length);
      
      const semester1ByProgram = {};
      semester1Subjects.forEach(subject => {
        if (!semester1ByProgram[subject.program]) {
          semester1ByProgram[subject.program] = 0;
        }
        semester1ByProgram[subject.program]++;
      });
      
      console.log('   Semester 1 subjects by program:');
      Object.keys(semester1ByProgram).forEach(program => {
        console.log(`     ${program}: ${semester1ByProgram[program]} subjects`);
      });
      
      if (semester1Subjects.length > 0) {
        console.log('\n   SUCCESS: Semester 1 subjects are now available!');
        console.log('   Students should be able to see subjects in the Subject Selection page.');
      } else {
        console.log('\n   ISSUE: Semester 1 subjects still missing');
        console.log('   Manual database intervention may be required.');
      }
    }

    console.log('\nSemester 1 Subjects Creation Complete!');
    console.log('============================================\n');

  } catch (error) {
    console.error('Error creating Semester 1 subjects:', error.message);
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

createSemester1Subjects();
