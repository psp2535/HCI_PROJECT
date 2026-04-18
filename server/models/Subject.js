import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true, unique: true }, // Unique subject code
  code: { type: String, required: true }, // Alias for backward compatibility
  subjectName: { type: String, required: true },
  name: { type: String, required: true }, // Alias for backward compatibility
  ltp: String,  // e.g. "3-1-0"
  credits: { type: Number, required: true },
  type: { type: String, enum: ['core', 'elective'], default: 'core' },
  program: { type: String, required: true }, // Single program (IMT, BCS, etc.)
  programs: [String], // For backward compatibility
  semester: { type: Number, required: true },
  academicYear: { type: String, default: '2025-26' }, // e.g., "2025-26"
  batch: Number,   // e.g. 2025 for 2025 batch
  department: String,
  faculty: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries
subjectSchema.index({ program: 1, semester: 1, academicYear: 1 });

// Pre-save hook to sync aliases
subjectSchema.pre('save', function(next) {
  if (this.subjectCode && !this.code) this.code = this.subjectCode;
  if (this.code && !this.subjectCode) this.subjectCode = this.code;
  if (this.subjectName && !this.name) this.name = this.subjectName;
  if (this.name && !this.subjectName) this.subjectName = this.name;
  if (this.program && (!this.programs || this.programs.length === 0)) {
    this.programs = [this.program];
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Subject', subjectSchema);
