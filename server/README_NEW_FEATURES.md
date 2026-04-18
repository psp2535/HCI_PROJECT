# New Features Implementation Guide

## Overview

This document describes the three new features implemented in the ABV-IIITM Semester Registration System:

1. **Semester Promotion System** - Bulk promote students to next semester
2. **PDF Upload → Subject Auto Update** - Upload PDF to automatically update subjects
3. **Dynamic Subject Fetch** - Students automatically see subjects for their program/semester

---

## 📁 File Structure

```
server/
├── controllers/
│   ├── promotionController.js          # Semester promotion logic
│   ├── subjectUploadController.js      # PDF parsing and subject upload
│   └── studentSubjectController.js     # Dynamic subject fetching
├── middleware/
│   └── upload.js                       # Multer configuration for PDF upload
├── models/
│   ├── Student.js                      # Updated with promotion fields
│   └── Subject.js                      # Updated with new schema
├── routes/
│   ├── admin.js                        # Updated with new endpoints
│   └── subject.js                      # Updated with dynamic fetching
├── docs/
│   └── NEW_FEATURES_API.md            # Complete API documentation
└── utils/
    └── sampleSubjectPDF.txt           # Sample PDF format reference
```

---

## 🚀 Feature 1: Semester Promotion System

### What It Does
Automatically promotes students to the next semester based on their registration approval status.

### Key Components

**Controller:** `controllers/promotionController.js`
- `promoteStudentsToNextSemester()` - Main promotion function
- `getPromotionStats()` - Get promotion statistics

**API Endpoints:**
- `POST /api/admin/promote-semester` - Promote students
- `GET /api/admin/promotion-stats` - Get statistics

### Business Logic

1. **Eligibility Criteria:**
   - Student must have `overallStatus = "final_approved"` in their latest registration
   - Current semester must be < 8 (max semester limit)
   - Must not have been promoted in the last month (`lastPromotedAt`)

2. **Promotion Process:**
   - Increments `currentSemester` by 1
   - Increments `semester` by 1 (for backward compatibility)
   - Sets `lastPromotedAt` to current date
   - Resets `overallStatus` to "active"
   - Uses MongoDB `bulkWrite` for efficiency

3. **Filtering Options:**
   - Promote all eligible students
   - Filter by program (e.g., only IMT students)
   - Filter by batch year (e.g., only 2025 batch)

### Usage Example

```javascript
// Promote all IMT students
const result = await promoteStudentsToNextSemester({ program: 'IMT' });

// Result:
{
  success: true,
  promoted: 15,
  message: "Successfully promoted 15 student(s) to next semester",
  details: {
    eligible: 20,
    withApprovedRegistration: 15,
    actuallyPromoted: 15
  }
}
```

### Testing

```bash
# Get promotion statistics
curl -X GET http://localhost:5000/api/admin/promotion-stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Promote all eligible students
curl -X POST http://localhost:5000/api/admin/promote-semester \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"promoteAll": true}'

# Promote only IMT students
curl -X POST http://localhost:5000/api/admin/promote-semester \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"program": "IMT"}'
```

---

## 📄 Feature 2: PDF Upload → Subject Auto Update

### What It Does
Allows admins to upload a PDF file containing subject information, which is automatically parsed and inserted into the database.

### Key Components

**Controller:** `controllers/subjectUploadController.js`
- `parsePDFToSubjects()` - Extract structured data from PDF text
- `processSubjectPDF()` - Process PDF and update database
- `validateSubjectData()` - Validate parsed subject data

**Middleware:** `middleware/upload.js`
- Multer configuration for PDF upload
- File type validation (only PDFs)
- File size limit (10MB)

**API Endpoint:**
- `POST /api/admin/upload-subjects-pdf` - Upload PDF

### PDF Format

The system supports multiple PDF formats:

**Format 1: Simple List**
```
Program: IMT
Semester: 3
Academic Year: 2025-26

Core Subjects:
CS301 Data Structures (4 credits)
CS302 DBMS (3 credits)

Electives:
AI Basics (3 credits)
Web Development (3 credits)
```

