import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/auth.js';
import Payment from '../models/Payment.js';
import Registration from '../models/Registration.js';
import Staff from '../models/Staff.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

// Submit payment details
router.post('/submit', protect, authorize('student'), upload.single('paymentProof'), async (req, res) => {
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
    const availableStaff = await Staff.findOne({ role: 'verification_staff' });
    if (availableStaff) {
      paymentData.assignedTo = availableStaff._id;
    }
    
    let payment;
    if (existingPayment) {
      payment = await Payment.findByIdAndUpdate(existingPayment._id, paymentData, { new: true });
    } else {
      payment = await Payment.create(paymentData);
    }
    
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

// Get payment details for current student
router.get('/my-payment', protect, authorize('student'), async (req, res) => {
  try {
    const reg = await Registration.findOne({ studentId: req.user.id });
    if (!reg) return res.json(null);
    
    const payment = await Payment.findOne({ registrationId: reg._id });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
