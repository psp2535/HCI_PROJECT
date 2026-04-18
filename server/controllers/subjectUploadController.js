import { createRequire } from 'module';
import Subject from '../models/Subject.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Parse PDF text and extract subject information
 * Supports ABV-IIITM table format with multiple programs
 */
export const parsePDFToSubjects = (pdfText) => {
  try {
    const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const allSubjects = [];
    let currentProgram = null;
    let currentSemester = null;
    let currentBatch = null;
    let academicYear = '2025-26'; // Default
    
    // Regex patterns for ABV-IIITM format
    const programHeaderRegex = /^(BCS|IMT|BEE|IMG|BMS|MBA|MTECH)\s*.*?\((\d{4})\s+([IVX]+)\s+SEMESTER\)/i;
    const semesterLineRegex = /Semester\s*[-–]\s*([IVX]+)\s+(\d{4})\s+Batch/i;
    const academicYearRegex = /(\d{4})\s*[-–]\s*(\d{4})/;
    
    // Subject line pattern: Subject Code | Title | Type | Credit | L-T-P
    // Example: EE103 Digital Electronics CORE 4 3-0-2
    const subjectLineRegex = /^([A-Z]{2,4}\d{3})\s+(.+?)\s+(CORE|ELECTIVE|OPEN\s*ELECTIVE|LAB|TR|MOOC|PRJ|SEMINAR|AUDIT)\s+(\d+)\s+([\d-]+)/i;
    
    // Alternative pattern without explicit type
    const subjectLineRegex2 = /^(\d+)\s+([A-Z]{2,4}\d{3})\s+(.+?)\s+(CORE|ELECTIVE|OPEN\s*ELECTIVE)\s+(\d+)\s+([\d-]+)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for program header (e.g., "BCS (2025 II SEMESTER)")
      const programMatch = line.match(programHeaderRegex);
      if (programMatch) {
        currentProgram = programMatch[1].toUpperCase();
        currentBatch = parseInt(programMatch[2]);
        
        // Convert Roman numeral to number
        const romanSem = programMatch[3];
        currentSemester = romanToNumber(romanSem);
        continue;
      }
      
      // Check for semester line (e.g., "Semester - II 2025 Batch")
      const semMatch = line.match(semesterLineRegex);
      if (semMatch) {
        currentSemester = romanToNumber(semMatch[1]);
        currentBatch = parseInt(semMatch[2]);
        continue;
      }
      
      // Extract academic year if present
      const yearMatch = line.match(academicYearRegex);
      if (yearMatch && !line.includes('Batch')) {
        academicYear = `${yearMatch[1]}-${yearMatch[2].substring(2)}`;
      }
      
      // Skip if we don't have program and semester
      if (!currentProgram || !currentSemester) continue;
      
      // Try to match subject line (pattern 1)
      let match = line.match(subjectLineRegex);
      if (match) {
        const subjectCode = match[1].toUpperCase();
        const subjectName = match[2].trim();
        const typeRaw = match[3].toUpperCase();
        const credits = parseInt(match[4]);
        const ltp = match[5];
        
        // Skip LAB, TR, MOOC, PRJ, SEMINAR, AUDIT entries
        if (['LAB', 'TR', 'MOOC', 'PRJ', 'SEMINAR', 'AUDIT'].includes(typeRaw)) {
          continue;
        }
        
        // Determine type
        let type = 'core';
        if (typeRaw.includes('ELECTIVE')) {
          type = 'elective';
        }
        
        // Check if this subject already exists (avoid duplicates)
        const exists = allSubjects.find(s => 
          s.subjectCode === subjectCode && 
          s.program === currentProgram && 
          s.semester === currentSemester
        );
        
        if (!exists && credits > 0) {
          allSubjects.push({
            subjectCode,
            subjectName,
            credits,
            type,
            ltp,
            program: currentProgram,
            semester: currentSemester,
            batch: currentBatch,
            academicYear
          });
        }
        continue;
      }
      
      // Try pattern 2 (with S.No.)
      match = line.match(subjectLineRegex2);
      if (match) {
        const subjectCode = match[2].toUpperCase();
        const subjectName = match[3].trim();
        const typeRaw = match[4].toUpperCase();
        const credits = parseInt(match[5]);
        const ltp = match[6];
        
        let type = 'core';
        if (typeRaw.includes('ELECTIVE')) {
          type = 'elective';
        }
        
        const exists = allSubjects.find(s => 
          s.subjectCode === subjectCode && 
          s.program === currentProgram && 
          s.semester === currentSemester
        );
        
        if (!exists && credits > 0) {
          allSubjects.push({
            subjectCode,
            subjectName,
            credits,
            type,
            ltp,
            program: currentProgram,
            semester: currentSemester,
            batch: currentBatch,
            academicYear
          });
        }
      }
    }
    
    // Validation
    if (allSubjects.length === 0) {
      throw new Error('No subjects found in PDF. Please check the format.');
    }
    
    // Group by program and semester
    const grouped = {};
    allSubjects.forEach(sub => {
      const key = `${sub.program}_${sub.semester}`;
      if (!grouped[key]) {
        grouped[key] = {
          program: sub.program,
          semester: sub.semester,
          academicYear: sub.academicYear,
          batch: sub.batch,
          subjects: []
        };
      }
      grouped[key].subjects.push(sub);
    });
    
    return {
      success: true,
      message: `Parsed ${allSubjects.length} subjects from ${Object.keys(grouped).length} program-semester combinations`,
      groups: Object.values(grouped),
      totalSubjects: allSubjects.length
    };
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};

