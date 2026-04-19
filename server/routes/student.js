import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, authorize } from '../middleware/auth.js';
import Student from '../models/Student.js';
import Registration from '../models/Registration.js';
import Payment from '../models/Payment.js';
import Staff from '../models/Staff.js';

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
    
    // Get or create registration and update personal info status
    let registration = await Registration.findOne({ studentId: req.user.id });
    if (!registration) {
      // Create registration if it doesn't exist
      registration = await Registration.create({
        studentId: req.user.id,
        rollNo: student.rollNo,
        academicYear: '2025-26',
        semester: student.semester || student.currentSemester,
        program: student.program,
        personalInfoCompleted: true
      });
    } else {
      // Update existing registration
      await Registration.findByIdAndUpdate(
        registration._id,
        { personalInfoCompleted: true },
        { new: true }
      );
    }
    
    res.json(student);
  } catch (err) {
    console.error('Profile update error:', err);
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
      .populate('selectedSubjects backlogSubjects')
      .populate('studentId', 'name rollNo program semester currentSemester');
    
    // If no registration exists, create one
    if (!registration) {
      const student = await Student.findById(req.user.id);
      const newRegistration = await Registration.create({
        studentId: req.user.id,
        rollNo: student.rollNo,
        academicYear: '2025-26',
        semester: student.currentSemester || student.semester,
        program: student.program,
        personalInfoCompleted: student.profileCompleted || false,
        subjectsSelected: false,
        totalCredits: 0,
        overallStatus: 'draft',
        paymentStatus: 'pending'
      });
      
      const populatedRegistration = await Registration.findById(newRegistration._id)
        .populate('selectedSubjects backlogSubjects')
        .populate('studentId', 'name rollNo program semester currentSemester');
      
      return res.json(populatedRegistration);
    }
    
    res.json(registration);
  } catch (err) {
    console.error('Registration status error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all payments for current student
router.get('/payments', protect, authorize('student'), async (req, res) => {
  try {
    const registration = await Registration.findOne({ studentId: req.user.id });
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    const payments = await Payment.find({ registrationId: registration._id })
      .populate('assignedTo', 'name employeeId')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit payment details (alias for payment/submit)
router.post('/payments', protect, authorize('student'), upload.single('paymentProof'), async (req, res) => {
  try {
    const { transactions, totalAmount, academicFee, messFee } = req.body;
    
    const reg = await Registration.findOne({ studentId: req.user.id });
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    
    const existingPayment = await Payment.findOne({ registrationId: reg._id });
    
    const paymentData = {
      studentId: req.user.id,
      registrationId: reg._id,
      rollNo: reg.rollNo,
      academicYear: reg.academicYear,
      semester: reg.semester,
      transactions: typeof transactions === 'string' ? JSON.parse(transactions) : transactions,
      totalAmount: parseFloat(totalAmount),
      academicFee: parseFloat(academicFee || 93000),
      messFee: parseFloat(messFee || 18000),
      status: 'submitted',
      paymentProofUrl: req.file ? `/uploads/${req.file.filename}` : undefined
    };
    
    // Auto-assign to available verification staff
    let availableStaff = await Staff.findOne({ role: 'verification_staff' });
    console.log('Available verification staff:', availableStaff);
    
    if (!availableStaff) {
      console.log('No verification staff found, creating default verification staff');
      // Create default verification staff if none exists
      availableStaff = new Staff({
        employeeId: 'VER001',
        name: 'Verification Staff',
        email: 'verification@abviiitm.ac.in',
        passwordHash: 'Verification@123',
        role: 'verification_staff',
        department: 'Accounts'
      });
      await availableStaff.save();
      console.log('Default verification staff created:', availableStaff._id);
    }
    
    paymentData.assignedTo = availableStaff._id;
    console.log('Payment assigned to staff:', availableStaff._id);
    console.log('Payment data before save:', paymentData);
    
    let payment;
    if (existingPayment) {
      payment = await Payment.findByIdAndUpdate(existingPayment._id, paymentData, { new: true });
      console.log('Updated existing payment:', payment);
    } else {
      payment = await Payment.create(paymentData);
      console.log('Created new payment:', payment);
    }
    
    console.log('Final payment object:', payment);
    console.log('Payment assignedTo field:', payment.assignedTo);
    
    // Update registration
    await Registration.findByIdAndUpdate(reg._id, {
      paymentStatus: 'submitted',
      overallStatus: 'payment_done'
    });
    
    res.json({ message: 'Payment submitted successfully', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update payment status
router.put('/payments/:paymentId/status', protect, authorize('student'), async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Verify student owns this payment
    const registration = await Registration.findOne({ studentId: req.user.id });
    if (!registration || payment.registrationId.toString() !== registration._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const updatedPayment = await Payment.findByIdAndUpdate(paymentId, 
      { status, updatedAt: new Date() }, 
      { new: true }
    );
    
    // Update registration status based on payment status
    if (status === 'verified') {
      await Registration.findByIdAndUpdate(registration._id, {
        paymentStatus: 'verified',
        overallStatus: 'payment_verified'
      });
    }
    
    res.json({ message: 'Payment status updated successfully', payment: updatedPayment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Initialize or get registration
router.post('/init-registration', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    let reg = await Registration.findOne({ 
      studentId: req.user.id, 
      academicYear: '2025-26' 
    });
    
    if (!reg) {
      reg = await Registration.create({
        studentId: req.user.id,
        rollNo: student.rollNo,
        academicYear: '2025-26',
        semester: student.currentSemester || student.semester,
        program: student.program,
        personalInfoCompleted: student.profileCompleted || false,
        subjectsSelected: false,
        totalCredits: 0,
        overallStatus: 'draft',
        paymentStatus: 'pending'
      });
    }
    
    res.json(reg);
  } catch (err) {
    console.error('Registration initialization error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
