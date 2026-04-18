import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Subject from '../models/Subject.js';
import Registration from '../models/Registration.js';

const router = express.Router();

// Seed subjects from Subjects.pdf data (called once by admin)
const SUBJECTS_DATA = [
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

// Get all subjects (filter by program & semester)
router.get('/', protect, async (req, res) => {
  try {
    const { program, semester, batch } = req.query;
    const filter = {};
    if (program) filter.programs = program;
    if (semester) filter.semester = parseInt(semester);
    if (batch) filter.batch = parseInt(batch);
    
    const subjects = await Subject.find(filter);
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Select subjects for registration
router.post('/select', protect, authorize('student'), async (req, res) => {
  try {
    const { subjectIds, backlogSubjectIds } = req.body;
    
    // Validate credits
    const selected = await Subject.find({ _id: { $in: subjectIds } });
    const backlog = await Subject.find({ _id: { $in: backlogSubjectIds || [] } });
    
    const totalCredits = [...selected, ...backlog].reduce((sum, s) => sum + s.credits, 0);
    
    if (totalCredits > 32) {
      return res.status(400).json({ message: `Total credits (${totalCredits}) exceed the maximum allowed limit of 32` });
    }
    
    const reg = await Registration.findOneAndUpdate(
      { studentId: req.user.id },
      {
        selectedSubjects: subjectIds,
        backlogSubjects: backlogSubjectIds || [],
        totalCredits,
        subjectsSelected: true
      },
      { new: true }
    ).populate('selectedSubjects backlogSubjects');
    
    if (!reg) return res.status(404).json({ message: 'Registration not found. Please initialize registration first.' });
    
    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seed subjects (admin only)
router.post('/seed', protect, authorize('admin'), async (req, res) => {
  try {
    await Subject.deleteMany({});
    await Subject.insertMany(SUBJECTS_DATA);
    res.json({ message: `Seeded ${SUBJECTS_DATA.length} subjects successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
