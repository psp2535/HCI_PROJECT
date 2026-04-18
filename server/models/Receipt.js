import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  receiptNo: { type: String, unique: true },  // e.g. SR/3892
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  
  rollNo: String,
  studentName: String,
  program: String,
  semester: Number,
  academicYear: String,
  
  type: { type: String, enum: ['academic', 'mess'], required: true },
  
  // Fee breakdown matching real receipts
  breakdown: [{
    particular: String,
    amount: Number
  }],
  totalAmount: Number,
  amountInWords: String,
  
  // Transaction details
  transactionMode: { type: String, default: 'Unified Payments' },
  transactionNo: String,
  bankName: String,
  transactionDate: Date,
  
  date: { type: Date, default: Date.now },
  pdfPath: String,
  
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate receipt number SR/XXXX
receiptSchema.pre('save', async function (next) {
  if (!this.receiptNo) {
    const count = await mongoose.model('Receipt').countDocuments();
    this.receiptNo = `SR/${3800 + count + 1}`;
  }
  next();
});

export default mongoose.model('Receipt', receiptSchema);
