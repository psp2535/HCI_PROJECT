/**
 * Test script for new features
 * Run with: node test-new-features.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Subject from './models/Subject.js';
import Registration from './models/Registration.js';
import { promoteStudentsToNextSemester, getPromotionStats } from './controllers/promotionController.js';
import { parsePDFToSubjects } from './controllers/subjectUploadController.js';

dotenv.config();

const testPromotion = async () => {
  console.log('\n=== Testing Semester Promotion ===\n');
  
  try {
    // Get stats before promotion
    console.log('📊 Getting promotion stats...');
    const statsBefore = await getPromotionStats();
    console.log('Stats before promotion:', JSON.stringify(statsBefore, null, 2));
    
    // Test promotion for IMT program
    console.log('\n🚀 Promoting IMT students...');
    const result = await promoteStudentsToNextSemester({ program: 'IMT' });
    console.log('Promotion result:', JSON.stringify(result, null, 2));
    
    // Get stats after promotion
    console.log('\n📊 Getting promotion stats after...');
    const statsAfter = await getPromotionStats();
    console.log('Stats after promotion:', JSON.stringify(statsAfter, null, 2));
    
    console.log('\n✅ Promotion test completed');
  } catch (error) {
    console.error('❌ Promotion test failed:', error.message);
  }
};

const testPDFParsing = () => {
  console.log('\n=== Testing PDF Parsing ===\n');
  
  const samplePDFText = `
    ABV-IIITM Gwalior
    Subject List for Semester Registration
    
    Program: IMT
    Semester: 3
    Academic Year: 2025-26
    
    Core Subjects:
    CS301 Data Structures and Algorithms (4 credits)
    CS302 Database Management Systems (4 credits)
    CS303 Computer Organization (3 credits)
    
    Electives:
    CS401 Artificial Intelligence (3 credits)
    CS402 Web Development (3 credits)
  `;
  
  try {
    console.log('📄 Parsing sample PDF text...');
    const parsed = parsePDFToSubjects(samplePDFText);
    console.log('Parsed data:', JSON.stringify(parsed, null, 2));
    console.log('\n✅ PDF parsing test completed');
  } catch (error) {
    console.error('❌ PDF parsing test failed:', error.message);
  }
};

const testDynamicSubjectFetch = async () => {
  console.log('\n=== Testing Dynamic Subject Fetch ===\n');
  
  try {
    // Find a test student
    const student = await Student.findOne({ program: 'IMT' });
    
    if (!student) {
      console.log('⚠️  No IMT student found. Skipping test.');
      return;
    }
    
    console.log(`📚 Fetching subjects for student: ${student.name} (${student.program} Sem ${student.currentSemester || student.semester})`);
    
    // Fetch subjects for this student's program and semester
    const subjects = await Subject.find({
      program: student.program,
      semester: student.currentSemester || student.semester
    });
    
    console.log(`Found ${subjects.length} subjects:`);
    subjects.forEach(sub => {
      console.log(`  - ${sub.subjectCode}: ${sub.subjectName} (${sub.credits} credits, ${sub.type})`);
    });
    
    if (subjects.length === 0) {
      console.log('⚠️  No subjects found. Upload subjects first using PDF upload feature.');
    } else {
      console.log('\n✅ Dynamic subject fetch test completed');
    }
  } catch (error) {
    console.error('❌ Dynamic subject fetch test failed:', error.message);
  }
};

const testSubjectValidation = async () => {
  console.log('\n=== Testing Subject Selection Validation ===\n');
  
  try {
    const student = await Student.findOne({ program: 'IMT' });
    
    if (!student) {
      console.log('⚠️  No IMT student found. Skipping test.');
      return;
    }
    
    const subjects = await Subject.find({
      program: student.program,
      semester: student.currentSemester || student.semester
    });
    
    if (subjects.length === 0) {
      console.log('⚠️  No subjects found. Skipping validation test.');
      return;
    }
    
    // Test 1: Calculate total credits
    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    console.log(`📊 Total available credits: ${totalCredits}`);
    
    // Test 2: Check core subjects
    const coreSubjects = subjects.filter(s => s.type === 'core');
    const electiveSubjects = subjects.filter(s => s.type === 'elective');
    console.log(`   Core subjects: ${coreSubjects.length}`);
    console.log(`   Elective subjects: ${electiveSubjects.length}`);
    
    // Test 3: Validate credit limit
    if (totalCredits > 32) {
      console.log(`⚠️  Total credits (${totalCredits}) exceed limit of 32`);
    } else {
      console.log(`✅ Total credits within limit`);
    }
    
    console.log('\n✅ Subject validation test completed');
  } catch (error) {
    console.error('❌ Subject validation test failed:', error.message);
  }
};

const runAllTests = async () => {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Testing New Features Implementation          ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  try {
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI?.replace('localhost', '127.0.0.1'));
    console.log('✅ Connected to MongoDB');
    
    // Run tests
    await testPromotion();
    testPDFParsing();
    await testDynamicSubjectFetch();
    await testSubjectValidation();
    
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   All Tests Completed                          ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

// Run tests
runAllTests();
