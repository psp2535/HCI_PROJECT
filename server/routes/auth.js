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
    const { rollNo, name, email, password, program, batch, semester } = req.body;
    
    const existing = await Student.findOne({ $or: [{ rollNo }, { email }] });
    if (existing) return res.status(400).json({ message: 'Student with this roll no or email already exists' });
    
    const student = await Student.create({ rollNo, name, email, passwordHash: password, program, batch, semester });
    const token = generateToken(student._id, 'student');
    
    res.status(201).json({
      token,
      user: { id: student._id, name: student.name, rollNo: student.rollNo, role: 'student', program: student.program }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
