// Test verification staff access to routes
const http = require('http');

async function testVerificationStaffAccess() {
  console.log('Testing Verification Staff Access\n');

  try {
    // Test 1: Login as verification staff
    console.log('1. Testing Verification Staff Login...');
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

    if (staffLogin.status !== 200) {
      console.log('   Login failed:', staffLogin.status, staffLogin.data);
      return;
    }

    const staffToken = staffLogin.data.token;
    const staffUser = staffLogin.data.user;
    console.log('   Login successful');
    console.log('   User role:', staffUser.role);
    console.log('   User name:', staffUser.name);
    console.log('   Employee ID:', staffUser.employeeId);

    // Test 2: Check if role matches expected 'verification_staff'
    console.log('\n2. Testing Role Matching...');
    const expectedRole = 'verification_staff';
    const actualRole = staffUser.role;
    console.log('   Expected role:', expectedRole);
    console.log('   Actual role:', actualRole);
    console.log('   Role matches:', actualRole === expectedRole ? 'YES' : 'NO');

    if (actualRole !== expectedRole) {
      console.log('   ERROR: Role mismatch! This could cause access issues.');
      console.log('   Possible roles that might work:', ['verification_staff', 'staff', 'admin', 'faculty']);
    }

    // Test 3: Test API access with token
    console.log('\n3. Testing API Access...');
    const apiTest = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/verification/all',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    console.log('   API access status:', apiTest.status);
    if (apiTest.status === 200) {
      console.log('   API access: SUCCESS');
      console.log('   Data available:', apiTest.data.length, 'payments');
    } else {
      console.log('   API access: FAILED');
      console.log('   Error:', apiTest.data);
    }

    // Test 4: Test frontend route access simulation
    console.log('\n4. Testing Frontend Route Access...');
    console.log('   Expected accessible routes:');
    console.log('   - /verification/dashboard');
    console.log('   - /verification/pending');
    console.log('   - /verification/all');
    
    console.log('\n   ProtectedRoute check:');
    console.log('   - User exists:', !!staffUser);
    console.log('   - User role:', staffUser.role);
    console.log('   - Allowed roles:', ['verification_staff']);
    console.log('   - Role in allowed roles:', ['verification_staff'].includes(staffUser.role));
    console.log('   - Should grant access:', ['verification_staff'].includes(staffUser.role) ? 'YES' : 'NO');

    // Test 5: Check if there are alternative role names
    console.log('\n5. Testing Alternative Role Names...');
    const alternativeRoles = ['staff', 'verification', 'verification_staff', 'admin'];
    for (const role of alternativeRoles) {
      const wouldMatch = role === staffUser.role;
      console.log(`   - Role "${role}" would match: ${wouldMatch ? 'YES' : 'NO'}`);
    }

    console.log('\n6. Troubleshooting Guide:');
    console.log('   If /verification/all is not accessible:');
    console.log('   1. Check if user role is exactly "verification_staff"');
    console.log('   2. Verify the login token contains correct user data');
    console.log('   3. Check if ProtectedRoute is working correctly');
    console.log('   4. Verify the frontend is using the correct token');
    console.log('   5. Check browser console for authentication errors');

    console.log('\nVerification Staff Access Test Complete!');

  } catch (error) {
    console.error('Error testing verification staff access:', error.message);
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

testVerificationStaffAccess();
