import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Subject from '../models/Subject.js';
import Registration from '../models/Registration.js';
import Student from '../models/Student.js';
import { getSubjectsForStudent, selectSubjectsForStudent, getSubjectSelectionSummary } from '../controllers/studentSubjectController.js';

const router = express.Router();

// Seed subjects from Subjects.pdf data (called once by admin)
const SUBJECTS_DATA = [
  // 2025 Batch - Semester I
  { code: 'MA101', name: 'Mathematics I', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 1, batch: 2025 },
  { code: 'PH101', name: 'Physics I', ltp: '3-0-2', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 1, batch: 2025 },
  { code: 'CH101', name: 'Chemistry I', ltp: '3-0-2', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 1, batch: 2025 },
  { code: 'CS101', name: 'Programming Fundamentals', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 1, batch: 2025 },
  { code: 'EE101', name: 'Basic Electrical Engineering', ltp: '3-0-2', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 1, batch: 2025 },
  { code: 'ME101', name: 'Basic Mechanical Engineering', ltp: '3-0-2', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 1, batch: 2025 },
  { code: 'HS101', name: 'Communication Skills', ltp: '2-0-2', credits: 3, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 1, batch: 2025 },
  { code: 'ES101', name: 'Engineering Workshop', ltp: '0-0-3', credits: 2, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 1, batch: 2025 },

  // 2025 Batch - Semester II
  { code: 'EE103', name: 'Digital Electronics', ltp: '3-0-2', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
  { code: 'ES103', name: 'Probability and Statistics', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
  { code: 'CS102', name: 'Data Structures', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
  { code: 'EE104', name: 'Hardware Workshop', ltp: '0-0-6', credits: 3, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
  { code: 'CS103', name: 'Object Oriented Programming', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
  { code: 'HS103', name: 'Ecology and Environment Sciences', ltp: '2-0-0', credits: 2, type: 'core', programs: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS'], semester: 2, batch: 2025 },
  { code: 'CS104', name: 'Mobile Application Technologies', ltp: '2-0-0', credits: 2, type: 'core', programs: ['BCS', 'IMT'], semester: 2, batch: 2025 },

  // 2024 Batch - Semester IV (BCS/IMT)
  { code: 'HS202', name: 'Entrepreneurship', ltp: '2-0-0', credits: 2, type: 'core', programs: ['BCS', 'IMT'], semester: 4, batch: 2024 },
  { code: 'CS206', name: 'Theory of Computation', ltp: '3-0-0', credits: 3, type: 'core', programs: ['BCS', 'IMT'], semester: 4, batch: 2024 },
  { code: 'CS207', name: 'Operating Systems', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT'], semester: 4, batch: 2024 },
  { code: 'CS208', name: 'Computer Networks', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS', 'IMT'], semester: 4, batch: 2024 },
  { code: 'CS209', name: 'Mathematical Foundations', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS'], semester: 4, batch: 2024 },
  { code: 'IT209', name: 'Graph Theory', ltp: '3-1-0', credits: 4, type: 'core', programs: ['IMT'], semester: 4, batch: 2024 },
  { code: 'CS210', name: 'Software Engineering', ltp: '3-1-0', credits: 4, type: 'core', programs: ['BCS'], semester: 4, batch: 2024 },

  // 2023 Batch - Semester VI (Electives)
  { code: 'CS301', name: 'Deep Learning', ltp: '3-0-2', credits: 4, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
  { code: 'CS302', name: 'Machine Learning', ltp: '3-0-2', credits: 4, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
  { code: 'CS303', name: 'Cryptography and Network Security', ltp: '3-0-0', credits: 3, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
  { code: 'CS304', name: 'Internet of Things', ltp: '3-0-2', credits: 4, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
  { code: 'CS305', name: 'Cloud Computing', ltp: '3-0-0', credits: 3, type: 'elective', programs: ['BCS', 'IMT'], semester: 6, batch: 2023 },
];

// ══════════════════════════════════════════════════════════════
// FEATURE 3: DYNAMIC SUBJECT FETCH FOR STUDENTS
// ══════════════════════════════════════════════════════════════

// Get subjects dynamically based on student's program and current semester
router.get('/', protect, async (req, res) => {
  try {
    // If student is requesting, use dynamic fetch
    if (req.user.role === 'student') {
      const result = await getSubjectsForStudent(req.user.id);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
          subjects: []
        });
      }
      
      return res.json(result.subjects);
    }
    
    // For admin/faculty, allow query-based filtering
    const { program, semester, batch } = req.query;
    const filter = {};
    if (program) filter.program = program;
    if (semester) filter.semester = parseInt(semester);
    if (batch) filter.batch = parseInt(batch);
    
    const subjects = await Subject.find(filter);
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Get subject selection summary for student
router.get('/selection-summary', protect, authorize('student'), async (req, res) => {
  try {
    const summary = await getSubjectSelectionSummary(req.user.id);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Select subjects for registration with validation
router.post('/select', protect, authorize('student'), async (req, res) => {
  try {
    const { subjectIds, backlogSubjectIds } = req.body;
    
    if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Please select at least one subject' 
      });
    }
    
    const result = await selectSubjectsForStudent(
      req.user.id, 
      subjectIds, 
      backlogSubjectIds || []
    );
    
    res.json(result);
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Get available subjects for current student (based on their program and semester)
router.get('/available', protect, authorize('student'), async (req, res) => {
  try {
    // Get student's current details
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    // Get available subjects for student's program and semester
    const subjects = await Subject.find({
      program: student.program,
      semester: student.semester
    }).sort({ type: 1, code: 1 });

    // Separate core and elective subjects
    const coreSubjects = subjects.filter(subject => subject.type === 'core');
    const electiveSubjects = subjects.filter(subject => subject.type === 'elective');

    res.json({
      success: true,
      program: student.program,
      semester: student.semester,
      totalSubjects: subjects.length,
      coreSubjects,
      electiveSubjects,
      allSubjects: subjects
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

export default router;
