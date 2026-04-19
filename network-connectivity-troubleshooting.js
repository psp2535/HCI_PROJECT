// Network connectivity troubleshooting guide
console.log(`
====================================
NETWORK CONNECTIVITY TROUBLESHOOTING
====================================

ISSUE: Backend API connection error
ERROR: "unavailable: read tcp 10.127.14.25:13603->34.49.14.144:443: wsarecv: An established connection was aborted by the software in your host machine."

ERROR ANALYSIS:
================

This error indicates:
1. Backend server is not accessible
2. Network connection is being blocked or interrupted
3. Port 5000 may be blocked or not running
4. TCP connection to localhost:5000 is failing

TROUBLESHOOTING STEPS:
================

1. CHECK BACKEND SERVER STATUS:
   a) Open terminal/command prompt
   b) Navigate to project directory: cd c:\\Users\\91703\\OneDrive\\Desktop\\HCI_PROJECT
   c) Check if backend is running:
      - Run: npm run dev (in server directory)
      - Look for: "Server running on port 5000" message
      - Try: curl http://localhost:5000/api/health
      - Check for any error messages

2. CHECK PORT CONFLICTS:
   a) Check if port 5000 is being used by another application
   b) Look for processes using port 5000:
      - Windows: netstat -ano | findstr :5000
      - macOS/Linux: lsof -i :5000
      - Kill any conflicting processes

3. CHECK FIREWALL SETTINGS:
   a) Windows Firewall:
      - Open Windows Defender Firewall
      - Add port 5000 to allowed list
      - Check for any blocking rules
   b) Antivirus Software:
      - Temporarily disable real-time protection
      - Add exceptions for localhost:5000
   c) Router/Network Hardware:
      - Check if router is blocking local connections
      - Verify port forwarding settings

4. ALTERNATIVE APPROACHES:
   a) Try different port for backend
   b) Use different network connection
   c) Restart computer and network equipment
   d) Try mobile hotspot if available

5. SPECIFIC TO LOCALHOST:5000:
   a) Check if MongoDB is running and accessible
   b) Verify backend configuration files
   c) Check for any CORS issues
   d) Look for backend server startup errors

IMMEDIATE ACTIONS:
==============

1. First, verify if backend server is actually running
2. Check if port 5000 is accessible
3. Look for any error messages in backend server logs
4. Try to access backend API directly with curl or Postman

EXPECTED BEHAVIOR:
================

When working correctly:
- Backend server should be running on port 5000
- Frontend should be able to connect to localhost:5000
- API calls should complete successfully
- No connection aborted errors should occur

The connection error is preventing the payment completion button from working properly. This needs to be resolved first before testing the payment functionality.
`);

console.log('Network connectivity troubleshooting guide generated. Please follow the steps above to resolve the backend connection issue.');
