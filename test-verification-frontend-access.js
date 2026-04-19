// Test verification staff frontend access to routes
const http = require('http');

async function testVerificationFrontendAccess() {
  console.log('Testing Verification Staff Frontend Access\n');

  try {
    // Test 1: Check if frontend server is running
    console.log('1. Testing Frontend Server...');
    try {
      const frontendTest = await makeRequest({
        hostname: 'localhost',
        port: 5173,
        path: '/',
        method: 'GET'
      });
      console.log('   Frontend server status:', frontendTest.status);
      if (frontendTest.status === 200) {
        console.log('   Frontend server: RUNNING');
      } else {
        console.log('   Frontend server: NOT ACCESSIBLE');
        console.log('   Make sure the frontend development server is running on port 5173');
        return;
      }
    } catch (error) {
      console.log('   Frontend server: NOT RUNNING');
      console.log('   Please start the frontend development server: npm run dev');
      return;
    }

    // Test 2: Check backend server
    console.log('\n2. Testing Backend Server...');
    try {
      const backendTest = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/health',
        method: 'GET'
      });
      console.log('   Backend server status:', backendTest.status);
      if (backendTest.status === 200) {
        console.log('   Backend server: RUNNING');
      } else {
        console.log('   Backend server: NOT ACCESSIBLE');
        return;
      }
    } catch (error) {
      console.log('   Backend server: NOT RUNNING');
      console.log('   Please start the backend server: npm run server');
      return;
    }

    // Test 3: Login as verification staff
    console.log('\n3. Testing Verification Staff Login...');
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
    console.log('   Login successful');
    console.log('   Token received:', staffToken.substring(0, 20) + '...');

    // Test 4: Test direct API access to verification endpoints
    console.log('\n4. Testing Direct API Access...');
    const endpoints = [
      '/api/verification/all',
      '/api/verification/stats',
      '/api/verification/pending'
    ];

    for (const endpoint of endpoints) {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: endpoint,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      console.log(`   ${endpoint}: ${response.status} ${response.status === 200 ? 'SUCCESS' : 'FAILED'}`);
    }

    // Test 5: Check expected frontend behavior
    console.log('\n5. Expected Frontend Behavior:');
    console.log('   When accessing http://localhost:5173/verification/all:');
    console.log('   1. ProtectedRoute should check authentication');
    console.log('   2. User role should be "verification_staff"');
    console.log('   3. Access should be granted');
    console.log('   4. VerificationLayout should render');
    console.log('   5. VerificationDashboard should show "All Payments" section');

    console.log('\n6. Common Issues and Solutions:');
    console.log('   Issue: Redirect to login page');
    console.log('   Solution: Check if user is logged in and token is valid');
    console.log('   ');
    console.log('   Issue: 404 Not Found');
    console.log('   Solution: Check if frontend server is running');
    console.log('   ');
    console.log('   Issue: Access denied');
    console.log('   Solution: Check user role and ProtectedRoute configuration');
    console.log('   ');
    console.log('   Issue: White screen or loading');
    console.log('   Solution: Check browser console for JavaScript errors');

    console.log('\n7. Debugging Steps:');
    console.log('   1. Open browser developer tools');
    console.log('   2. Go to http://localhost:5173/login');
    console.log('   3. Login as STAFF001 / Staff@123');
    console.log('   4. Check browser console for errors');
    console.log('   5. Navigate to http://localhost:5173/verification/all');
    console.log('   6. Check network tab for API calls');
    console.log('   7. Check console for authentication errors');

    console.log('\n8. Manual Testing Checklist:');
    console.log('   [ ] Frontend server running on port 5173');
    console.log('   [ ] Backend server running on port 5000');
    console.log('   [ ] Can login as verification staff');
    console.log('   [ ] Can access /verification/dashboard');
    console.log('   [ ] Can access /verification/pending');
    console.log('   [ ] Can access /verification/all');
    console.log('   [ ] No JavaScript errors in console');
    console.log('   [ ] API calls successful in network tab');

    console.log('\nVerification Frontend Access Test Complete!');

  } catch (error) {
    console.error('Error testing verification frontend access:', error.message);
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

testVerificationFrontendAccess();
