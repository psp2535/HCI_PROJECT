import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Payment from '../models/Payment.js';
import Registration from '../models/Registration.js';
import Student from '../models/Student.js';

const router = express.Router();

// Get all pending payments for verification (assigned to current staff)
router.get('/pending', protect, authorize('verification_staff'), async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'submitted', assignedTo: req.user.id })
      .populate({ path: 'studentId', select: 'name rollNo program semester' })
      .populate({ path: 'registrationId', select: 'academicYear semester overallStatus' })
      .sort({ submittedAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all payments (all statuses) - filtered by assigned staff for verification_staff, all for admin
router.get('/all', protect, authorize('verification_staff', 'admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };
    const payments = await Payment.find(filter)
      .populate({ path: 'studentId', select: 'name rollNo program semester email' })
      .populate({ path: 'registrationId', select: 'academicYear semester overallStatus' })
      .sort({ submittedAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify or reject a payment
router.post('/verify/:paymentId', protect, authorize('verification_staff'), async (req, res) => {
  try {
    const { action, remarks } = req.body; // action: 'approve' | 'reject'
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Verify this payment is assigned to the current staff
    if (payment.assignedTo && payment.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to verify this payment' });
    }

    const newStatus = action === 'approve' ? 'verified' : 'rejected';
    payment.status = newStatus;
    payment.verifiedBy = req.user.id;
    payment.verifiedAt = new Date();
    await payment.save();

    const regUpdate = action === 'approve'
      ? { paymentStatus: 'verified', verificationStatus: 'approved', verificationRemarks: remarks, verifiedBy: req.user.id, verifiedAt: new Date(), overallStatus: 'payment_verified' }
      : { paymentStatus: 'rejected', verificationStatus: 'rejected', verificationRemarks: remarks, overallStatus: 'rejected' };

    await Registration.findByIdAndUpdate(payment.registrationId, regUpdate);

    res.json({ message: `Payment ${action === 'approve' ? 'verified' : 'rejected'} successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bulk verify payments
router.post('/bulk-verify', protect, authorize('verification_staff'), async (req, res) => {
  try {
    const { paymentIds, action } = req.body;
    const newStatus = action === 'approve' ? 'verified' : 'rejected';

    await Payment.updateMany({ _id: { $in: paymentIds } }, { status: newStatus });
    
    const payments = await Payment.find({ _id: { $in: paymentIds } });
    const regIds = payments.map(p => p.registrationId);

    const regUpdate = action === 'approve'
      ? { paymentStatus: 'verified', verificationStatus: 'approved', overallStatus: 'payment_verified' }
      : { paymentStatus: 'rejected', verificationStatus: 'rejected', overallStatus: 'rejected' };

    await Registration.updateMany({ _id: { $in: regIds } }, regUpdate);

    res.json({ message: `${paymentIds.length} payment(s) ${action === 'approve' ? 'verified' : 'rejected'}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign payment to verification staff (admin only)
router.post('/assign/:paymentId', protect, authorize('admin'), async (req, res) => {
  try {
    const { staffId } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.paymentId, 
      { assignedTo: staffId }, 
      { new: true }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment assigned successfully', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get verification stats (filtered by assigned staff for verification_staff, all for admin)
router.get('/stats', protect, authorize('verification_staff', 'admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };
    const total = await Payment.countDocuments(filter);
    const pending = await Payment.countDocuments({ ...filter, status: 'submitted' });
    const verified = await Payment.countDocuments({ ...filter, status: 'verified' });
    const rejected = await Payment.countDocuments({ ...filter, status: 'rejected' });
    res.json({ total, pending, verified, rejected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
