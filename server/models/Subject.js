import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  ltp: String,  // e.g. "3-1-0"
  credits: { type: Number, required: true },
  type: { type: String, enum: ['core', 'elective'], default: 'core' },
  programs: [String],
  semester: Number,
  batch: Number,   // e.g. 2025 for 2025 batch
  department: String,
  faculty: String
});

export default mongoose.model('Subject', subjectSchema);
