# New Features API Documentation

## Feature 1: Semester Promotion System

### Promote Students to Next Semester

**Endpoint:** `POST /api/admin/promote-semester`

**Authorization:** Admin only

**Request Body:**
```json
{
  "promoteAll": false,
  "program": "IMT",      // Optional: Filter by program
  "batchYear": 2025      // Optional: Filter by batch year
}
```

**Response:**
```json
{
  "success": true,
  "promoted": 15,
  "message": "Successfully promoted 15 student(s) to next semester",
  "details": {
    "eligible": 20,
    "withApprovedRegistration": 15,
    "actuallyPromoted": 15
  }
}
```

**Business Rules:**
- Only promotes students with `overallStatus = "final_approved"` in their latest registration
- Maximum semester is 8 (will not promote beyond)
- Prevents double promotion using `lastPromotedAt` (must be > 1 month ago)
- Uses MongoDB `bulkWrite` for efficiency
- Increments both `currentSemester` and `semester` fields
- Resets `overallStatus` to "active" for new semester

**Examples:**

Promote all eligible students:
```bash
curl -X POST http://localhost:5000/api/admin/promote-semester \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"promoteAll": true}'
```

Promote only IMT students:
```bash
curl -X POST http://localhost:5000/api/admin/promote-semester \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"program": "IMT"}'
```

Promote 2025 batch students:
```bash
curl -X POST http://localhost:5000/api/admin/promote-semester \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"batchYear": 2025}'
```

---

### Get Promotion Statistics

**Endpoint:** `GET /api/admin/promotion-stats`

**Authorization:** Admin only

**Response:**
```json
{
  "distributionByProgramAndSemester": [
    {
      "_id": { "program": "IMT", "semester": 2 },
      "count": 45
    },
    {
      "_id": { "program": "BCS", "semester": 4 },
      "count": 38
    }
  ],
  "eligibleForPromotion": 120,
  "withApprovedRegistration": 95
}
```

---

## Feature 2: PDF Upload → Subject Auto Update

### Upload Subjects PDF

**Endpoint:** `POST /api/admin/upload-subjects-pdf`

**Authorization:** Admin only

**Content-Type:** `multipart/form-data`

**Form Data:**
- `pdf`: PDF file (max 10MB)

**Expected PDF Format:**
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

**Parsing Rules:**
- Extracts `Program`, `Semester`, and `Academic Year` from PDF text
- Identifies sections: "Core Subjects" and "Electives"
- Parses subject lines with patterns:
  - `CS301 Data Structures (4 credits)`
  - `CS301 | Data Structures | 3-1-0 | 4`
  - `Data Structures (4 credits)` (generates code automatically)
- Validates:
  - No duplicate subject codes
  - Credits must be numeric and positive
  - Program and semester must be present

**Database Logic:**
1. Deletes existing subjects for: `program + semester + academicYear`
2. Inserts new subjects from PDF
3. Creates compound index on `program`, `semester`, `academicYear`

**Example (using curl):**
```bash
curl -X POST http://localhost:5000/api/admin/upload-subjects-pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "pdf=@subjects.pdf"
```

**Example (using Postman):**
1. Select POST method
2. URL: `http://localhost:5000/api/admin/upload-subjects-pdf`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Body: Select "form-data"
5. Key: `pdf` (change type to "File")
6. Value: Select your PDF file

---

### Get Subjects (Admin)

**Endpoint:** `GET /api/admin/subjects`

**Authorization:** Admin only

**Query Parameters:**
- `program` (optional): Filter by program (e.g., IMT, BCS)
- `semester` (optional): Filter by semester (1-8)
- `academicYear` (optional): Filter by academic year (e.g., 2025-26)

**Response:**
```json
{
  "success": true,
  "count": 8,
  "subjects": [
    {
      "_id": "...",
      "subjectCode": "CS301",
      "subjectName": "Data Structures",
      "credits": 4,
      "type": "core",
      "program": "IMT",
      "semester": 3,
      "academicYear": "2025-26"
    }
  ]
}
```

---

### Delete Subjects

**Endpoint:** `DELETE /api/admin/subjects`

**Authorization:** Admin only

**Query Parameters:**
- `program` (required): Program code
- `semester` (required): Semester number
- `academicYear` (optional): Academic year

**Response:**
```json
{
  "success": true,
  "message": "Deleted 8 subjects",
  "deletedCount": 8
}
```

---

## Feature 3: Dynamic Subject Fetch for Students

### Get Subjects for Current Student

