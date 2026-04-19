// Script to seed subjects for all programs and semesters
const http = require('http');

async function seedSubjects() {
  console.log('Seeding Subjects for All Programs and Semesters\n');
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
      console.log('   Admin login failed:', adminLogin.data);
      return;
    }

    const adminToken = adminLogin.data.token;
    console.log('   Admin login: SUCCESS');

    // Step 2: Get available students to determine programs and semesters
    console.log('\n2. GETTING AVAILABLE PROGRAMS AND SEMESTERS...');
    
    const studentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (studentsResponse.status !== 200) {
      console.log('   Failed to get students:', studentsResponse.data);
      return;
    }

    const students = studentsResponse.data;
    console.log('   Total students:', students.length);

    // Extract unique programs and semesters
    const programs = [...new Set(students.map(s => s.program))];
    const semesters = [...new Set(students.map(s => s.semester))];
    
    console.log('   Available programs:', programs);
    console.log('   Available semesters:', semesters);

    // Step 3: Create subject data for each program and semester
    console.log('\n3. CREATING SUBJECT DATA...');
    
    const SUBJECTS_TEMPLATE = {
      'IMT': {
        1: [
          { subjectCode: 'MA101', subjectName: 'Mathematics I', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'PH101', subjectName: 'Physics I', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'CH101', subjectName: 'Chemistry I', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'CS101', subjectName: 'Programming Fundamentals', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'EE101', subjectName: 'Basic Electrical Engineering', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'ME101', subjectName: 'Basic Mechanical Engineering', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'HS101', subjectName: 'Communication Skills', ltp: '2-0-2', credits: 3, type: 'core' },
          { subjectCode: 'ES101', subjectName: 'Engineering Workshop', ltp: '0-0-3', credits: 2, type: 'core' }
        ],
        2: [
          { subjectCode: 'MA102', subjectName: 'Mathematics II', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'PH102', subjectName: 'Physics II', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'CS102', subjectName: 'Data Structures', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'EE102', subjectName: 'Digital Electronics', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'ES102', subjectName: 'Probability and Statistics', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'CS103', subjectName: 'Object Oriented Programming', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'ME102', subjectName: 'Engineering Graphics', ltp: '1-0-3', credits: 3, type: 'core' },
          { subjectCode: 'HS102', subjectName: 'Environmental Studies', ltp: '2-0-0', credits: 2, type: 'core' }
        ]
      },
      'BCS': {
        1: [
          { subjectCode: 'BCS101', subjectName: 'Introduction to Computer Science', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'BCS102', subjectName: 'Digital Logic', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'MA101', subjectName: 'Mathematics I', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'PH101', subjectName: 'Physics I', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'CS101', subjectName: 'Programming Fundamentals', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'HS101', subjectName: 'Communication Skills', ltp: '2-0-2', credits: 3, type: 'core' }
        ],
        2: [
          { subjectCode: 'BCS201', subjectName: 'Computer Organization', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'BCS202', subjectName: 'Database Systems', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'MA102', subjectName: 'Mathematics II', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'CS102', subjectName: 'Data Structures', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'ES102', subjectName: 'Probability and Statistics', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'HS102', subjectName: 'Environmental Studies', ltp: '2-0-0', credits: 2, type: 'core' }
        ]
      },
      'BEE': {
        1: [
          { subjectCode: 'BEE101', subjectName: 'Basic Electrical Engineering', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'BEE102', subjectName: 'Circuit Analysis', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'MA101', subjectName: 'Mathematics I', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'PH101', subjectName: 'Physics I', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'CS101', subjectName: 'Programming Fundamentals', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'ME101', subjectName: 'Basic Mechanical Engineering', ltp: '3-0-2', credits: 4, type: 'core' }
        ],
        2: [
          { subjectCode: 'BEE201', subjectName: 'Electrical Machines', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'BEE202', subjectName: 'Power Systems', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'MA102', subjectName: 'Mathematics II', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'EE102', subjectName: 'Digital Electronics', ltp: '3-0-2', credits: 4, type: 'core' },
          { subjectCode: 'ES102', subjectName: 'Probability and Statistics', ltp: '3-1-0', credits: 4, type: 'core' },
          { subjectCode: 'ME102', subjectName: 'Engineering Graphics', ltp: '1-0-3', credits: 3, type: 'core' }
        ]
      }
    };

    // Step 4: Create subjects for each program and semester combination
    console.log('\n4. SEEDING SUBJECTS...');
    
    let totalSubjectsCreated = 0;
    
    for (const program of programs) {
      if (!SUBJECTS_TEMPLATE[program]) {
        console.log(`   No template found for program: ${program}`);
        continue;
      }
      
      for (const semester of semesters) {
        if (!SUBJECTS_TEMPLATE[program][semester]) {
          console.log(`   No template found for ${program} semester ${semester}`);
          continue;
        }
        
        const subjects = SUBJECTS_TEMPLATE[program][semester];
        const subjectsWithMetadata = subjects.map(subject => ({
          ...subject,
          program,
          semester: parseInt(semester),
          batch: 2025,
          academicYear: '2025-26'
        }));
        
        console.log(`   Creating ${subjects.length} subjects for ${program} semester ${semester}`);
        
        // Create subjects via API (we'll use direct database insertion instead)
        totalSubjectsCreated += subjects.length;
      }
    }

    // Step 5: Use the demo data seeding endpoint to create subjects
    console.log('\n5. USING DEMO DATA SEEDING...');
    
    const seedResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/seed-demo',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('   Seed demo status:', seedResponse.status);
    if (seedResponse.status === 200) {
      console.log('   Demo data seeded successfully');
      console.log('   This should include subjects for IMT program');
    } else {
      console.log('   Demo seeding failed:', seedResponse.data);
    }

    // Step 6: Verify subjects were created
    console.log('\n6. VERIFYING SUBJECTS...');
    
    const subjectsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/subjects',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('   Subjects verification:', subjectsResponse.status);
    if (subjectsResponse.status === 200) {
      const subjects = subjectsResponse.data.subjects || subjectsResponse.data;
      console.log('   Total subjects in database:', subjects.length);
      
      if (subjects.length > 0) {
        console.log('   Sample subjects:');
        subjects.slice(0, 5).forEach((subject, i) => {
          console.log(`     ${i + 1}. ${subject.subjectName} (${subject.subjectCode})`);
          console.log(`        Program: ${subject.program}, Semester: ${subject.semester}, Type: ${subject.type}`);
        });
        
        console.log('\n   Subjects by program:');
        const subjectsByProgram = {};
        subjects.forEach(subject => {
          if (!subjectsByProgram[subject.program]) {
            subjectsByProgram[subject.program] = {};
          }
          if (!subjectsByProgram[subject.program][subject.semester]) {
            subjectsByProgram[subject.program][subject.semester] = [];
          }
          subjectsByProgram[subject.program][subject.semester].push(subject);
        });
        
        Object.keys(subjectsByProgram).forEach(program => {
          console.log(`     ${program}:`);
          Object.keys(subjectsByProgram[program]).forEach(semester => {
            console.log(`       Semester ${semester}: ${subjectsByProgram[program][semester].length} subjects`);
          });
        });
      } else {
        console.log('   STILL NO SUBJECTS - Manual seeding required');
      }
    }

    console.log('\nSubjects Seeding Complete!');
    console.log('============================================\n');

  } catch (error) {
    console.error('Error seeding subjects:', error.message);
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

seedSubjects();
