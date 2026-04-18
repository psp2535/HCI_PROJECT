import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Student from '../models/Student.js';
import Staff from '../models/Staff.js';
import Registration from '../models/Registration.js';
import Payment from '../models/Payment.js';
import Receipt from '../models/Receipt.js';
import Subject from '../models/Subject.js';
import { promoteStudentsToNextSemester, getPromotionStats } from '../controllers/promotionController.js';
import { processSubjectPDF } from '../controllers/subjectUploadController.js';
import { uploadSubjectPDF, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// ── Dashboard stats ──────────────────────────────────────────
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalStudents, totalRegistrations, pendingPayments, verifiedPayments,
      facultyPending, finalApproved, totalReceipts] = await Promise.all([
      Student.countDocuments(),
      Registration.countDocuments(),
      Payment.countDocuments({ status: 'submitted' }),
      Payment.countDocuments({ status: 'verified' }),
      Registration.countDocuments({ verificationStatus: 'approved', facultyApprovalStatus: 'pending' }),
      Registration.countDocuments({ overallStatus: 'final_approved' }),
      Receipt.countDocuments()
    ]);

    res.json({ totalStudents, totalRegistrations, pendingPayments, verifiedPayments, facultyPending, finalApproved, totalReceipts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Students management ───────────────────────────────────────
router.get('/students', protect, authorize('admin'), async (req, res) => {
  try {
    const students = await Student.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/students', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.create({ ...req.body, passwordHash: req.body.password });
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/students/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Staff management ─────────────────────────────────────────
router.get('/staff', protect, authorize('admin'), async (req, res) => {
  try {
    const staff = await Staff.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/staff', protect, authorize('admin'), async (req, res) => {
  try {
    const staff = await Staff.create({ ...req.body, passwordHash: req.body.password });
    res.status(201).json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Registrations overview ────────────────────────────────────
router.get('/registrations', protect, authorize('admin'), async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('studentId', 'name rollNo program semester email')
      .populate('selectedSubjects', 'code name credits')
      .sort({ updatedAt: -1 });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Final admin approval ──────────────────────────────────────
router.post('/final-approve/:registrationId', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, remarks } = req.body;
    const update = action === 'approve'
      ? { adminApprovalStatus: 'approved', adminRemarks: remarks, approvedByAdmin: req.user.id, adminApprovedAt: new Date(), overallStatus: 'final_approved' }
      : { adminApprovalStatus: 'rejected', adminRemarks: remarks, overallStatus: 'rejected' };

    const reg = await Registration.findByIdAndUpdate(req.params.registrationId, update, { new: true })
      .populate('studentId', 'name rollNo');

    res.json({ message: `Registration ${action}d`, registration: reg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Seed demo data ────────────────────────────────────────────
router.post('/seed-demo', async (req, res) => {
  try {
    // Create demo students
    const demoStudents = [
      { rollNo: '2023IMT-001', name: 'Rahul Sharma', email: 'rahul@iiitm.ac.in', passwordHash: 'Student@123', program: 'IMT', batch: '2023', batchYear: 2023, semester: 6, currentSemester: 6, overallStatus: 'active', abcId: 'ABC123456789', mobile: '9876543210' },
      { rollNo: '2024BCS-042', name: 'Priya Singh', email: 'priya@iiitm.ac.in', passwordHash: 'Student@123', program: 'BCS', batch: '2024', batchYear: 2024, semester: 4, currentSemester: 4, overallStatus: 'active', abcId: 'ABC987654321', mobile: '9876543211' },
      { rollNo: '2025IMT-015', name: 'Arjun Verma', email: 'arjun@iiitm.ac.in', passwordHash: 'Student@123', program: 'IMT', batch: '2025', batchYear: 2025, semester: 2, currentSemester: 2, overallStatus: 'active', mobile: '9876543212' },
    ];

    for (const s of demoStudents) {
      const exists = await Student.findOne({ rollNo: s.rollNo });
      if (!exists) await Student.create(s);
    }

    // Create demo staff
    const demoStaff = [
      { employeeId: 'STAFF001', name: 'Mr. Rajesh Kumar', email: 'accounts@iiitm.ac.in', passwordHash: 'Staff@123', role: 'verification_staff', department: 'Accounts Section' },
      { employeeId: 'FAC001', name: 'Dr. Anil Gupta', email: 'faculty@iiitm.ac.in', passwordHash: 'Faculty@123', role: 'faculty', department: 'Computer Science', assignedPrograms: ['BCS', 'IMT'] },
      { employeeId: 'ADMIN001', name: 'Prof. S.K. Sharma', email: 'admin@iiitm.ac.in', passwordHash: 'Admin@123', role: 'admin', department: 'Administration' },
    ];

    for (const s of demoStaff) {
      const exists = await Staff.findOne({ employeeId: s.employeeId });
      if (!exists) await Staff.create(s);
    }

    // Seed subjects with updated schema
    const SUBJECTS_DATA = [
      { subjectCode: 'EE103', subjectName: 'Digital Electronics', ltp: '3-0-2', credits: 4, type: 'core', program: 'IMT', semester: 2, batch: 2025, academicYear: '2025-26' },
      { subjectCode: 'ES103', subjectName: 'Probability and Statistics', ltp: '3-1-0', credits: 4, type: 'core', program: 'IMT', semester: 2, batch: 2025, academicYear: '2025-26' },
      { subjectCode: 'CS102', subjectName: 'Data Structures', ltp: '3-1-0', credits: 4, type: 'core', program: 'IMT', semester: 2, batch: 2025, academicYear: '2025-26' },
      { subjectCode: 'EE104', subjectName: 'Hardware Workshop', ltp: '0-0-6', credits: 3, type: 'core', program: 'IMT', semester: 2, batch: 2025, academicYear: '2025-26' },
      { subjectCode: 'CS103', subjectName: 'Object Oriented Programming', ltp: '3-1-0', credits: 4, type: 'core', program: 'IMT', semester: 2, batch: 2025, academicYear: '2025-26' },
      { subjectCode: 'HS103', subjectName: 'Ecology and Environment Sciences', ltp: '2-0-0', credits: 2, type: 'core', program: 'IMT', semester: 2, batch: 2025, academicYear: '2025-26' },
      { subjectCode: 'CS104', subjectName: 'Mobile Application Technologies', ltp: '2-0-0', credits: 2, type: 'core', program: 'IMT', semester: 2, batch: 2025, academicYear: '2025-26' },
      { subjectCode: 'HS202', subjectName: 'Entrepreneurship', ltp: '2-0-0', credits: 2, type: 'core', program: 'BCS', semester: 4, batch: 2024, academicYear: '2025-26' },
      { subjectCode: 'CS206', subjectName: 'Theory of Computation', ltp: '3-0-0', credits: 3, type: 'core', program: 'BCS', semester: 4, batch: 2024, academicYear: '2025-26' },
      { subjectCode: 'CS207', subjectName: 'Operating Systems', ltp: '3-1-0', credits: 4, type: 'core', program: 'BCS', semester: 4, batch: 2024, academicYear: '2025-26' },
      { subjectCode: 'CS208', subjectName: 'Computer Networks', ltp: '3-1-0', credits: 4, type: 'core', program: 'BCS', semester: 4, batch: 2024, academicYear: '2025-26' },
      { subjectCode: 'CS209', subjectName: 'Mathematical Foundations', ltp: '3-1-0', credits: 4, type: 'core', program: 'BCS', semester: 4, batch: 2024, academicYear: '2025-26' },
      { subjectCode: 'CS210', subjectName: 'Software Engineering', ltp: '3-1-0', credits: 4, type: 'core', program: 'BCS', semester: 4, batch: 2024, academicYear: '2025-26' },
      { subjectCode: 'CS301', subjectName: 'Deep Learning', ltp: '3-0-2', credits: 4, type: 'elective', program: 'IMT', semester: 6, batch: 2023, academicYear: '2025-26' },
      { subjectCode: 'CS302', subjectName: 'Machine Learning', ltp: '3-0-2', credits: 4, type: 'elective', program: 'IMT', semester: 6, batch: 2023, academicYear: '2025-26' },
      { subjectCode: 'CS303', subjectName: 'Cryptography and Network Security', ltp: '3-0-0', credits: 3, type: 'elective', program: 'IMT', semester: 6, batch: 2023, academicYear: '2025-26' },
      { subjectCode: 'CS304', subjectName: 'Internet of Things', ltp: '3-0-2', credits: 4, type: 'elective', program: 'IMT', semester: 6, batch: 2023, academicYear: '2025-26' },
      { subjectCode: 'CS305', subjectName: 'Cloud Computing', ltp: '3-0-0', credits: 3, type: 'elective', program: 'IMT', semester: 6, batch: 2023, academicYear: '2025-26' },
      { subjectCode: 'CS306', subjectName: 'Generative AI', ltp: '3-0-2', credits: 4, type: 'elective', program: 'IMT', semester: 6, batch: 2023, academicYear: '2025-26' },
    ];

    const subjectCount = await Subject.countDocuments();
    if (subjectCount === 0) await Subject.insertMany(SUBJECTS_DATA);

    res.json({ message: 'Demo data seeded successfully', credentials: {
      students: [
        { rollNo: '2023IMT-001', password: 'Student@123' },
        { rollNo: '2024BCS-042', password: 'Student@123' },
        { rollNo: '2025IMT-015', password: 'Student@123' },
      ],
      staff: [
        { employeeId: 'STAFF001', password: 'Staff@123', role: 'Verification Staff' },
        { employeeId: 'FAC001', password: 'Faculty@123', role: 'Faculty' },
        { employeeId: 'ADMIN001', password: 'Admin@123', role: 'Admin' },
      ]
    }});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// FEATURE 1: SEMESTER PROMOTION SYSTEM
// ══════════════════════════════════════════════════════════════

// ── Promote students to next semester ─────────────────────────
router.post('/promote-semester', protect, authorize('admin'), async (req, res) => {
  try {
    const { program, batchYear, promoteAll } = req.body;

    // Build filters
    const filters = {};
    if (!promoteAll) {
      if (program) filters.program = program;
      if (batchYear) filters.batchYear = parseInt(batchYear);
    }

    // Perform promotion
    const result = await promoteStudentsToNextSemester(filters);

    res.json(result);
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ── Get promotion statistics ──────────────────────────────────
router.get('/promotion-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await getPromotionStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// FEATURE 2: PDF UPLOAD → SUBJECT AUTO UPDATE
// ══════════════════════════════════════════════════════════════

// ── Upload subjects PDF ───────────────────────────────────────
router.post('/upload-subjects-pdf', protect, authorize('admin'), uploadSubjectPDF, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No PDF file uploaded. Please upload a PDF file.' 
      });
    }

    // Process the PDF buffer
    const result = await processSubjectPDF(req.file.buffer);

    res.json(result);
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ── Get subjects by program and semester ──────────────────────
router.get('/subjects', protect, authorize('admin'), async (req, res) => {
  try {
    const { program, semester, academicYear } = req.query;
    
    const filter = {};
    if (program) filter.program = program;
    if (semester) filter.semester = parseInt(semester);
    if (academicYear) filter.academicYear = academicYear;

    const subjects = await Subject.find(filter).sort({ type: 1, subjectCode: 1 });
    
    res.json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// ── Delete subjects by program and semester ───────────────────
router.delete('/subjects', protect, authorize('admin'), async (req, res) => {
  try {
    const { program, semester, academicYear } = req.query;
    
    if (!program || !semester) {
      return res.status(400).json({ 
        success: false,
        message: 'Program and semester are required' 
      });
    }

    const filter = { 
      program, 
      semester: parseInt(semester) 
    };
    if (academicYear) filter.academicYear = academicYear;

    const result = await Subject.deleteMany(filter);
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} subjects`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

export default router;
