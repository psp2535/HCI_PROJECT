// Complete analytics functionality test
const http = require('http');

async function testAnalyticsComplete() {
  console.log('Complete Analytics Functionality Test\n');

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

    // Test complete analytics workflow
    console.log('\n2. Testing Analytics Workflow...');
    
    // Step 1: Get analytics data
    console.log('   Step 1: Fetching analytics data...');
    const analyticsResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/analytics',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (analyticsResponse.status !== 200) {
      console.log('   Analytics API failed:', analyticsResponse.status);
      return;
    }

    const analyticsData = analyticsResponse.data;
    console.log('   Analytics data loaded successfully');

    // Step 2: Validate data structure
    console.log('\n   Step 2: Validating data structure...');
    const validation = {
      hasOverview: !!analyticsData.overview,
      hasCharts: !!analyticsData.charts,
      hasStudentsByProgram: Array.isArray(analyticsData.charts?.studentsByProgram),
      hasPaymentsByStatus: Array.isArray(analyticsData.charts?.paymentsByStatus),
      hasRegistrationsByStatus: Array.isArray(analyticsData.charts?.registrationsByStatus),
      studentsByProgramCount: analyticsData.charts?.studentsByProgram?.length || 0,
      paymentsByStatusCount: analyticsData.charts?.paymentsByStatus?.length || 0,
      registrationsByStatusCount: analyticsData.charts?.registrationsByStatus?.length || 0
    };

    console.log('   Validation results:', validation);

    // Step 3: Test chart data transformation
    console.log('\n   Step 3: Testing chart data transformation...');
    
    const studentsChartData = analyticsData.charts.studentsByProgram?.map(item => ({ 
      name: item._id, 
      value: item.count 
    })) || [];
    
    const paymentsChartData = analyticsData.charts.paymentsByStatus?.map(item => ({ 
      name: item._id, 
      value: item.count 
    })) || [];
    
    const registrationsChartData = analyticsData.charts.registrationsByStatus?.map(item => ({ 
      name: item._id, 
      value: item.count 
    })) || [];

    console.log('   Students chart data:', studentsChartData);
    console.log('   Payments chart data:', paymentsChartData);
    console.log('   Registrations chart data:', registrationsChartData);

    // Step 4: Test frontend conditions
    console.log('\n   Step 4: Testing frontend conditions...');
    
    const frontendConditions = {
      shouldShowStudentsChart: studentsChartData.length > 0,
      shouldShowPaymentsChart: paymentsChartData.length > 0,
      shouldShowRegistrationsChart: registrationsChartData.length > 0,
      studentsChartLabel: studentsChartData.map(d => `${d.name}: ${d.value}`).join(', '),
      paymentsChartLabel: paymentsChartData.map(d => `${d.name}: ${d.value}`).join(', '),
      registrationsChartLabel: registrationsChartData.map(d => `${d.name}: ${d.value}`).join(', ')
    };

    console.log('   Frontend conditions:', frontendConditions);

    // Step 5: Verify data integrity
    console.log('\n   Step 5: Verifying data integrity...');
    
    // Cross-check with other endpoints
    const [studentsRes, paymentsRes, registrationsRes] = await Promise.all([
      makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/students',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }),
      makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/verification/all',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }),
      makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/registrations',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
    ]);

    const dataIntegrity = {
      totalStudents: studentsRes.status === 200 ? studentsRes.data.length : 0,
      totalPayments: paymentsRes.status === 200 ? paymentsRes.data.length : 0,
      totalRegistrations: registrationsRes.status === 200 ? registrationsRes.data.length : 0,
      analyticsStudents: analyticsData.overview?.totalStudents || 0,
      analyticsPayments: (analyticsData.overview?.pendingPayments || 0) + (analyticsData.overview?.verifiedPayments || 0) + (analyticsData.overview?.rejectedPayments || 0),
      analyticsRegistrations: analyticsData.overview?.totalRegistrations || 0
    };

    console.log('   Data integrity check:', dataIntegrity);
    
    const integrityMatch = {
      studentsMatch: dataIntegrity.totalStudents === dataIntegrity.analyticsStudents,
      paymentsMatch: dataIntegrity.totalPayments === dataIntegrity.analyticsPayments,
      registrationsMatch: dataIntegrity.totalRegistrations === dataIntegrity.analyticsRegistrations
    };

    console.log('   Data integrity match:', integrityMatch);

    // Step 6: Final assessment
    console.log('\n   Step 6: Final assessment...');
    
    const assessment = {
      apiWorking: analyticsResponse.status === 200,
      dataStructureValid: validation.hasOverview && validation.hasCharts,
      hasChartData: validation.studentsByProgramCount > 0 && validation.paymentsByStatusCount > 0,
      frontendReady: frontendConditions.shouldShowStudentsChart && frontendConditions.shouldShowPaymentsChart,
      dataIntegrityValid: integrityMatch.studentsMatch && integrityMatch.registrationsMatch
    };

    console.log('   Final assessment:', assessment);

    console.log('\nAnalytics Complete Test Results:');
    console.log('=====================================');
    console.log(`API Working: ${assessment.apiWorking ? 'YES' : 'NO'}`);
    console.log(`Data Structure Valid: ${assessment.dataStructureValid ? 'YES' : 'NO'}`);
    console.log(`Has Chart Data: ${assessment.hasChartData ? 'YES' : 'NO'}`);
    console.log(`Frontend Ready: ${assessment.frontendReady ? 'YES' : 'NO'}`);
    console.log(`Data Integrity Valid: ${assessment.dataIntegrityValid ? 'YES' : 'NO'}`);
    
    if (assessment.apiWorking && assessment.dataStructureValid && assessment.hasChartData && assessment.frontendReady) {
      console.log('\nCONCLUSION: Analytics should be working correctly!');
      console.log('If charts still show "No data available", the issue is likely:');
      console.log('1. Frontend state not updating properly');
      console.log('2. Component not re-rendering when data loads');
      console.log('3. Browser caching issues');
    } else {
      console.log('\nCONCLUSION: There are issues that need to be fixed.');
    }

  } catch (error) {
    console.error('Error in complete analytics test:', error.message);
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

testAnalyticsComplete();
