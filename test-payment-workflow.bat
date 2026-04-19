@echo off
echo 🧪 Testing Payment Verification Workflow...
echo.

echo 1️⃣ Testing student login...
curl -X POST http://localhost:5000/api/auth/student/login ^
  -H "Content-Type: application/json" ^
  -d "{\"rollNo\":\"2023IMT-001\",\"password\":\"Student@123\"}" ^
  -s | jq -r '.token' > student_token.txt

if %errorlevel% neq 0 (
    echo ❌ Student login failed
    pause
    exit /b 1
)

set /p STUDENT_TOKEN=<student_token.txt
echo ✅ Student logged in successfully

echo.
echo 2️⃣ Submitting payment...
curl -X POST http://localhost:5000/api/payment/submit ^
  -H "Authorization: Bearer %STUDENT_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"transactions\":[{\"amount\":\"111000\",\"date\":\"2025-04-19\",\"utrNo\":\"TEST123456\",\"bankName\":\"Test Bank\",\"depositorName\":\"Test Student\",\"debitAccountNo\":\"1234567890\"}],\"totalAmount\":\"111000\",\"academicFee\":\"93000\",\"messFee\":\"18000\"}" ^
  -s | jq -r '.message' > payment_response.txt

if %errorlevel% neq 0 (
    echo ❌ Payment submission failed
    pause
    exit /b 1
)

echo ✅ Payment submitted successfully

echo.
echo 3️⃣ Testing verification staff login...
curl -X POST http://localhost:5000/api/auth/staff/login ^
  -H "Content-Type: application/json" ^
  -d "{\"employeeId\":\"VER001\",\"password\":\"Verification@123\"}" ^
  -s | jq -r '.token' > staff_token.txt

if %errorlevel% neq 0 (
    echo ❌ Staff login failed
    pause
    exit /b 1
)

set /p STAFF_TOKEN=<staff_token.txt
echo ✅ Verification staff logged in successfully

echo.
echo 4️⃣ Fetching payments for verification...
curl -X GET http://localhost:5000/api/verification/all ^
  -H "Authorization: Bearer %STAFF_TOKEN%" ^
  -s | jq '. | length' > payment_count.txt

set /p PAYMENT_COUNT=<payment_count.txt
echo ✅ Found %PAYMENT_COUNT% payments for verification

if %PAYMENT_COUNT% gtr 0 (
    echo 📋 Payment details:
    curl -X GET http://localhost:5000/api/verification/all ^
      -H "Authorization: Bearer %STAFF_TOKEN%" ^
      -s | jq -r '.[] | "Student: \(.studentId.name // "N/A"), Amount: ₹\(.totalAmount // "N/A"), UTR: \(.transactions[0].utrNo // "N/A"), Status: \(.status // "N/A")"'
) else (
    echo ❌ No payments found for verification
)

echo.
echo 🎉 Payment workflow test completed!

REM Cleanup
del student_token.txt staff_token.txt payment_response.txt payment_count.txt 2>nul
pause
