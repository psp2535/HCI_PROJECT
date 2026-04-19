// Comprehensive API Testing Suite
const http = require('http');

const API_BASE = 'http://localhost:5000/api';

let testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function logTest(testName, passed, details = '') {
  testResults.details.push({ test: testName, passed, details });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
    if (details) console.log(`   ${details}`);
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

async function runComprehensiveTests() {
  console.log('🧪 Comprehensive API Testing Suite');
  console.log('=====================================\n');

  let studentToken, staffToken, adminToken;

  try {
    // 1. AUTHENTICATION APIS
    console.log('1️⃣ TESTING AUTHENTICATION APIS');
    console.log('-------------------------------');

    // Student Login
    const studentLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/student/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      rollNo: '2023IMT-001',
      password: 'Student@123'
    });
    logTest('Student Login API', studentLogin.status === 200, studentLogin.status !== 200 ? `Status: ${studentLogin.status}` : '');
    
    if (studentLogin.status === 200) {
      studentToken = studentLogin.data.token;
      logTest('Student Token Format', typeof studentToken === 'string' && studentToken.length > 0);
    }

    // Staff Login
    const staffLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/staff/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      employeeId: 'STAFF001',
      password: 'Staff@123'
    });
    logTest('Staff Login API', staffLogin.status === 200, staffLogin.status !== 200 ? `Status: ${staffLogin.status}` : '');
    
    if (staffLogin.status === 200) {
      staffToken = staffLogin.data.token;
      logTest('Staff Token Format', typeof staffToken === 'string' && staffToken.length > 0);
    }

    // 2. STUDENT APIS
    console.log('\n2️⃣ TESTING STUDENT APIS');
    console.log('-------------------------');

    if (studentToken) {
      // Student Profile
      const profile = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/student/profile',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      logTest('Get Student Profile', profile.status === 200);

      // Update Student Profile
      const updateProfile = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/student/profile',
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${studentToken}`,
          'Content-Type': 'application/json'
        }
      }, {
        name: 'Test Student Updated',
        mobile: '9876543210'
      });
      logTest('Update Student Profile', updateProfile.status === 200);

      // Registration Status
      const regStatus = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/student/registration-status',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      logTest('Get Registration Status', regStatus.status === 200);

      // Init Registration
      const initReg = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/student/init-registration',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      logTest('Init Registration', initReg.status === 200);
    }

    // 3. SUBJECT APIS
    console.log('\n3️⃣ TESTING SUBJECT APIS');
    console.log('------------------------');

    if (studentToken) {
      // Get Available Subjects
      const subjects = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/subjects/',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      logTest('Get Available Subjects', subjects.status === 200);

      // Subject Selection Summary
      const subjectSummary = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/subjects/selection-summary',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      logTest('Get Subject Selection Summary', subjectSummary.status === 200);
    }

    // 4. PAYMENT APIS
    console.log('\n4️⃣ TESTING PAYMENT APIS');
    console.log('------------------------');

    if (studentToken) {
      // Submit Payment
      const paymentSubmit = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/payment/submit',
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${studentToken}`,
          'Content-Type': 'application/json'
        }
      }, {
        transactions: [{
          amount: '111000',
          date: '2025-04-19',
          utrNo: 'TEST789',
          bankName: 'Test Bank',
          depositorName: 'Test Student',
          debitAccountNo: '1234567890'
        }],
        totalAmount: '111000',
        academicFee: '93000',
        messFee: '18000'
      });
      logTest('Submit Payment', paymentSubmit.status === 200);

      // Get My Payment
      const myPayment = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/payment/my-payment',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      logTest('Get My Payment', myPayment.status === 200);
    }

    // 5. RECEIPT APIS
    console.log('\n5️⃣ TESTING RECEIPT APIS');
    console.log('------------------------');

    if (studentToken) {
      // Get My Receipts
      const myReceipts = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/receipt/my-receipts',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      logTest('Get My Receipts', myReceipts.status === 200);
    }

    // 6. VERIFICATION APIS
    console.log('\n6️⃣ TESTING VERIFICATION APIS');
    console.log('---------------------------');

    if (staffToken) {
      // Get Pending Payments
      const pendingPayments = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/verification/pending',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      logTest('Get Pending Payments', pendingPayments.status === 200);

      // Get All Payments
      const allPayments = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/verification/all',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      logTest('Get All Payments', allPayments.status === 200);

      // Get Verification Stats
      const verifStats = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/verification/stats',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      logTest('Get Verification Stats', verifStats.status === 200);

      // Verify Payment (if we have payments)
      if (allPayments.status === 200 && Array.isArray(allPayments.data) && allPayments.data.length > 0) {
        const verifyPayment = await makeRequest({
          hostname: 'localhost',
          port: 5000,
          path: `/api/verification/verify/${allPayments.data[0]._id}`,
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${staffToken}`,
            'Content-Type': 'application/json'
          }
        }, {
          action: 'approve',
          remarks: 'Test verification'
        });
        logTest('Verify Payment', verifyPayment.status === 200);
      }
    }

    // 7. FACULTY APIS
    console.log('\n7️⃣ TESTING FACULTY APIS');
    console.log('------------------------');

    // Create faculty token for testing
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
    
    let facultyToken = null;
    if (facultyLogin.status === 200) {
      facultyToken = facultyLogin.data.token;
    }

    if (facultyToken) {
      // Get Pending Faculty Approvals
      const pendingFaculty = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/faculty/pending',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${facultyToken}` }
      });
      logTest('Get Pending Faculty Approvals', pendingFaculty.status === 200);

      // Get All Faculty Students
      const allFacultyStudents = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/faculty/students',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${facultyToken}` }
      });
      logTest('Get All Faculty Students', allFacultyStudents.status === 200);
    } else {
      logTest('Faculty Login', false, 'Faculty credentials not available');
    }

    // 8. ADMIN APIS
    console.log('\n8️⃣ TESTING ADMIN APIS');
    console.log('---------------------');

    // Create admin token for testing
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
    
    let adminToken = null;
    if (adminLogin.status === 200) {
      adminToken = adminLogin.data.token;
    }

    if (adminToken) {
      // Get All Students (Admin)
      const adminStudents = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/students',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      logTest('Admin Get All Students', adminStudents.status === 200);

      // Get All Staff (Admin)
      const adminStaff = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/staff',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      logTest('Admin Get All Staff', adminStaff.status === 200);

      // Get Analytics (Admin)
      const analytics = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/analytics',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      logTest('Admin Get Analytics', analytics.status === 200);
    } else {
      logTest('Admin Login', false, 'Admin credentials not available');
    }

    // 9. MIDDLEWARE & SECURITY TESTS
    console.log('\n9️⃣ TESTING MIDDLEWARE & SECURITY');
    console.log('------------------------------');

    // Test unauthorized access
    const unauthorizedTest = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/profile',
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    logTest('Unauthorized Access Handling', unauthorizedTest.status === 401);

    // Test missing token
    const noTokenTest = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/profile',
      method: 'GET'
    });
    logTest('Missing Token Handling', noTokenTest.status === 401);

    // 10. HEALTH CHECK
    console.log('\n🔟 TESTING HEALTH CHECK');
    console.log('------------------------');

    const healthCheck = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    logTest('Health Check API', healthCheck.status === 200);

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }

  // RESULTS SUMMARY
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n🔧 FAILED TESTS:');
    testResults.details.filter(t => !t.passed).forEach(test => {
      console.log(`   • ${test.test}: ${test.details}`);
    });
  }

  console.log('\n🎯 OVERALL STATUS:', testResults.failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
}

runComprehensiveTests();
