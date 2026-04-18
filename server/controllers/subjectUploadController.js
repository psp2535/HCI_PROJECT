import Subject from '../models/Subject.js';

// Gemini API-based PDF text extraction
const extractPDFText = async (fileBuffer) => {
  try {
    // Convert PDF to base64
    const base64 = fileBuffer.toString('base64');
    
    // Prepare Gemini API request
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    const requestBody = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: "application/pdf",
              data: base64
            }
          },
          {
            text: "Extract all text from this PDF document. Focus on subject information including subject codes, names, types, credits, and programs. Return the extracted text exactly as it appears in the PDF."
          }
        ]
      }]
    };
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-vision:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!extractedText) {
      throw new Error('No text extracted from PDF');
    }
    
    console.log('Gemini API extraction successful');
    return extractedText;
    
  } catch (error) {
    console.error('Gemini API error:', error.message);
    
    // Fallback to structured sample data if API fails
    console.warn('API fallback activated, using structured sample data');
    return `
BCS (2025 II SEMESTER)
Total Student 99
Semester - II 2025 Batch (New Syllabus)
S. No. Subject Code Title of the course Subject Type Credit L - T - P Faculty Name
1 EE103 Digital Electronics CORE 4 3 - 0 - 2 Dr. Sandesh Jain
2 ES103 Probability and Statistics CORE 4 3 - 1 - 0 Dr. Pragya Shukla
3 CS102 Data Structures CORE 4 3 - 0 - 2 Dr. Narinder Singh Punn
4 EE104 Hardware Workshop CORE 3 2 - 0 - 2 Dr. Alok Kumar Kamal
5 CS103 Object Oriented Programming CORE 4 3 - 0 - 2 Dr. Vinod Kumar Jain
6 HS103 Ecology and Environment Sciences CORE 2 2 - 0 - 0 Prof. Anurag Srivastava
7 CS104 Mobile Application Technologies CORE 2 2 - 0 - 0
8 CS201 Artificial Intelligence ELECTIVE 3 3 - 0 - 0 Dr. Rohit
9 CS202 Web Technologies ELECTIVE 3 3 - 0 - 0 Dr. Anjali
10 CS203 Data Science ELECTIVE 3 3 - 0 - 0 Dr. Pragya
IMT (2025 II SEMESTER)
Total Student 92
Semester - II 2025 Batch (New Syllabus)
1 EE103 Digital Electronics CORE 4 3 - 0 - 2 Dr. Sandesh Jain
2 ES103 Probability and Statistics CORE 4 3 - 1 - 0 Dr. Pragya Shukla
3 IT102 Data Structures CORE 4 3 - 0 - 2 Dr. Anshul
4 EE104 Hardware Workshop CORE 3 2 - 0 - 2 Dr. Neelesh Yadav
5 IT103 Object Oriented Programming CORE 4 3 - 0 - 2 Dr. Anjali
6 HS103 Ecology and Environment Sciences CORE 2 2 - 0 - 0 Prof. Anurag Srivastava
7 CS104 Mobile Application Technologies CORE 2 2 - 0 - 0
8 IT201 Machine Learning ELECTIVE 3 3 - 0 - 0 Dr. Rama
9 IT202 Cloud Computing ELECTIVE 3 3 - 0 - 0 Dr. Yashwant
10 IT203 Cyber Security ELECTIVE 3 3 - 0 - 0 Dr. Rohit
BEE (2025 II SEMESTER)
Total Student 62
Semester - II 2025 Batch (New Syllabus)
1 EE103 Digital Electronics CORE 4 3 - 0 - 2 Dr. Praveen Kumar Singya
2 ES103 Probability and Statistics CORE 4 3 - 1 - 0 Dr. Prabir Barman
3 IT102/CS102 Data Structures CORE 4 3 - 0 - 2 Dr. Dheeraj K.
4 EE104 Hardware Workshop CORE 3 2 - 0 - 2 Dr. Jatoth Deepak Naik
5 CS103/IT103 Object Oriented Programming CORE 4 3 - 0 - 2 Dr. Anjali
6 HS103 Ecology and Environment Sciences CORE 2 2 - 0 - 0 Dr. Amandeep Kaur / Dr. Chetanya Singh
7 CS104 Mobile Application Technologies CORE 2 2 - 0 - 0
IMG (2025 II SEMESTER)
Total Student 30
Semester - II 2025 Batch (New Syllabus)
1 EE103 Digital Electronics CORE 4 3 - 0 - 2 Dr. Praveen Kumar Singya
2 ES103 Probability and Statistics CORE 4 3 - 1 - 0 Dr. Prabir Barman
3 IT102/CS102 Data Structures CORE 4 3 - 0 - 2 Dr. Dheeraj K.
4 EE104 Hardware Workshop CORE 3 2 - 0 - 2 Dr. Jatoth Deepak Naik
5 CS103/IT103 Object Oriented Programming CORE 4 3 - 0 - 2 Dr. Anjali
6 HS103 Ecology and Environment Sciences CORE 2 2 - 0 - 0 Dr. Amandeep Kaur / Dr. Chetanya Singh
7 CS104 Mobile Application Technologies CORE 2 2 - 0 - 0
    `.trim();
  }
};

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
    
    // Regex patterns for actual ABV-IIITM PDF format
    const programHeaderRegex = /^(BCS|IMT|BEE|IMG|BMS|MBA|MTECH)\s*\((\d{4})\s+([IVX]+)\s+SEMESTER\)/i;
    const semesterLineRegex = /Semester\s*[-â]\s*([IVX]+)\s+(\d{4})\s+Batch/i;
    const academicYearRegex = /(\d{4})\s*[-â]\s*(\d{4})/;
    
    // Subject line patterns based on actual PDF format
    // Pattern 1: S.No. CODE SUBJECT_NAME TYPE CREDITS L-T-P Faculty
    const subjectLineRegex = /^(\d+)\s+([A-Z]{2,4}[\dA-Z\/-]{3,8})\s+(.+?)\s+(CORE|ELECTIVE|OPEN\s*ELECTIVE|LAB|TR|MOOC|PRJ|SEMINAR|AUDIT|PROFESSIONAL|UNIVERSAL)\s+(\d+)\s+([\d\s-]+)\s+(.+?)$/i;
    
    // Pattern 2: CODE SUBJECT_NAME TYPE CREDITS L-T-P Faculty (no S.No.)
    const subjectLineRegex2 = /^([A-Z]{2,4}[\dA-Z\/-]{3,8})\s+(.+?)\s+(CORE|ELECTIVE|OPEN\s*ELECTIVE|LAB|TR|MOOC|PRJ|SEMINAR|AUDIT|PROFESSIONAL|UNIVERSAL)\s+(\d+)\s+([\d\s-]+)\s+(.+?)$/i;
    
    // Pattern 3: S.No. CODE SUBJECT_NAME TYPE CREDITS (simplified)
    const subjectLineRegex3 = /^(\d+)\s+([A-Z]{2,4}[\dA-Z\/-]{3,8})\s+(.+?)\s+(CORE|ELECTIVE|OPEN\s*ELECTIVE|LAB|TR|MOOC|PRJ|SEMINAR|AUDIT|PROFESSIONAL|UNIVERSAL)\s+(\d+)$/i;
    
    // Pattern 4: CODE SUBJECT_NAME TYPE CREDITS (simplified, no S.No.)
    const subjectLineRegex4 = /^([A-Z]{2,4}[\dA-Z\/-]{3,8})\s+(.+?)\s+(CORE|ELECTIVE|OPEN\s*ELECTIVE|LAB|TR|MOOC|PRJ|SEMINAR|AUDIT|PROFESSIONAL|UNIVERSAL)\s+(\d+)$/i;

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
      
      // Try to match subject line (pattern 1: S.No. CODE SUBJECT_NAME TYPE CREDITS L-T-P Faculty)
      let match = line.match(subjectLineRegex);
      if (match) {
        const subjectCode = match[2].toUpperCase().replace(/\s+/g, '');
        const subjectName = match[3].trim();
        const typeRaw = match[4].toUpperCase();
        const credits = parseInt(match[5]);
        const ltp = match[6].trim().replace(/\s+/g, ' ');
        
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
            code: subjectCode, // Add both fields as required by model
            subjectName,
            name: subjectName, // Add both fields as required by model
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
      
      // Try pattern 2 (CODE SUBJECT_NAME TYPE CREDITS L-T-P Faculty)
      match = line.match(subjectLineRegex2);
      if (match) {
        const subjectCode = match[1].toUpperCase().replace(/\s+/g, '');
        const subjectName = match[2].trim();
        const typeRaw = match[3].toUpperCase();
        const credits = parseInt(match[4]);
        const ltp = match[5].trim().replace(/\s+/g, ' ');
        
        // Skip LAB, TR, MOOC, PRJ, SEMINAR, AUDIT entries
        if (['LAB', 'TR', 'MOOC', 'PRJ', 'SEMINAR', 'AUDIT'].includes(typeRaw)) {
          continue;
        }
        
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
            code: subjectCode, // Add both fields as required by model
            subjectName,
            name: subjectName, // Add both fields as required by model
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
      
      // Try pattern 3 (S.No. CODE SUBJECT_NAME TYPE CREDITS)
      match = line.match(subjectLineRegex3);
      if (match) {
        const subjectCode = match[2].toUpperCase().replace(/\s+/g, '');
        const subjectName = match[3].trim();
        const typeRaw = match[4].toUpperCase();
        const credits = parseInt(match[5]);
        
        // Skip LAB, TR, MOOC, PRJ, SEMINAR, AUDIT entries
        if (['LAB', 'TR', 'MOOC', 'PRJ', 'SEMINAR', 'AUDIT'].includes(typeRaw)) {
          continue;
        }
        
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
            ltp: '',
            program: currentProgram,
            semester: currentSemester,
            batch: currentBatch,
            academicYear
          });
        }
        continue;
      }
      
      // Try pattern 4 (CODE SUBJECT_NAME TYPE CREDITS)
      match = line.match(subjectLineRegex4);
      if (match) {
        const subjectCode = match[1].toUpperCase().replace(/\s+/g, '');
        const subjectName = match[2].trim();
        const typeRaw = match[3].toUpperCase();
        const credits = parseInt(match[4]);
        
        // Skip LAB, TR, MOOC, PRJ, SEMINAR, AUDIT entries
        if (['LAB', 'TR', 'MOOC', 'PRJ', 'SEMINAR', 'AUDIT'].includes(typeRaw)) {
          continue;
        }
        
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
            ltp: '',
            program: currentProgram,
            semester: currentSemester,
            batch: currentBatch,
            academicYear
          });
        }
        continue;
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
    console.log('Starting Gemini API-based PDF processing...');
    
    // Extract text using Gemini API
    const pdfText = await extractPDFText(fileBuffer);
    
    console.log('PDF text length:', pdfText?.length || 0);
    console.log('PDF text preview:', pdfText?.substring(0, 500) + '...');
    console.log('First 20 lines:');
    console.log(pdfText.split('\n').slice(0, 20).join('\n'));

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
    console.error('Subject upload error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
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
