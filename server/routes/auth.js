import express from 'express';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Staff from '../models/Staff.js';

const router = express.Router();

const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Student login
router.post('/student/login', async (req, res) => {
  try {
    const { rollNo, password } = req.body;
    const student = await Student.findOne({ rollNo });
    if (!student) return res.status(401).json({ message: 'Invalid roll number or password' });
    
    const isMatch = await student.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid roll number or password' });
    
    const token = generateToken(student._id, 'student');
    res.json({
      token,
      user: { id: student._id, name: student.name, rollNo: student.rollNo, role: 'student', program: student.program, semester: student.semester, profileCompleted: student.profileCompleted }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Staff login (verification_staff / faculty / admin)
router.post('/staff/login', async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    const staff = await Staff.findOne({ employeeId });
    if (!staff) return res.status(401).json({ message: 'Invalid employee ID or password' });
    
    const isMatch = await staff.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid employee ID or password' });
    
    const token = generateToken(staff._id, staff.role);
    res.json({
      token,
      user: { id: staff._id, name: staff.name, employeeId: staff.employeeId, role: staff.role, department: staff.department }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register new student (admin only in production, open for demo)
router.post('/student/register', async (req, res) => {
  try {
    const { rollNo, name, email, password, program, batch, batchYear } = req.body;
    
    const existingStudent = await Student.findOne({ rollNo });
    if (existingStudent) return res.status(400).json({ message: 'Student already exists' });
    
    const student = new Student({ rollNo, name, email, passwordHash: password, program, batch, batchYear });
    await student.save();
    
    const token = generateToken(student._id, 'student');
    res.status(201).json({
      token,
      user: { id: student._id, name: student.name, rollNo: student.rollNo, role: 'student', program: student.program }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create default verification staff (for testing/demo)
router.post('/create-default-staff', async (req, res) => {
  try {
    const existingStaff = await Staff.findOne({ role: 'verification_staff' });
    if (existingStaff) {
      return res.json({ message: 'Verification staff already exists', staff: existingStaff });
    }
    
    const verificationStaff = new Staff({
      employeeId: 'VER001',
      name: 'Verification Staff',
      email: 'verification@abviiitm.ac.in',
      passwordHash: 'Verification@123',
      role: 'verification_staff',
      department: 'Accounts'
    });
    
    await verificationStaff.save();
    res.json({ message: 'Default verification staff created', staff: verificationStaff });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register new staff (admin only in production, open for demo)
router.post('/staff/register', async (req, res) => {
  try {
    const { employeeId, name, email, password, role, department } = req.body;
    
    const existing = await Staff.findOne({ $or: [{ employeeId }, { email }] });
    if (existing) return res.status(400).json({ message: 'Staff with this employee ID or email already exists' });
    
    const staff = await Staff.create({ employeeId, name, email, passwordHash: password, role, department });
    const token = generateToken(staff._id, staff.role);
    
    res.status(201).json({
      token,
      user: { id: staff._id, name: staff.name, employeeId: staff.employeeId, role: staff.role, department: staff.department }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
