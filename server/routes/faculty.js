import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Registration from '../models/Registration.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get students pending faculty approval (after payment verified)
router.get('/pending', protect, authorize('faculty'), async (req, res) => {
  try {
    // Filter by faculty's assigned programs, or show all if no programs assigned
    const programFilter = req.userDoc.assignedPrograms && req.userDoc.assignedPrograms.length > 0 
      ? { program: { $in: req.userDoc.assignedPrograms } } 
      : {};
    
    const registrations = await Registration.find({
      verificationStatus: 'approved',
      facultyApprovalStatus: 'pending',
      ...programFilter
    })
      .populate('studentId', 'name rollNo program semester email mobile')
      .populate('selectedSubjects backlogSubjects')
      .sort({ updatedAt: -1 });
    res.json(registrations);
  } catch (err) {
    console.error('Faculty pending error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all students for faculty (filtered by assigned programs)
router.get('/students', protect, authorize('faculty'), async (req, res) => {
  try {
    // Filter by faculty's assigned programs, or show all if no programs assigned
    const programFilter = req.userDoc.assignedPrograms && req.userDoc.assignedPrograms.length > 0 
      ? { program: { $in: req.userDoc.assignedPrograms } } 
      : {};
    
    const registrations = await Registration.find(programFilter)
      .populate('studentId', 'name rollNo program semester email mobile')
      .populate('selectedSubjects backlogSubjects')
      .sort({ updatedAt: -1 });
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Faculty approve/reject subject registration
router.post('/approve/:registrationId', protect, authorize('faculty'), async (req, res) => {
  try {
    const { action, remarks } = req.body; // 'approve' | 'reject'

    const update = action === 'approve'
      ? {
          facultyApprovalStatus: 'approved',
          facultyRemarks: remarks,
          approvedByFaculty: req.user.id,
          facultyApprovedAt: new Date(),
          overallStatus: 'faculty_approved'
        }
      : {
          facultyApprovalStatus: 'rejected',
          facultyRemarks: remarks,
          overallStatus: 'rejected'
        };

    const reg = await Registration.findByIdAndUpdate(req.params.registrationId, update, { new: true })
      .populate('studentId', 'name rollNo program');

    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    res.json({ message: `Registration ${action === 'approve' ? 'approved' : 'rejected'}`, registration: reg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get faculty dashboard stats (filtered by assigned programs)
router.get('/stats', protect, authorize('faculty'), async (req, res) => {
  try {
    // Filter by faculty's assigned programs, or show all if no programs assigned
    const programFilter = req.userDoc.assignedPrograms && req.userDoc.assignedPrograms.length > 0 
      ? { program: { $in: req.userDoc.assignedPrograms } } 
      : {};
    
    const pending = await Registration.countDocuments({ 
      verificationStatus: 'approved', 
      facultyApprovalStatus: 'pending',
      ...programFilter
    });
    const approved = await Registration.countDocuments({ 
      facultyApprovalStatus: 'approved',
      ...programFilter
    });
    const rejected = await Registration.countDocuments({ 
      facultyApprovalStatus: 'rejected',
      ...programFilter
    });
    res.json({ pending, approved, rejected });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get course registrations and attendance lists for faculty
router.get('/course-registrations', protect, authorize('faculty'), async (req, res) => {
  try {
    const { subjectId, program, semester } = req.query;
    
    console.log('Faculty course registrations request:', {
      user: req.userDoc,
      subjectId,
      program,
      semester
    });
    
    // Filter by faculty's assigned programs
    const programFilter = req.userDoc.assignedPrograms && req.userDoc.assignedPrograms.length > 0 
      ? { program: { $in: req.userDoc.assignedPrograms } } 
      : {};
    
    // Build query
    let query = { ...programFilter };
    if (program) query.program = program;
    if (semester) query.semester = parseInt(semester);
    
    console.log('Query for registrations:', query);
    
    // Get registrations with subject selections
    const registrations = await Registration.find({
      verificationStatus: 'approved',
      facultyApprovalStatus: 'approved',
      subjectsSelected: true,
      ...query
    })
      .populate('studentId', 'name rollNo program semester email mobile')
      .populate('selectedSubjects', 'subjectCode subjectName credits type ltp program semester')
      .populate('backlogSubjects', 'subjectCode subjectName credits type ltp program semester')
      .sort({ 'studentId.rollNo': 1 });
    
    console.log('Found registrations:', registrations.length);
    
    // If specific subject requested, filter registrations for that subject
    let filteredRegistrations = registrations;
    let targetSubjectCode = null;
    
    if (subjectId) {
      const requestedSub = await Subject.findById(subjectId);
      if (requestedSub) targetSubjectCode = requestedSub.subjectCode;
      
      if (targetSubjectCode) {
        filteredRegistrations = registrations.filter(reg => 
          reg.selectedSubjects.some(sub => sub.subjectCode === targetSubjectCode) ||
          reg.backlogSubjects.some(sub => sub.subjectCode === targetSubjectCode)
        );
      } else {
        // Fallback to strict ID check if subject not found in DB
        filteredRegistrations = registrations.filter(reg => 
          reg.selectedSubjects.some(sub => sub._id.toString() === subjectId) ||
          reg.backlogSubjects.some(sub => sub._id.toString() === subjectId)
        );
      }
    }
    
    // Get available subjects for faculty's programs
    const subjects = await Subject.find({
      program: { $in: req.userDoc.assignedPrograms || [] }
    }).sort({ program: 1, semester: 1, subjectCode: 1 });
    
    // Group registrations by subject for attendance lists
    const subjectGroups = {};
    filteredRegistrations.forEach(registration => {
      const allSubjects = [...registration.selectedSubjects, ...registration.backlogSubjects];
      allSubjects.forEach(subject => {
        if (targetSubjectCode) {
          if (subject.subjectCode !== targetSubjectCode) return;
        } else if (subjectId && subject._id.toString() !== subjectId) {
          return;
        }
        
        const key = subject._id.toString();
        if (!subjectGroups[key]) {
          subjectGroups[key] = {
            subject: subject,
            students: []
          };
        }
        subjectGroups[key].students.push({
          _id: registration.studentId._id,
          name: registration.studentId.name,
          rollNo: registration.studentId.rollNo,
          program: registration.studentId.program,
          semester: registration.studentId.semester,
          email: registration.studentId.email,
          mobile: registration.studentId.mobile,
          registrationId: registration._id,
          isBacklog: registration.backlogSubjects.some(sub => sub._id.toString() === key)
        });
      });
    });
    
    res.json({
      success: true,
      registrations: filteredRegistrations,
      subjectGroups: Object.values(subjectGroups),
      availableSubjects: subjects,
      totalStudents: filteredRegistrations.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Export attendance list as PDF
router.get('/export-attendance-pdf', protect, authorize('faculty'), async (req, res) => {
  try {
    const { subjectId, program, semester } = req.query;
    
    // Get attendance data using the same logic as course registrations
    const programFilter = req.userDoc.assignedPrograms && req.userDoc.assignedPrograms.length > 0 
      ? { program: { $in: req.userDoc.assignedPrograms } } 
      : {};
    
    let query = { ...programFilter };
    if (program) query.program = program;
    if (semester) query.semester = parseInt(semester);
    
    const registrations = await Registration.find({
      verificationStatus: 'approved',
      facultyApprovalStatus: 'approved',
      subjectsSelected: true,
      ...query
    })
      .populate('studentId', 'name rollNo program semester email mobile')
      .populate('selectedSubjects', 'subjectCode subjectName credits type ltp program semester')
      .populate('backlogSubjects', 'subjectCode subjectName credits type ltp program semester')
      .sort({ 'studentId.rollNo': 1 });
    
    let filteredRegistrations = registrations;
    let targetSubjectCode = null;
    
    if (subjectId) {
      const requestedSub = await Subject.findById(subjectId);
      if (requestedSub) targetSubjectCode = requestedSub.subjectCode;
      
      if (targetSubjectCode) {
        filteredRegistrations = registrations.filter(reg => 
          reg.selectedSubjects.some(sub => sub.subjectCode === targetSubjectCode) ||
          reg.backlogSubjects.some(sub => sub.subjectCode === targetSubjectCode)
        );
      } else {
        filteredRegistrations = registrations.filter(reg => 
          reg.selectedSubjects.some(sub => sub._id.toString() === subjectId) ||
          reg.backlogSubjects.some(sub => sub._id.toString() === subjectId)
        );
      }
    }
    
    const subjects = await Subject.find({
      program: { $in: req.userDoc.assignedPrograms || [] }
    }).sort({ program: 1, semester: 1, subjectCode: 1 });
    
    const subjectGroups = {};
    filteredRegistrations.forEach(registration => {
      const allSubjects = [...registration.selectedSubjects, ...registration.backlogSubjects];
      allSubjects.forEach(subject => {
        if (targetSubjectCode) {
          if (subject.subjectCode !== targetSubjectCode) return;
        } else if (subjectId && subject._id.toString() !== subjectId) {
          return;
        }
        
        const key = subject._id.toString();
        if (!subjectGroups[key]) {
          subjectGroups[key] = {
            subject: subject,
            students: []
          };
        }
        subjectGroups[key].students.push({
          _id: registration.studentId._id,
          name: registration.studentId.name,
          rollNo: registration.studentId.rollNo,
          program: registration.studentId.program,
          semester: registration.studentId.semester,
          email: registration.studentId.email,
          mobile: registration.studentId.mobile,
          registrationId: registration._id,
          isBacklog: registration.backlogSubjects.some(sub => sub._id.toString() === key)
        });
      });
    });
    
    const data = {
      success: true,
      subjectGroups: Object.values(subjectGroups),
      availableSubjects: subjects
    };
    
    // Generate PDF using imported modules
    const doc = new PDFDocument({ margin: 50 });
    const filename = `attendance-list-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '..', 'receipts', filename);
    
    // Ensure receipts directory exists
    if (!fs.existsSync(path.join(__dirname, '..', 'receipts'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'receipts'));
    }
    
    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(filepath));
    
    // Add content to PDF
    doc.fontSize(20).text('Attendance List', { align: 'center' });
    doc.moveDown();
    
    if (subjectId) {
      const subject = data.availableSubjects.find(s => s._id === subjectId);
      if (subject) {
        doc.fontSize(14).text(`Subject: ${subject.subjectCode} - ${subject.subjectName}`, { align: 'center' });
        doc.fontSize(12).text(`Program: ${subject.program} | Semester: ${subject.semester}`, { align: 'center' });
        doc.moveDown();
      }
    }
    
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    
    // Add table headers
    const tableTop = 200;
    const headers = ['Roll No', 'Name', 'Program', 'Semester', 'Email', 'Mobile', 'Type'];
    const columnWidths = [80, 120, 60, 60, 120, 80, 60];
    
    // Draw table
    headers.forEach((header, i) => {
      const x = 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.fontSize(10).font('Helvetica-Bold').text(header, x, tableTop);
    });
    
    // Draw line under headers
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    
    // Add student data
    let yPosition = tableTop + 25;
    data.subjectGroups.forEach(group => {
      group.students.forEach(student => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        const studentData = [
          student.rollNo,
          student.name,
          student.program,
          student.semester.toString(),
          student.email,
          student.mobile,
          student.isBacklog ? 'Backlog' : 'Regular'
        ];
        
        studentData.forEach((text, i) => {
          const x = 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.fontSize(9).font('Helvetica').text(text, x, yPosition, { width: columnWidths[i] - 5 });
        });
        
        yPosition += 20;
      });
    });
    
    // Finalize PDF
    doc.end();
    
    // Wait for PDF to be written
    setTimeout(() => {
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('PDF download error:', err);
          res.status(500).json({ message: 'Failed to download PDF' });
        }
        // Clean up file after download
        fs.unlink(filepath, () => {});
      });
    }, 1000);
    
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