**Format 2: Table Format**
```
Program: BCS
Semester: 4

Core Subjects:
CS206 | Theory of Computation | 3-0-0 | 3
CS207 | Operating Systems | 3-1-0 | 4

Electives:
CS301 | Machine Learning | 3-0-2 | 4
```

### Parsing Logic

1. **Extract Metadata:**
   - Program (e.g., IMT, BCS)
   - Semester (1-8)
   - Academic Year (e.g., 2025-26)

2. **Identify Sections:**
   - "Core Subjects" → type = 'core'
   - "Electives" → type = 'elective'

3. **Parse Subject Lines:**
   - Pattern 1: `CS301 Data Structures (4 credits)`
   - Pattern 2: `CS301 | Data Structures | 3-1-0 | 4`
   - Pattern 3: `Data Structures (4 credits)` (auto-generates code)

4. **Validation:**
   - No duplicate subject codes
   - Credits must be numeric and positive
   - Program and semester must be present

5. **Database Update:**
   - Delete existing subjects for: `program + semester + academicYear`
   - Insert new subjects from PDF

### Usage Example

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/admin/upload-subjects-pdf \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "pdf=@subjects.pdf"
```

**Using Postman:**
1. Method: POST
2. URL: `http://localhost:5000/api/admin/upload-subjects-pdf`
3. Headers: `Authorization: Bearer ADMIN_TOKEN`
4. Body: form-data
   - Key: `pdf` (type: File)
   - Value: Select your PDF file

**Response:**
```json
{
  "success": true,
  "message": "Successfully uploaded 6 subjects for IMT Semester 3",
  "details": {
    "program": "IMT",
    "semester": 3,
    "academicYear": "2025-26",
    "deletedCount": 4,
    "insertedCount": 6,
    "subjects": [...]
  }
}
```

### Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "PDF appears to be empty" | PDF could not be read | Ensure PDF is not password-protected or corrupted |
| "Could not extract Program and Semester" | Missing metadata | Add "Program: XXX" and "Semester: X" to PDF |
| "No subjects found in PDF" | Format not recognized | Check PDF format matches expected patterns |
| "Duplicate subject codes found" | Same code appears twice | Ensure unique subject codes |
| "Invalid credits" | Credits not numeric | Ensure credits are numbers (e.g., 4, not "four") |

---

## 🎯 Feature 3: Dynamic Subject Fetch for Students

### What It Does
Students automatically see subjects relevant to their program and current semester without manual filtering.

### Key Components

**Controller:** `controllers/studentSubjectController.js`
- `getSubjectsForStudent()` - Fetch subjects based on student profile
- `selectSubjectsForStudent()` - Select subjects with validation
- `getSubjectSelectionSummary()` - Get selection summary

**API Endpoints:**
- `GET /api/subjects` - Get subjects (automatic for students)
- `POST /api/subjects/select` - Select subjects
- `GET /api/subjects/selection-summary` - Get selection summary

### How It Works

1. **Automatic Detection:**
   - System reads student's `program` and `currentSemester` from their profile
   - Fetches subjects matching: `program + currentSemester`
   - No query parameters needed from frontend

2. **Subject Categorization:**
   - **Core Subjects:** Auto-selected, cannot be removed
   - **Elective Subjects:** Student can select/deselect

3. **Validation:**
   - All core subjects must be included
   - Total credits (selected + backlog) ≤ 32
   - All subject IDs must exist

4. **Error Handling:**
   - If no subjects found: Returns error message
   - Message: "Subjects not uploaded yet by admin for {program} Semester {semester}"

### Usage Example

**Student Fetches Subjects:**
```javascript
// Frontend code (no parameters needed)
const response = await api.get('/subjects');

// Response:
[
  {
    "_id": "...",
    "subjectCode": "CS301",
    "subjectName": "Data Structures",
    "credits": 4,
    "type": "core",
    "program": "IMT",
    "semester": 3
  },
  // ... more subjects
]
```

**Student Selects Subjects:**
```javascript
const response = await api.post('/subjects/select', {
  subjectIds: ['id1', 'id2', 'id3'],
  backlogSubjectIds: []
});

// Response:
{
  "success": true,
  "message": "Subjects selected successfully",
  "totalCredits": 24,
  "selectedCount": 6,
  "backlogCount": 0
}
```

