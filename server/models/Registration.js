import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  rollNo: String,
  academicYear: { type: String, default: '2025-26' },
  semester: Number,
  program: String,
  
  // Selected subjects
  selectedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  backlogSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  totalCredits: { type: Number, default: 0 },
  
  // Status flags
  personalInfoCompleted: { type: Boolean, default: false },
  documentsUploaded: { type: Boolean, default: false },
  subjectsSelected: { type: Boolean, default: false },
  
  // Payment
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'submitted', 'verified', 'rejected'], 
    default: 'pending' 
  },
  
  // Approval workflow
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  verificationRemarks: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  verifiedAt: Date,
  
  facultyApprovalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  facultyRemarks: String,
  approvedByFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  facultyApprovedAt: Date,
  
  adminApprovalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminRemarks: String,
  approvedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  adminApprovedAt: Date,
  
  overallStatus: {
    type: String,
    enum: ['draft', 'payment_done', 'under_verification', 'payment_verified', 'faculty_approved', 'final_approved', 'rejected'],
    default: 'draft'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

registrationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Registration', registrationSchema);
