// Test analytics data loading and structure
const http = require('http');

async function testAnalyticsData() {
  console.log('Testing Analytics Data Loading\n');

  try {
    // Login as admin
    console.log('1. Admin Login...');
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

    if (adminLogin.status !== 200) {
      console.log('   Admin login failed');
      return;
    }

    const adminToken = adminLogin.data.token;
    console.log('   Admin login successful');

    // Test analytics API
    console.log('\n2. Testing /api/admin/analytics...');
    const analyticsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/analytics',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (analyticsResponse.status === 200) {
      console.log('   Analytics API successful');
      console.log('   Full analytics data:', JSON.stringify(analyticsResponse.data, null, 2));
      
      // Check data structure
      const data = analyticsResponse.data;
      console.log('\n3. Analyzing Data Structure:');
      
      console.log('   Overview data:', data.overview);
      console.log('   Charts data:', data.charts);
      
      if (data.charts) {
        console.log('\n4. Chart Data Analysis:');
        
        // Students by Program
        const studentsByProgram = data.charts.studentsByProgram;
        console.log('   Students by Program:', studentsByProgram);
        if (studentsByProgram && studentsByProgram.length > 0) {
          console.log('     - Has data: YES');
          console.log('     - Count:', studentsByProgram.length);
          studentsByProgram.forEach((item, index) => {
            console.log(`     ${index + 1}. ${item._id}: ${item.count} students`);
          });
        } else {
          console.log('     - Has data: NO');
        }
        
        // Payments by Status
        const paymentsByStatus = data.charts.paymentsByStatus;
        console.log('   Payments by Status:', paymentsByStatus);
        if (paymentsByStatus && paymentsByStatus.length > 0) {
          console.log('     - Has data: YES');
          console.log('     - Count:', paymentsByStatus.length);
          paymentsByStatus.forEach((item, index) => {
            console.log(`     ${index + 1}. ${item._id}: ${item.count} payments`);
          });
        } else {
          console.log('     - Has data: NO');
        }
        
        // Registrations by Status
        const registrationsByStatus = data.charts.registrationsByStatus;
        console.log('   Registrations by Status:', registrationsByStatus);
        if (registrationsByStatus && registrationsByStatus.length > 0) {
          console.log('     - Has data: YES');
          console.log('     - Count:', registrationsByStatus.length);
          registrationsByStatus.forEach((item, index) => {
            console.log(`     ${index + 1}. ${item._id}: ${item.count} registrations`);
          });
        } else {
          console.log('     - Has data: NO');
        }
      } else {
        console.log('   No charts data found');
      }
      
    } else {
      console.log('   Analytics API failed:', analyticsResponse.status, analyticsResponse.data);
    }

    // Test raw data from other endpoints to see if data exists
    console.log('\n5. Testing Raw Data Sources...');
    
    // Get all students to see if there's data
    const studentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/students',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (studentsResponse.status === 200) {
      console.log('   Students data available:', studentsResponse.data.length, 'students');
      
      // Analyze student programs
      const programCounts = {};
      studentsResponse.data.forEach(student => {
        programCounts[student.program] = (programCounts[student.program] || 0) + 1;
      });
      console.log('   Program distribution:', programCounts);
    }
    
    // Get all payments to see if there's data
    const paymentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/verification/all',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (paymentsResponse.status === 200) {
      console.log('   Payments data available:', paymentsResponse.data.length, 'payments');
      
      // Analyze payment status
      const statusCounts = {};
      paymentsResponse.data.forEach(payment => {
        statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1;
      });
      console.log('   Payment status distribution:', statusCounts);
    }
    
    // Get all registrations to see if there's data
    const registrationsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/registrations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (registrationsResponse.status === 200) {
      console.log('   Registrations data available:', registrationsResponse.data.length, 'registrations');
      
      // Analyze registration status
      const regStatusCounts = {};
      registrationsResponse.data.forEach(reg => {
        regStatusCounts[reg.overallStatus] = (regStatusCounts[reg.overallStatus] || 0) + 1;
      });
      console.log('   Registration status distribution:', regStatusCounts);
    }

    console.log('\nAnalytics Data Testing Complete!');

  } catch (error) {
    console.error('Error testing analytics data:', error.message);
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

testAnalyticsData();
