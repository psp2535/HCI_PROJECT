// Test verification dashboard blank page issue
const http = require('http');

async function testVerificationBlankPage() {
  console.log('Testing Verification Dashboard Blank Page Issue\n');
  console.log('================================================\n');

  try {
    // Step 1: Check servers
    console.log('1. CHECKING SERVERS...');
    
    const frontendCheck = await makeRequest({
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET'
    });
    
    if (frontendCheck.status !== 200) {
      console.log('   Frontend server: NOT RUNNING');
      console.log('   SOLUTION: Start frontend with: npm run dev');
      return;
    }
    console.log('   Frontend server: RUNNING');

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
      return;
    }

    const token = loginResponse.data.token;
    console.log('   Login: SUCCESS');
    console.log('   Token received');

    // Step 3: Test API endpoints that dashboard uses
    console.log('\n3. TESTING DASHBOARD API ENDPOINTS...');
    
    const endpoints = [
      { path: '/api/verification/stats', name: 'Stats API' },
      { path: '/api/verification/all', name: 'Payments API' }
    ];

    for (const endpoint of endpoints) {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: endpoint.path,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`   ${endpoint.name}: ${response.status === 200 ? 'OK' : 'FAILED'}`);
      if (response.status === 200) {
        console.log(`     Data type: ${Array.isArray(response.data) ? 'Array' : 'Object'}`);
        console.log(`     Data size: ${Array.isArray(response.data) ? response.data.length : Object.keys(response.data).length}`);
      } else {
        console.log(`     Error: ${response.data}`);
      }
    }

    // Step 4: Expected frontend behavior
    console.log('\n4. EXPECTED FRONTEND BEHAVIOR...');
    console.log('   When you access http://localhost:5173/verification/all:');
    console.log('   - Component should render with debugging logs');
    console.log('   - Should see "VerificationDashboard component rendering" in console');
    console.log('   - Should see "Current location: /verification/all" in console');
    console.log('   - Should see "Active section: all" in console');
    console.log('   - Should see "Starting load function for section: all" in console');
    console.log('   - Should see "Loading stats..." and "Loading payments..." in console');
    console.log('   - Should see "Rendering all payments section..." in console');
    console.log('   - Should see "All Payments" page with data');

    // Step 5: Troubleshooting blank page
    console.log('\n5. TROUBLESHOOTING BLANK PAGE...');
    console.log('   COMMON CAUSES:');
    console.log('   a) JavaScript Error:');
    console.log('      - Check browser console for red error messages');
    console.log('      - Look for "Uncaught TypeError" or "ReferenceError"');
    console.log('      - Check for missing imports or undefined variables');
    console.log('   ');
    console.log('   b) Component Not Rendering:');
    console.log('      - Check if component is mounting (look for console logs)');
    console.log('      - Verify conditional rendering logic');
    console.log('      - Check if loading state is stuck');
    console.log('   ');
    console.log('   c) Data Loading Issues:');
    console.log('      - Check network tab for failed API calls');
    console.log('      - Verify API responses are correct');
    console.log('      - Check for authentication errors');
    console.log('   ');
    console.log('   d) CSS/Styling Issues:');
    console.log('      - Check if content is hidden by CSS');
    console.log('      - Look for "display: none" or "visibility: hidden"');
    console.log('      - Check for z-index issues');

    // Step 6: Debugging checklist
    console.log('\n6. DEBUGGING CHECKLIST...');
    console.log('   [ ] Open browser developer tools (F12)');
    console.log('   [ ] Go to Console tab');
    console.log('   [ ] Clear console');
    console.log('   [ ] Navigate to http://localhost:5173/login');
    console.log('   [ ] Login as STAFF001 / Staff@123');
    console.log('   [ ] Navigate to http://localhost:5173/verification/all');
    console.log('   [ ] Check for debugging console messages');
    console.log('   [ ] Look for red error messages');
    console.log('   [ ] Check Network tab for API calls');
    console.log('   [ ] Verify API responses are successful');

    // Step 7: Expected console output
    console.log('\n7. EXPECTED CONSOLE OUTPUT...');
    console.log('   You should see these messages in order:');
    console.log('   1. "VerificationDashboard component rendering"');
    console.log('   2. "Current location: /verification/all"');
    console.log('   3. "Active section: all"');
    console.log('   4. "Loading state: true"');
    console.log('   5. "Starting load function for section: all"');
    console.log('   6. "Loading stats..."');
    console.log('   7. "Stats response: {object}"');
    console.log('   8. "Loading payments for section: all"');
    console.log('   9. "All payments response: {array}"');
    console.log('   10. "Load function completed, setting loading to false"');
    console.log('   11. "Checking active section for rendering: all"');
    console.log('   12. "Rendering all payments section..."');

    // Step 8: If still blank
    console.log('\n8. IF STILL BLANK PAGE...');
    console.log('   Try these solutions:');
    console.log('   1. Clear browser cache and refresh');
    console.log('   2. Open incognito/private window');
    console.log('   3. Try different browser');
    console.log('   4. Restart frontend server (npm run dev)');
    console.log('   5. Check for any CSS conflicts');
    console.log('   6. Verify all imports are correct');
    console.log('   7. Check for infinite loops in useEffect');

    console.log('\nVerification Blank Page Test Complete!');
    console.log('================================================\n');

  } catch (error) {
    console.error('Error testing verification blank page:', error.message);
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

testVerificationBlankPage();