### Validation Rules

1. **Core Subjects:**
   - Must include ALL core subjects for the semester
   - Cannot be removed
   - Error if missing: "Core subjects cannot be removed. Missing: {list}"

2. **Credit Limit:**
   - Maximum 32 credits total
   - Includes both selected and backlog subjects
   - Error if exceeded: "Total credits ({total}) exceed the maximum allowed limit of 32"

3. **Subject Existence:**
   - All subject IDs must exist in database
   - Error if not found: "Some selected subjects were not found"

---

## 🗄️ Database Schema Updates

### Student Model

**New Fields:**
```javascript
{
  currentSemester: Number,        // For promotion tracking (1-8)
  batchYear: Number,              // e.g., 2025
  overallStatus: String,          // 'active', 'final_approved', 'pending', 'inactive'
  lastPromotedAt: Date,           // Prevents double promotion
}
```

**Backward Compatibility:**
- `semester` field is maintained and synced with `currentSemester`

### Subject Model

**New Schema:**
```javascript
{
  subjectCode: String,            // Unique identifier (e.g., CS301)
  subjectName: String,            // Full name
  credits: Number,                // Credit value
  type: String,                   // 'core' or 'elective'
  program: String,                // Single program (IMT, BCS, etc.)
  semester: Number,               // Semester number (1-8)
  academicYear: String,           // e.g., "2025-26"
  ltp: String,                    // Optional: Lecture-Tutorial-Practical
  
  // Backward compatibility
  code: String,                   // Alias for subjectCode
  name: String,                   // Alias for subjectName
  programs: [String]              // Array version
}
```

**Indexes:**
```javascript
{ program: 1, semester: 1, academicYear: 1 }  // Compound index for efficient queries
```

---

## 🧪 Testing Guide

### 1. Test Semester Promotion

```bash
# Step 1: Check current student semesters
curl -X GET http://localhost:5000/api/admin/students \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Step 2: Get promotion statistics
curl -X GET http://localhost:5000/api/admin/promotion-stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Step 3: Promote students
curl -X POST http://localhost:5000/api/admin/promote-semester \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"program": "IMT"}'

# Step 4: Verify promotion
curl -X GET http://localhost:5000/api/admin/students \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 2. Test PDF Upload

```bash
# Step 1: Create a test PDF with subject data
# (Use the format from utils/sampleSubjectPDF.txt)

# Step 2: Upload PDF
curl -X POST http://localhost:5000/api/admin/upload-subjects-pdf \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "pdf=@test_subjects.pdf"

# Step 3: Verify subjects were created
curl -X GET "http://localhost:5000/api/admin/subjects?program=IMT&semester=3" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Step 4: Test error handling (upload non-PDF)
curl -X POST http://localhost:5000/api/admin/upload-subjects-pdf \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "pdf=@test.txt"
```

### 3. Test Dynamic Subject Fetch

```bash
# Step 1: Login as student
curl -X POST http://localhost:5000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"rollNo": "2025IMT-015", "password": "Student@123"}'

# Step 2: Fetch subjects (automatic based on student profile)
curl -X GET http://localhost:5000/api/subjects \
  -H "Authorization: Bearer STUDENT_TOKEN"

# Step 3: Get selection summary
curl -X GET http://localhost:5000/api/subjects/selection-summary \
  -H "Authorization: Bearer STUDENT_TOKEN"

# Step 4: Select subjects
curl -X POST http://localhost:5000/api/subjects/select \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectIds": ["subject_id_1", "subject_id_2"],
    "backlogSubjectIds": []
  }'

# Step 5: Test validation (exceed credit limit)
curl -X POST http://localhost:5000/api/subjects/select \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectIds": ["id1", "id2", "id3", "id4", "id5", "id6", "id7", "id8", "id9"],
    "backlogSubjectIds": []
  }'
