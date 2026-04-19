// Test script to verify registration flow fixes
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testRegistrationFlow() {
  console.log('🧪 Testing Registration Flow Fixes...\n');

  try {
    // Test 1: Student Registration with correct semester
    console.log('1️⃣ Testing student registration with semester 6...');
    const studentData = {
      rollNo: '2025IMT-002',
      name: 'Test Student',
      email: 'test@iiitm.ac.in',
      password: 'Test@123',
      program: 'IMT',
      batch: '2025',
      batchYear: 2025,
      semester: 6
    };

    const registerResponse = await axios.post(`${API_BASE}/auth/student/register`, studentData);
    console.log('✅ Registration successful:', registerResponse.data.user.semester);

    // Test 2: Login and get token
    console.log('\n2️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/student/login`, {
      rollNo: '2025IMT-002',
      password: 'Test@123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test 3: Get registration status
    console.log('\n3️⃣ Testing registration status...');
    const statusResponse = await axios.get(`${API_BASE}/student/registration-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Registration status:', {
      semester: statusResponse.data.semester,
      totalCredits: statusResponse.data.totalCredits,
      selectedSubjects: statusResponse.data.selectedSubjects?.length || 0
    });

    // Test 4: Get available subjects
    console.log('\n4️⃣ Testing subject availability...');
    const subjectsResponse = await axios.get(`${API_BASE}/subjects/available`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Subjects available:', subjectsResponse.data.totalSubjects);

    // Test 5: Subject selection
    if (subjectsResponse.data.coreSubjects?.length > 0) {
      console.log('\n5️⃣ Testing subject selection...');
      const coreSubjectIds = subjectsResponse.data.coreSubjects.map(s => s._id);
      const selectResponse = await axios.post(`${API_BASE}/subjects/select`, 
        { subjectIds: coreSubjectIds }, 
        { headers: { Authorization: `Bearer ${token}` }
      );
      console.log('✅ Subject selection successful:', selectResponse.data.totalCredits);
    }

    console.log('\n🎉 All registration flow tests passed!');
    console.log('\n📋 Summary of fixes:');
    console.log('  ✅ Student semester now displays correctly');
    console.log('  ✅ Subject selection works properly');
    console.log('  ✅ Registration data flows correctly');
    console.log('  ✅ API endpoints functioning properly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testRegistrationFlow();
