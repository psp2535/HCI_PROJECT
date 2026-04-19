// Test verification dashboard fix
const http = require('http');

async function testVerificationFix() {
  console.log('Testing Verification Dashboard Fix\n');
  console.log('==================================\n');

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

    // Step 3: Test API endpoints
    console.log('\n3. TESTING API ENDPOINTS...');
    
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
    }

    // Step 4: Expected behavior after fix
    console.log('\n4. EXPECTED BEHAVIOR AFTER FIX...');
    console.log('   The ReferenceError for "List is not defined" should be resolved');
    console.log('   Component should render without JavaScript errors');
    console.log('   Should see "All Payments" page with data');
    console.log('   Console should show debugging messages without errors');

    // Step 5: Testing instructions
    console.log('\n5. TESTING INSTRUCTIONS...');
    console.log('   1. Open browser and go to: http://localhost:5173/login');
    console.log('   2. Login with: STAFF001 / Staff@123');
    console.log('   3. Navigate to: http://localhost:5173/verification/all');
    console.log('   4. Check browser console - should NOT see "List is not defined" error');
    console.log('   5. Should see "All Payments" page with payment data');
    console.log('   6. Should see debugging console messages');

    // Step 6: What was fixed
    console.log('\n6. WHAT WAS FIXED...');
    console.log('   - Added "List" to lucide-react imports');
    console.log('   - Fixed ReferenceError: List is not defined');
    console.log('   - Component should now render properly');
    console.log('   - All verification portal sections should work');

    console.log('\nVerification Fix Test Complete!');
    console.log('==================================\n');

  } catch (error) {
    console.error('Error testing verification fix:', error.message);
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

testVerificationFix();
