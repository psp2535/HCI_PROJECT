import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameHindi: String,
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'student' },
  program: { type: String, enum: ['BCS', 'IMT', 'BEE', 'IMG', 'BMS', 'MBA', 'MTECH'], default: 'BCS' },
  batch: String,
  semester: { type: Number, default: 1 },
  bloodGroup: String,
  income: Number,
  category: { type: String, enum: ['General', 'OBC', 'SC', 'ST', 'EWS'], default: 'General' },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  religion: String,
  dob: Date,
  homeAddress: String,
  mobile: String,
  parentsMobile: String,
  emergencyContact: String,
  hostel: String,
  roomNo: String,
  samagraId: String,
  abcId: String,
  aadharNo: String,
  bankName: String,
  bankAddress: String,
  accountNo: String,
  profileCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

studentSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

studentSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model('Student', studentSchema);
