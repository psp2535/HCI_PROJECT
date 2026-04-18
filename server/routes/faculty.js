import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Registration from '../models/Registration.js';
import Student from '../models/Student.js';

const router = express.Router();

// Get students pending faculty approval (after payment verified)
router.get('/pending', protect, authorize('faculty'), async (req, res) => {
  try {
    const registrations = await Registration.find({
      verificationStatus: 'approved',
      facultyApprovalStatus: 'pending',
      $or: [{ program: { $in: req.userDoc.assignedPrograms || [] } }, {}]
    })
      .populate('studentId', 'name rollNo program semester email mobile')
      .populate('selectedSubjects backlogSubjects')
      .sort({ updatedAt: -1 });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all students for faculty
router.get('/students', protect, authorize('faculty'), async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('studentId', 'name rollNo program semester email mobile')
      .populate('selectedSubjects backlogSubjects')
      .sort({ updatedAt: -1 });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Faculty approve/reject subject registration
router.post('/approve/:registrationId', protect, authorize('faculty'), async (req, res) => {
  try {
    const { action, remarks } = req.body; // 'approve' | 'reject'

    const update = action === 'approve'
      ? {
          facultyApprovalStatus: 'approved',
          facultyRemarks: remarks,
          approvedByFaculty: req.user.id,
          facultyApprovedAt: new Date(),
          overallStatus: 'faculty_approved'
        }
      : {
          facultyApprovalStatus: 'rejected',
          facultyRemarks: remarks,
          overallStatus: 'rejected'
        };

    const reg = await Registration.findByIdAndUpdate(req.params.registrationId, update, { new: true })
      .populate('studentId', 'name rollNo program');

    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    res.json({ message: `Registration ${action === 'approve' ? 'approved' : 'rejected'}`, registration: reg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get faculty dashboard stats
router.get('/stats', protect, authorize('faculty'), async (req, res) => {
  try {
    const pending = await Registration.countDocuments({ verificationStatus: 'approved', facultyApprovalStatus: 'pending' });
    const approved = await Registration.countDocuments({ facultyApprovalStatus: 'approved' });
    const rejected = await Registration.countDocuments({ facultyApprovalStatus: 'rejected' });
    res.json({ pending, approved, rejected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
