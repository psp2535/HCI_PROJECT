// Check verification staff in database
const http = require('http');

async function checkStaff() {
  try {
    console.log('🔍 Checking verification staff in database...\n');

    // First, let's try to create staff again to see if it already exists
    const createResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/create-default-staff',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      employeeId: 'VER001',
      name: 'Verification Staff',
      email: 'verification@abviiitm.ac.in',
      passwordHash: 'Verification@123',
      role: 'verification_staff',
      department: 'Accounts'
    });

    console.log('Create staff response:', createResponse);

    // Now try to login with different approaches
    const loginAttempts = [
      { employeeId: 'VER001', password: 'Verification@123' },
      { employeeId: 'VER001', password: 'Verification@123' }
    ];

    for (let i = 0; i < loginAttempts.length; i++) {
      const attempt = loginAttempts[i];
      console.log(`\n🔐 Login attempt ${i + 1}:`);
      console.log('   Employee ID:', attempt.employeeId);
      console.log('   Password:', attempt.password);

      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/staff/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, attempt);

      console.log('   Response status:', loginResponse.status);
      console.log('   Response data:', loginResponse.data);

      if (loginResponse.status === 200) {
        console.log('✅ Login successful!');
        break;
      }
    }

  } catch (error) {
    console.error('❌ Error checking staff:', error.message);
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

checkStaff();
