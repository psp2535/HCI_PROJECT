import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, authorize } from '../middleware/auth.js';
import Student from '../models/Student.js';
import Registration from '../models/Registration.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Get student profile
router.get('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-passwordHash');
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update personal info
router.put('/profile', protect, authorize('student'), async (req, res) => {
  try {
    const updates = req.body;
    delete updates.passwordHash;
    delete updates.rollNo;
    
    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { ...updates, profileCompleted: true },
      { new: true }
    ).select('-passwordHash');
    
    // Update registration personal info status
    await Registration.findOneAndUpdate(
      { studentId: req.user.id },
      { personalInfoCompleted: true },
      { upsert: false }
    );
    
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload document
router.post('/upload-document', protect, authorize('student'), upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    await Registration.findOneAndUpdate(
      { studentId: req.user.id },
      { documentsUploaded: true },
      { upsert: false }
    );
    
    res.json({ 
      message: 'Document uploaded successfully',
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get student's registration status
router.get('/registration-status', protect, authorize('student'), async (req, res) => {
  try {
    const registration = await Registration.findOne({ studentId: req.user.id })
      .populate('selectedSubjects backlogSubjects');
    res.json(registration);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Initialize or get registration
router.post('/init-registration', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    let reg = await Registration.findOne({ studentId: req.user.id, academicYear: '2025-26' });
    
    if (!reg) {
      reg = await Registration.create({
        studentId: req.user.id,
        rollNo: student.rollNo,
        academicYear: '2025-26',
        semester: student.semester,
        program: student.program
      });
    }
    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
