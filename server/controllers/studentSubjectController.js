import Subject from '../models/Subject.js';
import Registration from '../models/Registration.js';
import Student from '../models/Student.js';

/**
 * Fetch subjects dynamically based on student's program and current semester
 */
export const getSubjectsForStudent = async (studentId) => {
  try {
    const student = await Student.findById(studentId).select('program currentSemester semester');
    
    if (!student) {
      throw new Error('Student not found');
    }

    const semesterToUse = student.currentSemester || student.semester;
    const program = student.program;

    if (!program || !semesterToUse) {
      throw new Error('Student program or semester information is missing');
    }

    const subjects = await Subject.find({
      program: program,
      semester: semesterToUse
    }).sort({ type: 1, subjectCode: 1 });

    if (subjects.length === 0) {
      return {
        success: false,
        message: `Subjects not uploaded yet by admin for ${program} Semester ${semesterToUse}`,
        subjects: [],
        program,
        semester: semesterToUse
      };
    }

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
 * Select subjects for student with validation.
 * Uses subjectCode (not _id) for core-subject validation to be robust against re-seeding.
 */
export const selectSubjectsForStudent = async (studentId, subjectIds, backlogSubjectIds = []) => {
  try {
    const student = await Student.findById(studentId).select('program currentSemester semester');
    
    if (!student) {
      throw new Error('Student not found');
    }

    const semesterToUse = student.currentSemester || student.semester;

    // Fetch all selected subjects by _id
    const selectedSubjects = await Subject.find({ _id: { $in: subjectIds } });
    const backlogSubjects = await Subject.find({ _id: { $in: backlogSubjectIds } });

    // Validate at least something was found
    if (selectedSubjects.length === 0 && subjectIds.length > 0) {
      throw new Error('None of the selected subjects were found. Please refresh and try again.');
    }

    // Validate core subjects are included — compare by subjectCode for robustness
    const coreSubjectsForSemester = await Subject.find({
      program: student.program,
      semester: semesterToUse,
      type: 'core'
    });

    const coreSubjectCodes = coreSubjectsForSemester.map(s => s.subjectCode);
    const selectedSubjectCodes = selectedSubjects.map(s => s.subjectCode);

    const missingCoreCodes = coreSubjectCodes.filter(code => !selectedSubjectCodes.includes(code));
    
    if (missingCoreCodes.length > 0) {
      throw new Error(
        `Core subjects cannot be removed. Missing: ${missingCoreCodes.join(', ')}`
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
