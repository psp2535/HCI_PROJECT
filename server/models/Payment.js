import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  amount: Number,
  date: Date,
  utrNo: String,
  bankName: String,
  depositorName: String,
  debitAccountNo: String
});

const paymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  rollNo: String,
  academicYear: String,
  semester: Number,
  
  // Transactions (as per Details_of_Fees_Payment_2025 PDF — up to 3 transactions)
  transactions: [transactionSchema],
  totalAmount: Number,
  
  // Payment breakdown
  academicFee: { type: Number, default: 93000 },
  messFee: { type: Number, default: 18000 },
  
  paymentProofUrl: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }, // Assigned verification staff
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }, // Staff who verified
  status: { 
    type: String, 
    enum: ['submitted', 'verified', 'rejected'], 
    default: 'submitted' 
  },
  submittedAt: { type: Date, default: Date.now },
  verifiedAt: Date
});

export default mongoose.model('Payment', paymentSchema);