**Endpoint:** `GET /api/subjects`

**Authorization:** Student only

**Behavior:**
- Automatically fetches subjects based on student's `program` and `currentSemester`
- No query parameters needed
- Returns error if subjects not uploaded by admin

**Response (Success):**
```json
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
  {
    "_id": "...",
    "subjectCode": "CS401",
    "subjectName": "AI Basics",
    "credits": 3,
    "type": "elective",
    "program": "IMT",
    "semester": 3
  }
]
```

**Response (No Subjects Found):**
```json
{
  "success": false,
  "message": "Subjects not uploaded yet by admin for IMT Semester 3",
  "subjects": []
}
```

---

### Get Subject Selection Summary

**Endpoint:** `GET /api/subjects/selection-summary`

**Authorization:** Student only

**Response:**
```json
{
  "student": {
    "name": "Rahul Sharma",
    "rollNo": "2023IMT-001",
    "program": "IMT",
    "semester": 3
  },
  "registration": {
    "selectedSubjects": [...],
    "totalCredits": 24,
    "subjectsSelected": true
  },
  "availableSubjects": [...],
  "totalCreditsSelected": 24,
  "subjectsSelected": true
}
```

---

### Select Subjects

**Endpoint:** `POST /api/subjects/select`

**Authorization:** Student only

**Request Body:**
```json
{
  "subjectIds": [
    "subject_id_1",
    "subject_id_2",
    "subject_id_3"
  ],
  "backlogSubjectIds": [
    "backlog_subject_id_1"
  ]
}
```

**Validations:**
- All core subjects must be included (cannot be removed)
- Total credits (selected + backlog) must not exceed 32
- All subject IDs must exist in database
- Subjects must match student's program and semester

**Response (Success):**
```json
{
  "success": true,
  "message": "Subjects selected successfully",
  "registration": {...},
  "totalCredits": 28,
  "selectedCount": 6,
  "backlogCount": 1
}
```

**Response (Error - Credits Exceeded):**
```json
{
  "success": false,
  "message": "Total credits (35) exceed the maximum allowed limit of 32"
}
```

**Response (Error - Missing Core Subjects):**
```json
{
  "success": false,
  "message": "Core subjects cannot be removed. Missing: Data Structures, DBMS"
}
```

---

## Updated Student Model Fields

```javascript
{
  // ... existing fields ...
  
  currentSemester: Number,        // For promotion tracking
  batchYear: Number,              // e.g., 2025
  overallStatus: String,          // 'active', 'final_approved', 'pending', 'inactive'
  lastPromotedAt: Date,           // Prevents double promotion
  
  // Backward compatibility
  semester: Number                // Synced with currentSemester
}
```

---

## Updated Subject Model Fields

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

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Testing Workflow

### 1. Test Semester Promotion

```bash
# Get promotion stats
curl -X GET http://localhost:5000/api/admin/promotion-stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Promote students
curl -X POST http://localhost:5000/api/admin/promote-semester \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"program": "IMT"}'
```

### 2. Test PDF Upload

```bash
# Upload subjects PDF
curl -X POST http://localhost:5000/api/admin/upload-subjects-pdf \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "pdf=@subjects.pdf"

# Verify uploaded subjects
curl -X GET "http://localhost:5000/api/admin/subjects?program=IMT&semester=3" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 3. Test Dynamic Subject Fetch (Student)

```bash
# Student fetches subjects (automatic based on their program/semester)
curl -X GET http://localhost:5000/api/subjects \
  -H "Authorization: Bearer STUDENT_TOKEN"

# Student selects subjects
curl -X POST http://localhost:5000/api/subjects/select \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectIds": ["subject_id_1", "subject_id_2"],
    "backlogSubjectIds": []
  }'
```

---

## Database Indexes

For optimal performance, the following indexes are created:

```javascript
// Subject model
{ program: 1, semester: 1, academicYear: 1 }

// Student model (existing)
{ rollNo: 1 }
{ email: 1 }
```

---

## Notes

1. **Backward Compatibility**: The system maintains backward compatibility with existing `semester` and `programs` fields
2. **Atomic Operations**: Promotion uses `bulkWrite` for atomic updates
3. **Validation**: All endpoints include comprehensive validation
4. **Error Messages**: User-friendly error messages for all failure scenarios
5. **File Size Limit**: PDF uploads limited to 10MB
6. **Credit Limit**: Hard limit of 32 credits per semester
7. **Core Subjects**: Cannot be deselected by students
