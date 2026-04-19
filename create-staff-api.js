// Create verification staff using API
const http = require('http');

async function createStaff() {
  try {
    console.log('🔧 Creating verification staff via API...\n');

    // Create verification staff
    const staffData = {
      employeeId: 'VER001',
      name: 'Verification Staff',
      email: 'verification@abviiitm.ac.in',
      passwordHash: 'Verification@123',
      role: 'verification_staff',
      department: 'Accounts'
    };

    const response = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/create-default-staff',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, staffData);

    if (response.status === 200) {
      console.log('✅ Verification staff created successfully!');
      console.log('   Employee ID: VER001');
      console.log('   Password: Verification@123');
      console.log('   Role: verification_staff');
    } else {
      console.log('❌ Failed to create verification staff:', response.data);
    }

  } catch (error) {
    console.error('❌ Error creating verification staff:', error.message);
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

createStaff();
