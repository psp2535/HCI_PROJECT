// Test faculty course registrations functionality
const http = require('http');

async function testFacultyCourses() {
  console.log('Testing Faculty Course Registration Features\n');

  try {
    // Login as faculty
    console.log('1. Logging in as faculty...');
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

    // Test course registrations endpoint
    console.log('\n2. Testing course registrations endpoint...');
    const courseRegResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/course-registrations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (courseRegResponse.status === 200) {
      console.log('   Course registrations loaded successfully');
      console.log('   Response data:', courseRegResponse.data);
      
      if (courseRegResponse.data.registrations) {
        console.log(`   Found ${courseRegResponse.data.registrations.length} registrations`);
      }
      if (courseRegResponse.data.subjectGroups) {
        console.log(`   Found ${courseRegResponse.data.subjectGroups.length} subject groups`);
        courseRegResponse.data.subjectGroups.forEach((group, index) => {
          console.log(`     Group ${index + 1}: ${group.subject?.subjectCode} - ${group.subject?.subjectName}`);
          console.log(`       Students: ${group.students?.length || 0}`);
        });
      }
      if (courseRegResponse.data.availableSubjects) {
        console.log(`   Available subjects: ${courseRegResponse.data.availableSubjects.length}`);
      }
    } else {
      console.log('   Course registrations failed:', courseRegResponse.status, courseRegResponse.data);
    }

    // Test export PDF endpoint
    console.log('\n3. Testing PDF export endpoint...');
    const pdfResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/export-attendance-pdf',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (pdfResponse.status === 200) {
      console.log('   PDF export successful (binary data)');
    } else if (pdfResponse.status === 404) {
      console.log('   PDF export endpoint not found');
    } else {
      console.log('   PDF export failed:', pdfResponse.status, pdfResponse.data);
    }

    // Test with filters
    console.log('\n4. Testing course registrations with filters...');
    const filteredResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/course-registrations?program=IMT&semester=1',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });

    if (filteredResponse.status === 200) {
      console.log('   Filtered course registrations successful');
      console.log('   Filtered data:', filteredResponse.data);
    } else {
      console.log('   Filtered course registrations failed:', filteredResponse.status, filteredResponse.data);
    }

    console.log('\nFaculty course testing complete!');

  } catch (error) {
    console.error('Error testing faculty courses:', error.message);
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

testFacultyCourses();