/**
 * Convert Roman numeral to number
 */
function romanToNumber(roman) {
  const romanMap = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
  };
  return romanMap[roman.toUpperCase()] || 1;
}

/**
 * Process uploaded PDF and update subjects in database
 * Handles multiple programs and semesters in one PDF
 */
export const processSubjectPDF = async (fileBuffer) => {
  try {
    // Extract text from PDF
    const pdfData = await pdfParse(fileBuffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('PDF appears to be empty or could not be read');
    }

    // Parse PDF text to structured data
    const parsedData = parsePDFToSubjects(pdfText);
    
    if (!parsedData.success || !parsedData.groups || parsedData.groups.length === 0) {
      throw new Error('No valid subject data found in PDF');
    }

    const results = [];
    let totalInserted = 0;
    let totalDeleted = 0;

    // Process each program-semester group
    for (const group of parsedData.groups) {
      const { program, semester, academicYear, subjects } = group;

      // Check for duplicate subject codes within this group
      const codes = subjects.map(s => s.subjectCode);
      const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
      if (duplicates.length > 0) {
        throw new Error(
          `Duplicate subject codes found in ${program} Semester ${semester}: ${duplicates.join(', ')}`
        );
      }

      // Delete existing subjects for this program + semester + academicYear
      const deleteResult = await Subject.deleteMany({
        program,
        semester,
        academicYear
      });

      // Insert new subjects
      const insertedSubjects = await Subject.insertMany(subjects);

      totalDeleted += deleteResult.deletedCount;
      totalInserted += insertedSubjects.length;

      results.push({
        program,
        semester,
        academicYear,
        deletedCount: deleteResult.deletedCount,
        insertedCount: insertedSubjects.length
      });
    }

    return {
      success: true,
      message: `Successfully uploaded ${totalInserted} subjects across ${parsedData.groups.length} program-semester combinations`,
      totalInserted,
      totalDeleted,
      details: results
    };
  } catch (error) {
    throw new Error(`Subject upload failed: ${error.message}`);
  }
};

/**
 * Validate subject data before insertion
 */
export const validateSubjectData = (subjects) => {
  const errors = [];

  subjects.forEach((subject, index) => {
    if (!subject.subjectCode || subject.subjectCode.trim().length === 0) {
      errors.push(`Subject at index ${index}: Missing subject code`);
    }
    if (!subject.subjectName || subject.subjectName.trim().length === 0) {
      errors.push(`Subject at index ${index}: Missing subject name`);
    }
    if (!subject.credits || isNaN(subject.credits) || subject.credits <= 0) {
      errors.push(`Subject at index ${index}: Invalid credits (${subject.credits})`);
    }
    if (!['core', 'elective'].includes(subject.type)) {
      errors.push(`Subject at index ${index}: Invalid type (${subject.type}). Must be 'core' or 'elective'`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