```

---

## 🔧 Configuration

### Environment Variables

No new environment variables required. Uses existing:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret for authentication
- `PORT` - Server port (default: 5000)

### Dependencies

New package installed:
```json
{
  "pdf-parse": "^1.1.1"
}
```

Existing packages used:
- `multer` - File upload handling
- `mongoose` - MongoDB ODM
- `express` - Web framework

---

## 📊 Performance Considerations

### Semester Promotion
- Uses `bulkWrite` for atomic batch updates
- Efficient query with compound conditions
- Prevents N+1 queries with `distinct` for registration check

### PDF Upload
- Memory storage (no disk I/O for temp files)
- 10MB file size limit to prevent memory issues
- Batch insert with `insertMany` for efficiency

### Dynamic Subject Fetch
- Compound index on `(program, semester, academicYear)`
- Single query to fetch all subjects
- Cached in frontend after first fetch

---

## 🐛 Troubleshooting

### Issue: Promotion not working

**Symptoms:** Students not being promoted

**Possible Causes:**
1. No students with `final_approved` registration
2. Students already at semester 8
3. Students promoted in last month

**Solution:**
```bash
# Check promotion stats
curl -X GET http://localhost:5000/api/admin/promotion-stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Check student registration status
curl -X GET http://localhost:5000/api/admin/registrations \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Issue: PDF parsing fails

**Symptoms:** "Could not extract Program and Semester"

**Possible Causes:**
1. PDF format doesn't match expected patterns
2. PDF is password-protected or corrupted
3. Text extraction failed

**Solution:**
1. Check PDF format matches sample in `utils/sampleSubjectPDF.txt`
2. Ensure PDF contains "Program: XXX" and "Semester: X"
3. Try converting PDF to text first to verify content

### Issue: Students see "Subjects not uploaded yet"

**Symptoms:** Empty subject list for students

**Possible Causes:**
1. Subjects not uploaded for that program/semester
2. Student's `currentSemester` or `program` is incorrect
3. Subject `program` field doesn't match student's program

**Solution:**
```bash
# Check student profile
curl -X GET http://localhost:5000/api/student/profile \
  -H "Authorization: Bearer STUDENT_TOKEN"

# Check available subjects
curl -X GET "http://localhost:5000/api/admin/subjects?program=IMT&semester=2" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Upload subjects if missing
curl -X POST http://localhost:5000/api/admin/upload-subjects-pdf \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "pdf=@subjects.pdf"
```

---

## 📝 Best Practices

### For Admins

1. **Before Promotion:**
   - Verify all registrations are approved
   - Check promotion statistics
   - Test with a small batch first

2. **PDF Upload:**
   - Use consistent format across all PDFs
   - Verify PDF content before upload
   - Keep backup of original PDFs
   - Test with one program/semester first

3. **Subject Management:**
   - Upload subjects before semester starts
   - Use clear, consistent subject codes
   - Verify subjects after upload

### For Developers

1. **Error Handling:**
   - Always wrap async operations in try-catch
   - Return user-friendly error messages
   - Log detailed errors for debugging

2. **Validation:**
   - Validate input at controller level
   - Use Mongoose schema validation
   - Return specific validation errors

3. **Performance:**
   - Use indexes for frequent queries
   - Batch operations when possible
   - Avoid N+1 query problems

---

## 🔐 Security Considerations

1. **File Upload:**
   - Only PDFs allowed (MIME type validation)
   - 10MB file size limit
   - Memory storage (no disk persistence)
   - Admin-only access

2. **Promotion:**
   - Admin-only access
   - Prevents double promotion (time-based check)
   - Atomic operations (bulkWrite)

3. **Subject Selection:**
   - Student can only select for themselves
   - Validation prevents credit limit bypass
   - Core subjects cannot be removed

---

## 📚 Additional Resources

- **API Documentation:** `docs/NEW_FEATURES_API.md`
- **Sample PDF Format:** `utils/sampleSubjectPDF.txt`
- **Controllers:** `controllers/` directory
- **Models:** `models/` directory

---

## 🎉 Summary

All three features are now fully implemented and production-ready:

✅ **Semester Promotion System** - Bulk promote students efficiently
✅ **PDF Upload → Subject Auto Update** - Parse and upload subjects from PDF
✅ **Dynamic Subject Fetch** - Students see relevant subjects automatically

The implementation follows:
- Clean MVC architecture
- Proper error handling
- Comprehensive validation
- Efficient database operations
- Production-ready code quality
