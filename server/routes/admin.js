import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Student from '../models/Student.js';
import Staff from '../models/Staff.js';
import Registration from '../models/Registration.js';
import Payment from '../models/Payment.js';
import Receipt from '../models/Receipt.js';
import Subject from '../models/Subject.js';

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
      { rollNo: '2023IMT-001', name: 'Rahul Sharma', email: 'rahul@iiitm.ac.in', passwordHash: 'Student@123', program: 'IMT', batch: '2023', semester: 6, abcId: 'ABC123456789', mobile: '9876543210' },
      { rollNo: '2024BCS-042', name: 'Priya Singh', email: 'priya@iiitm.ac.in', passwordHash: 'Student@123', program: 'BCS', batch: '2024', semester: 4, abcId: 'ABC987654321', mobile: '9876543211' },
      { rollNo: '2025IMT-015', name: 'Arjun Verma', email: 'arjun@iiitm.ac.in', passwordHash: 'Student@123', program: 'IMT', batch: '2025', semester: 2, mobile: '9876543212' },
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

    // Seed subjects
    const SUBJECTS_DATA = [
      { code: 'EE103', name: 'Digital Electronics', ltp: '3-0-2', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
      { code: 'ES103', name: 'Probability and Statistics', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
      { code: 'CS102', name: 'Data Structures', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
      { code: 'EE104', name: 'Hardware Workshop', ltp: '0-0-6', credits: 3, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
      { code: 'CS103', name: 'Object Oriented Programming', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
      { code: 'HS103', name: 'Ecology and Environment Sciences', ltp: '2-0-0', credits: 2, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
      { code: 'CS104', name: 'Mobile Application Technologies', ltp: '2-0-0', credits: 2, type: 'core', programs: ['BCS', 'IMT'], semester: 2, batch: 2025 },
      { code: 'HS202', name: 'Entrepreneurship', ltp: '2-0-0', credits: 2, type: 'core', programs: ['BCS', 'IMT'], semester: 4, batch: 2024 },
      { code: 'CS206', name: 'Theory of Computation', ltp: '3-0-0', credits: 3, type: 'core', programs: ['BCS', 'IMT'], semester: 4, batch: 2024 },
      { code: 'CS207', name: 'Operating Systems', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT'], semester: 4, batch: 2024 },
      { code: 'CS208', name: 'Computer Networks', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT'], semester: 4, batch: 2024 },
      { code: 'CS209', name: 'Mathematical Foundations', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS'], semester: 4, batch: 2024 },
      { code: 'CS210', name: 'Software Engineering', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS'], semester: 4, batch: 2024 },
      { code: 'CS301', name: 'Deep Learning', ltp: '3-0-2', credits: 4, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
      { code: 'CS302', name: 'Machine Learning', ltp: '3-0-2', credits: 4, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
      { code: 'CS303', name: 'Cryptography and Network Security', ltp: '3-0-0', credits: 3, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
      { code: 'CS304', name: 'Internet of Things', ltp: '3-0-2', credits: 4, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
      { code: 'CS305', name: 'Cloud Computing', ltp: '3-0-0', credits: 3, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
      { code: 'CS306', name: 'Generative AI', ltp: '3-0-2', credits: 4, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
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

export default router;
