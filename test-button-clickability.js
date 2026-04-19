// Test button clickability and CSS issues
const http = require('http');

async function testButtonClickability() {
  console.log('Testing Button Clickability Issues\n');
  console.log('=====================================\n');

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
      return;
    }
    console.log('   Frontend server: RUNNING');

    const backendCheck = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    
    if (backendCheck.status !== 200) {
      console.log('   Backend server: NOT RUNNING');
      return;
    }
    console.log('   Backend server: RUNNING');

    // Step 2: Login as student
    console.log('\n2. STUDENT LOGIN...');
    
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

    if (studentLogin.status !== 200) {
      console.log('   Student login failed:', studentLogin.status);
      return;
    }

    const studentToken = studentLogin.data.token;
    const studentUser = studentLogin.data.user;
    console.log('   Student login: SUCCESS');
    console.log('   Student:', studentUser.name);

    // Step 3: Get current payment
    console.log('\n3. GETTING CURRENT PAYMENT...');
    
    const currentPaymentResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/payments',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    console.log('   Current payment API:', currentPaymentResponse.status);
    if (currentPaymentResponse.status === 200) {
      const payments = currentPaymentResponse.data;
      console.log('   Found', payments.length, 'payments');
      
      if (payments.length > 0) {
        const payment = payments[0];
        console.log('   Current payment:');
        console.log('   - ID:', payment._id);
        console.log('   - Status:', payment.status);
        console.log('   - Amount:', payment.totalAmount || payment.amount);
        console.log('   - Payment object exists:', !!payment);
        console.log('   - Payment._id exists:', !!payment._id);
        console.log('   - Button should be enabled:', !!(payment && payment._id) ? false : true);
        console.log('   - Button disabled condition:', 'submitting || !payment || !payment._id');
        
        // Step 4: Analyze button clickability
        console.log('\n4. ANALYZING BUTTON CLICKABILITY...');
        console.log('   If button is not clickable, check:');
        console.log('   a) CSS pointer-events: none');
        console.log('   b) CSS z-index issues');
        console.log('   c) Button is behind another element');
        console.log('   d) Button is disabled when it should be enabled');
        console.log('   e) Button has no onClick handler');
        console.log('   f) Button is outside viewport');
        console.log('   g) Button has opacity or visibility issues');
        console.log('   h) Button is covered by overlay');
      }
    }

    // Step 5: Button debugging guide
    console.log('\n5. BUTTON DEBUGGING GUIDE...');
    console.log('   To debug button not clickable:');
    console.log('   1. Open browser and go to: http://localhost:5173/login');
    console.log('   2. Login as student and navigate to Fee Payment page');
    console.log('   3. Right-click "Mark Payment as Completed" button');
    console.log('   4. Select "Inspect" from context menu');
    console.log('   5. In Elements tab, check:');
    console.log('      - Button element is visible');
    console.log('      - Button has correct CSS classes');
    console.log('      - Button is not disabled');
    console.log('      - Button has pointer-events: auto');
    console.log('      - Button has z-index > 0');
    console.log('      - Button is not behind overlay');
    console.log('   6. In Console tab, check:');
    console.log('      - No JavaScript errors');
    console.log('      - Button element is properly mounted');
    console.log('      - onClick handler is attached');
    console.log('   7. Test button click:');
    console.log('      - Click button manually');
    console.log('      - Check if any event fires');
    console.log('      - Look for console messages');

    // Step 6: Common CSS issues
    console.log('\n6. COMMON CSS ISSUES...');
    console.log('   If button is not clickable due to CSS:');
    console.log('   - Check for: pointer-events: none');
    console.log('   - Check for: z-index: -1 or low values');
    console.log('   - Check for: position: fixed with high z-index covering');
    console.log('   - Check for: opacity: 0 or visibility: hidden');
    console.log('   - Check for: transform or filter affecting click area');

    // Step 7: Expected button state
    console.log('\n7. EXPECTED BUTTON STATE...');
    console.log('   When working correctly, button should:');
    console.log('   - Be visible and clickable');
    console.log('   - Have onClick handler: () => payment && payment._id && handleStatusUpdate(payment._id, "completed")');
    console.log('   - Be enabled when payment exists and has _id');
    console.log('   - Have CSS: pointer-events: auto');
    console.log('   - Have CSS: z-index > 0');
    console.log('   - Not be disabled or covered');

    console.log('\nButton Clickability Test Complete!');
    console.log('=====================================\n');

  } catch (error) {
    console.error('Error testing button clickability:', error.message);
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

testButtonClickability();
