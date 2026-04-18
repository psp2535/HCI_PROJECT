import Subject from '../models/Subject.js';
import Registration from '../models/Registration.js';
import Student from '../models/Student.js';

/**
 * Fetch subjects dynamically based on student's program and current semester
 */
export const getSubjectsForStudent = async (studentId) => {
  try {
    // Get student details
    const student = await Student.findById(studentId).select('program currentSemester semester');
    
    if (!student) {
      throw new Error('Student not found');
    }

    // Use currentSemester if available, otherwise fall back to semester
    const semesterToUse = student.currentSemester || student.semester;
    const program = student.program;

    if (!program || !semesterToUse) {
      throw new Error('Student program or semester information is missing');
    }

    // Fetch subjects for this program and semester
    const subjects = await Subject.find({
      program: program,
      semester: semesterToUse
    }).sort({ type: 1, subjectCode: 1 }); // Sort by type (core first) then by code

    if (subjects.length === 0) {
      return {
        success: false,
        message: `Subjects not uploaded yet by admin for ${program} Semester ${semesterToUse}`,
        subjects: [],
        program,
        semester: semesterToUse
      };
    }

    // Separate core and elective subjects
    const coreSubjects = subjects.filter(s => s.type === 'core');
    const electiveSubjects = subjects.filter(s => s.type === 'elective');

    return {
      success: true,
      subjects,
      coreSubjects,
      electiveSubjects,
      program,
      semester: semesterToUse,
      totalSubjects: subjects.length,
      message: `Found ${subjects.length} subjects for ${program} Semester ${semesterToUse}`
    };
  } catch (error) {
    throw new Error(`Failed to fetch subjects: ${error.message}`);
  }
};

/**
 * Select subjects for student with validation
 */
export const selectSubjectsForStudent = async (studentId, subjectIds, backlogSubjectIds = []) => {
  try {
    // Get student details
    const student = await Student.findById(studentId).select('program currentSemester semester');
    
    if (!student) {
      throw new Error('Student not found');
    }

    const semesterToUse = student.currentSemester || student.semester;

    // Fetch all selected subjects
    const selectedSubjects = await Subject.find({ _id: { $in: subjectIds } });
    const backlogSubjects = await Subject.find({ _id: { $in: backlogSubjectIds } });

    // Validate that subjects exist
    if (selectedSubjects.length !== subjectIds.length) {
      throw new Error('Some selected subjects were not found');
    }

    // Validate core subjects are included
    const coreSubjectsForSemester = await Subject.find({
      program: student.program,
      semester: semesterToUse,
      type: 'core'
    });

    const coreSubjectIds = coreSubjectsForSemester.map(s => s._id.toString());
    const selectedSubjectIds = selectedSubjects.map(s => s._id.toString());

    const missingCoreSubjects = coreSubjectIds.filter(id => !selectedSubjectIds.includes(id));
    
    if (missingCoreSubjects.length > 0) {
      const missingSubjects = await Subject.find({ _id: { $in: missingCoreSubjects } });
      throw new Error(
        `Core subjects cannot be removed. Missing: ${missingSubjects.map(s => s.subjectName).join(', ')}`
      );
    }

    // Calculate total credits
    const totalCredits = [...selectedSubjects, ...backlogSubjects].reduce(
      (sum, subject) => sum + subject.credits, 
      0
    );

    // Validate credit limit
    if (totalCredits > 32) {
      throw new Error(
        `Total credits (${totalCredits}) exceed the maximum allowed limit of 32`
      );
    }

    // Update or create registration
    const registration = await Registration.findOneAndUpdate(
      { studentId },
      {
        selectedSubjects: subjectIds,
        backlogSubjects: backlogSubjectIds,
        totalCredits,
        subjectsSelected: true,
        semester: semesterToUse,
        program: student.program
      },
      { new: true, upsert: true }
    ).populate('selectedSubjects backlogSubjects');

    return {
      success: true,
      message: 'Subjects selected successfully',
      registration,
      totalCredits,
      selectedCount: selectedSubjects.length,
      backlogCount: backlogSubjects.length
    };
  } catch (error) {
    throw new Error(`Subject selection failed: ${error.message}`);
  }
};

/**
 * Get subject selection summary for student
 */
export const getSubjectSelectionSummary = async (studentId) => {
  try {
    const student = await Student.findById(studentId).select('program currentSemester semester name rollNo');
    
    if (!student) {
      throw new Error('Student not found');
    }

    const registration = await Registration.findOne({ studentId })
      .populate('selectedSubjects backlogSubjects');

    const semesterToUse = student.currentSemester || student.semester;

    // Get available subjects
    const availableSubjects = await Subject.find({
      program: student.program,
      semester: semesterToUse
    });

    return {
      student: {
        name: student.name,
        rollNo: student.rollNo,
        program: student.program,
        semester: semesterToUse
      },
      registration: registration || null,
      availableSubjects,
      totalCreditsSelected: registration?.totalCredits || 0,
      subjectsSelected: registration?.subjectsSelected || false
    };
  } catch (error) {
    throw new Error(`Failed to get subject selection summary: ${error.message}`);
  }
};
