// Verification Portal Access Fix and Debugging Script
const http = require('http');

async function fixVerificationAccess() {
  console.log('Verification Portal Access Fix\n');
  console.log('=====================================\n');

  try {
    // Step 1: Verify servers are running
    console.log('1. CHECKING SERVERS...');
    
    // Check frontend
    try {
      const frontendCheck = await makeRequest({
        hostname: 'localhost',
        port: 5173,
        path: '/',
        method: 'GET'
      });
      console.log('   Frontend Server: RUNNING (port 5173)');
    } catch (error) {
      console.log('   Frontend Server: NOT RUNNING');
      console.log('   SOLUTION: Start frontend with: npm run dev');
      return;
    }

    // Check backend
    try {
      const backendCheck = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/health',
        method: 'GET'
      });
      console.log('   Backend Server: RUNNING (port 5000)');
    } catch (error) {
      console.log('   Backend Server: NOT RUNNING');
      console.log('   SOLUTION: Start backend with: npm run server');
      return;
    }

    // Step 2: Test verification staff login
    console.log('\n2. TESTING VERIFICATION STAFF LOGIN...');
    
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/staff/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      employeeId: 'STAFF001',
      password: 'Staff@123'
    });

    if (loginResponse.status !== 200) {
      console.log('   Login FAILED:', loginResponse.status);
      console.log('   SOLUTION: Check credentials and backend');
      return;
    }

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('   Login: SUCCESS');
    console.log('   User:', user.name);
    console.log('   Role:', user.role);
    console.log('   Employee ID:', user.employeeId);

    // Step 3: Test API access
    console.log('\n3. TESTING API ACCESS...');
    
    const apiTests = [
      { path: '/api/verification/all', name: 'All Payments' },
      { path: '/api/verification/stats', name: 'Stats' },
      { path: '/api/verification/pending', name: 'Pending' }
    ];

    for (const test of apiTests) {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: test.path,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`   ${test.name}: ${response.status === 200 ? 'OK' : 'FAILED'}`);
      if (response.status === 200) {
        console.log(`     Data: ${Array.isArray(response.data) ? response.data.length + ' items' : 'Object received'}`);
      }
    }

    // Step 4: Provide browser testing instructions
    console.log('\n4. BROWSER TESTING INSTRUCTIONS...');
    console.log('   Follow these steps exactly:');
    console.log('');
    console.log('   a) Open browser and go to: http://localhost:5173/login');
    console.log('   b) Login with credentials:');
    console.log('      Employee ID: STAFF001');
    console.log('      Password: Staff@123');
    console.log('   c) After successful login, you should be redirected to dashboard');
    console.log('   d) Manually navigate to: http://localhost:5173/verification/all');
    console.log('   e) If it doesn\'t work, try: http://localhost:5173/verification/dashboard');
    console.log('   f) Then click "All Payments" in the sidebar');

    // Step 5: Troubleshooting guide
    console.log('\n5. TROUBLESHOOTING GUIDE...');
    console.log('   If /verification/all doesn\'t work:');
    console.log('');
    console.log('   ISSUE: Redirected to login');
    console.log('   CAUSE: Not logged in or token expired');
    console.log('   FIX: Clear browser cache and login again');
    console.log('');
    console.log('   ISSUE: 404 Not Found');
    console.log('   CAUSE: Frontend server not running');
    console.log('   FIX: Start frontend server with npm run dev');
    console.log('');
    console.log('   ISSUE: Access Denied');
    console.log('   CAUSE: User role not matching');
    console.log('   FIX: Check user role is "verification_staff"');
    console.log('');
    console.log('   ISSUE: White screen');
    console.log('   CAUSE: JavaScript error');
    console.log('   FIX: Check browser console for errors');
    console.log('');
    console.log('   ISSUE: Loading forever');
    console.log('   CAUSE: API call failing');
    console.log('   FIX: Check network tab for failed requests');

    // Step 6: Expected behavior
    console.log('\n6. EXPECTED BEHAVIOR...');
    console.log('   When you access http://localhost:5173/verification/all:');
    console.log('   - Should see "Verification Portal" header');
    console.log('   - Should see "Mr. Rajesh Kumar" user info');
    console.log('   - Should see sidebar with Dashboard, Pending Verifications, All Payments');
    console.log('   - Should see "All Payments" page with payment data');
    console.log('   - Should see payment table with 1 payment');

    // Step 7: Manual verification checklist
    console.log('\n7. VERIFICATION CHECKLIST...');
    console.log('   [ ] Frontend server running (npm run dev)');
    console.log('   [ ] Backend server running (npm run server)');
    console.log('   [ ] Can login at http://localhost:5173/login');
    console.log('   [ ] Dashboard loads after login');
    console.log('   [ ] Can access http://localhost:5173/verification/dashboard');
    console.log('   [ ] Can access http://localhost:5173/verification/pending');
    console.log('   [ ] Can access http://localhost:5173/verification/all');
    console.log('   [ ] No JavaScript errors in console');
    console.log('   [ ] API calls show 200 status in network tab');

    console.log('\n8. SOLUTION IF STILL NOT WORKING...');
    console.log('   If you\'ve tried everything above and it still doesn\'t work:');
    console.log('   1. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('   2. Open incognito/private window');
    console.log('   3. Try a different browser');
    console.log('   4. Restart both frontend and backend servers');
    console.log('   5. Check for any firewall/antivirus blocking');

    console.log('\nVerification Access Fix Complete!');
    console.log('=====================================');

  } catch (error) {
    console.error('Error in verification access fix:', error.message);
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

fixVerificationAccess();
