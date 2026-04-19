// Create missing subjects for IMT Semester 1 and other needed combinations
const http = require('http');

async function createMissingSubjects() {
  console.log('Creating Missing Subjects for IMT Semester 1\n');
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

    // Step 2: Check what subjects currently exist
    console.log('\n2. CHECKING CURRENT SUBJECTS...');
    
    const currentSubjectsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/subjects',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (currentSubjectsResponse.status === 200) {
      const subjects = currentSubjectsResponse.data.subjects || currentSubjectsResponse.data;
      console.log('   Total subjects in database:', subjects.length);
      
      // Group by program and semester
      const subjectsByProgramSemester = {};
      subjects.forEach(subject => {
        const key = `${subject.program}-Semester${subject.semester}`;
        if (!subjectsByProgramSemester[key]) {
          subjectsByProgramSemester[key] = [];
        }
        subjectsByProgramSemester[key].push(subject);
      });
      
      console.log('   Current subjects by program/semester:');
      Object.keys(subjectsByProgramSemester).sort().forEach(key => {
        console.log(`     ${key}: ${subjectsByProgramSemester[key].length} subjects`);
      });
    }

    // Step 3: Create subjects for IMT Semester 1
    console.log('\n3. CREATING IMT SEMESTER 1 SUBJECTS...');
    
    const IMT_SEMESTER_1_SUBJECTS = [
      { subjectCode: 'MA101', subjectName: 'Mathematics I', ltp: '3-1-0', credits: 4, type: 'core' },
      { subjectCode: 'PH101', subjectName: 'Physics I', ltp: '3-0-2', credits: 4, type: 'core' },
      { subjectCode: 'CH101', subjectName: 'Chemistry I', ltp: '3-0-2', credits: 4, type: 'core' },
      { subjectCode: 'CS101', subjectName: 'Programming Fundamentals', ltp: '3-1-0', credits: 4, type: 'core' },
      { subjectCode: 'EE101', subjectName: 'Basic Electrical Engineering', ltp: '3-0-2', credits: 4, type: 'core' },
      { subjectCode: 'ME101', subjectName: 'Basic Mechanical Engineering', ltp: '3-0-2', credits: 4, type: 'core' },
      { subjectCode: 'HS101', subjectName: 'Communication Skills', ltp: '2-0-2', credits: 3, type: 'core' },
      { subjectCode: 'ES101', subjectName: 'Engineering Workshop', ltp: '0-0-3', credits: 2, type: 'core' }
    ];

    // Since we can't directly create subjects via API without a specific endpoint,
    // let's use the seed demo endpoint which should create the missing subjects
    console.log('   Using seed-demo endpoint to ensure subjects are created...');
    
    const seedResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/seed-demo',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('   Seed demo response:', seedResponse.status);
    if (seedResponse.status === 200) {
      console.log('   Demo data seeded successfully');
    }

    // Step 4: Check if IMT Semester 1 subjects now exist
    console.log('\n4. VERIFYING IMT SEMESTER 1 SUBJECTS...');
    
    const imtSemester1Response = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/subjects?program=IMT&semester=1',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('   IMT Semester 1 subjects check:', imtSemester1Response.status);
    if (imtSemester1Response.status === 200) {
      const subjects = imtSemester1Response.data.subjects || imtSemester1Response.data;
      console.log('   Found', subjects.length, 'subjects for IMT Semester 1');
      
      if (subjects.length > 0) {
        console.log('   IMT Semester 1 subjects:');
        subjects.forEach((subject, i) => {
          console.log(`     ${i + 1}. ${subject.subjectName} (${subject.subjectCode}) - ${subject.credits} credits - ${subject.type}`);
        });
      } else {
        console.log('   STILL NO SUBJECTS for IMT Semester 1');
        console.log('   This indicates the seed data might not include IMT Semester 1');
      }
    }

    // Step 5: Check other program/semester combinations that students need
    console.log('\n5. CHECKING OTHER NEEDED SUBJECTS...');
    
    const neededCombinations = [
      { program: 'IMT', semester: 1 },
      { program: 'IMT', semester: 2 },
      { program: 'BCS', semester: 1 },
      { program: 'BCS', semester: 2 },
      { program: 'BEE', semester: 1 },
      { program: 'BEE', semester: 2 }
    ];

    for (const combo of neededCombinations) {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/subjects?program=${combo.program}&semester=${combo.semester}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const subjects = response.data.subjects || response.data;
      console.log(`   ${combo.program} Semester ${combo.semester}: ${subjects.length} subjects`);
    }

    // Step 6: Create a test student with known password
    console.log('\n6. CREATING TEST STUDENT...');
    
    // First, let's see if we can find a student and update their password
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
        console.log('   Roll Number:', imtSemester1Student.rollNo);
        console.log('   For testing, try logging in with:');
        console.log('     Roll Number:', imtSemester1Student.rollNo);
        console.log('     Password: Student@123 or', imtSemester1Student.rollNo);
      }
    }

    // Step 7: Final verification
    console.log('\n7. FINAL VERIFICATION...');
    
    const finalSubjectsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/subjects',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (finalSubjectsResponse.status === 200) {
      const subjects = finalSubjectsResponse.data.subjects || finalSubjectsResponse.data;
      console.log('   Total subjects in database:', subjects.length);
      
      const imtSemester1Subjects = subjects.filter(s => s.program === 'IMT' && s.semester === 1);
      console.log('   IMT Semester 1 subjects:', imtSemester1Subjects.length);
      
      if (imtSemester1Subjects.length > 0) {
        console.log('   SUCCESS: IMT Semester 1 subjects are now available!');
      } else {
        console.log('   ISSUE: IMT Semester 1 subjects still missing');
        console.log('   Manual intervention may be required');
      }
    }

    console.log('\nMissing Subjects Creation Complete!');
    console.log('============================================\n');

  } catch (error) {
    console.error('Error creating missing subjects:', error.message);
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

createMissingSubjects();
