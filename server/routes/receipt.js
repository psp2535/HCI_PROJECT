import express from 'express';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect, authorize } from '../middleware/auth.js';
import { uploadPDF, handleUploadError } from '../middleware/upload.js';
import Receipt from '../models/Receipt.js';
import Payment from '../models/Payment.js';
import Registration from '../models/Registration.js';
import Student from '../models/Student.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Extract all receipt details from PDF text
async function extractReceiptDetailsFromPDF(pdfBuffer) {
  try {
    const { default: pdfParse } = await import('pdf-parse');
    const data = await pdfParse(pdfBuffer);
    const text = data.text;
    
    const extracted = {
      utrNumber: null,
      amount: null,
      paymentDate: null,
      bankName: null
    };
    
    // Extract UTR number
    const utrPatterns = [
      /UTR\s*No[:\s]*([A-Z0-9]+)/gi,
      /Transaction\s*No[:\s]*([A-Z0-9]+)/gi,
      /Ref\s*No[:\s]*([A-Z0-9]+)/gi,
      /Reference\s*No[:\s]*([A-Z0-9]+)/gi,
      /UTR[:\s]*([A-Z0-9]+)/gi,
      /Transaction\s*ID[:\s]*([A-Z0-9]+)/gi,
      /Transaction\s*Reference[:\s]*([A-Z0-9]+)/gi,
      /Payment\s*ID[:\s]*([A-Z0-9]+)/gi,
      /Receipt\s*No[:\s]*([A-Z0-9]+)/gi,
      /([A-Z0-9]{12,})/g,
      /\b[A-Z0-9]{10,}\b/g
    ];
    
    for (const pattern of utrPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const match = matches[0];
        const utrMatch = match.match(/([A-Z0-9]{8,})/);
        if (utrMatch && utrMatch[1]) {
          extracted.utrNumber = utrMatch[1].trim();
          break;
        }
      }
    }
    
    // Extract amount (look for currency symbols and patterns)
    const amountPatterns = [
      /(?:Amount|Total|Paid|Sum|Fee)[\s:]*[¥$Rs]?[\s]*([0-9,]+(?:\.[0-9]{2})?)/gi,
      /[¥$Rs]?\s*([0-9,]+(?:\.[0-9]{2})?)/gi,
      /([0-9,]+(?:\.[0-9]{2})?)\s*(?:Rs|INR|¥|Rupees)/gi,
      /(?:Academic\s*Fee|Tuition\s*Fee)[\s:]*[¥$Rs]?[\s]*([0-9,]+(?:\.[0-9]{2})?)/gi,
      /\b([0-9,]{3,}(?:\.[0-9]{2})?)\b/g
    ];
    
    for (const pattern of amountPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const amountMatch = matches[0].match(/([0-9,]+(?:\.[0-9]{2})?)/);
        if (amountMatch && amountMatch[1]) {
          extracted.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
          break;
        }
      }
    }
    
    // Extract payment date
    const datePatterns = [
      /(?:Date|Payment\s*Date|Paid\s*on|Transaction\s*Date)[\s:]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/gi,
      /([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/gi,
      /(?:Date|Payment\s*Date|Paid\s*on)[\s:]*([0-9]{4}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2})/gi,
      /([0-9]{4}[\/\-][0-9]{1,2}[\/\-][0-9]{1,2})/gi
    ];
    
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const dateMatch = matches[0].match(/([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/);
        if (dateMatch && dateMatch[1]) {
          const dateStr = dateMatch[1];
          // Try to parse different date formats
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            extracted.paymentDate = date.toISOString().split('T')[0];
            break;
          }
        }
      }
    }
    
    // Extract bank name
    const bankPatterns = [
      /(?:Bank|Payment\s*via|Paid\s*through)[\s:]*([A-Za-z\s]+?)(?:\n|$)/gi,
      /([A-Za-z\s]+Bank)(?:\n|$)/gi,
      /([A-Za-z\s]+Payment)(?:\n|$)/gi,
      /(?:Merchant|Biller|Payee)[\s:]*([A-Za-z\s]+?)(?:\n|$)/gi,
      /([A-Za-z\s]+(?:Bank|Payments|Pay))/gi
    ];
    
    for (const pattern of bankPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const bankMatch = matches[0].match(/([A-Za-z\s]{3,})/);
        if (bankMatch && bankMatch[1]) {
          extracted.bankName = bankMatch[1].trim();
          break;
        }
      }
    }
    
    console.log('PDF Text Sample:', text.substring(0, 500) + '...');
    console.log('Extracted details:', extracted);
    
    // Log what was found for debugging
    console.log('UTR found:', !!extracted.utrNumber);
    console.log('Amount found:', !!extracted.amount);
    console.log('Date found:', !!extracted.paymentDate);
    console.log('Bank found:', !!extracted.bankName);
    
    return extracted;
  } catch (error) {
    console.error('Error extracting details from PDF:', error);
    return {
      utrNumber: null,
      amount: null,
      paymentDate: null,
      bankName: null
    };
  }
}

// Convert number to words (simple implementation)
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }
  return convert(Math.round(num)) + ' Rupees Only';
}

// Generate PDF receipt matching the real ABV-IIITM receipt format
async function generateReceiptPDF(receipt, student, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const pageW = 595;
    const colLeft = 40;
    const colRight = pageW - 40;

    // ─── HEADER ───────────────────────────────────────────────
    // Institute logo placeholder (circle)
    doc.circle(colLeft + 30, 60, 28).stroke('#003580');

    // Institute name
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#003580')
      .text('ABV - Indian Institute of Information Technology and Management', colLeft + 70, 38, { width: 370 });
    doc.font('Helvetica').fontSize(10).fillColor('#333')
      .text('Morena Link Road, Gwalior - 474015, Madhya Pradesh', colLeft + 70, 68);
    doc.fontSize(9).text('Web: www.iiitm.ac.in  |  Phone: 0751-2449704', colLeft + 70, 82);

    // Horizontal rule
    doc.moveTo(colLeft, 105).lineTo(colRight, 105).lineWidth(2).strokeColor('#003580').stroke();

    // Receipt title
    const title = receipt.type === 'mess' ? 'HOSTEL MESS FEE RECEIPT' : 'ACADEMIC FEE RECEIPT';
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#003580')
      .text(title, colLeft, 112, { width: pageW - 80, align: 'center' });

    doc.moveTo(colLeft, 130).lineTo(colRight, 130).lineWidth(1).strokeColor('#aaa').stroke();

    // ─── RECEIPT META ─────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000');
    doc.text(`Receipt No: ${receipt.receiptNo}`, colLeft, 140);
    doc.text(`Date: ${new Date(receipt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, colRight - 160, 140);

    // ─── STUDENT INFO BOX ─────────────────────────────────────
    doc.rect(colLeft, 158, pageW - 80, 78).strokeColor('#003580').lineWidth(1).stroke();

    const infoY = 165;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#003580').text('STUDENT DETAILS', colLeft + 8, infoY);
    doc.moveTo(colLeft, infoY + 12).lineTo(colRight, infoY + 12).strokeColor('#003580').lineWidth(0.5).stroke();

    const info = [
      ['Student Name', student.name],
      ['Roll Number', student.rollNo],
      ['Program', student.program],
      ['Semester', `${receipt.semester} (${receipt.academicYear})`],
      ['ABC ID', student.abcId || 'N/A'],
    ];

    info.forEach(([label, value], i) => {
      const row = infoY + 18 + i * 12;
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#555').text(label + ':', colLeft + 8, row);
      doc.font('Helvetica').fontSize(8.5).fillColor('#000').text(value || '-', colLeft + 100, row);
    });

    // ─── FEE BREAKDOWN TABLE ──────────────────────────────────
    const tableTop = 248;
    doc.rect(colLeft, tableTop, pageW - 80, 16).fillColor('#003580').fill();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#fff')
      .text('S.No', colLeft + 6, tableTop + 4)
      .text('Particulars', colLeft + 40, tableTop + 4)
      .text('Amount (₹)', colRight - 100, tableTop + 4, { width: 90, align: 'right' });

    let rowY = tableTop + 16;
    doc.font('Helvetica').fontSize(9).fillColor('#000');

    receipt.breakdown.forEach((item, i) => {
      const bg = i % 2 === 0 ? '#f0f4ff' : '#ffffff';
      doc.rect(colLeft, rowY, pageW - 80, 16).fillColor(bg).fill();
      doc.fillColor('#000')
        .text(String(i + 1), colLeft + 6, rowY + 4)
        .text(item.particular, colLeft + 40, rowY + 4)
        .text(item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colRight - 100, rowY + 4, { width: 90, align: 'right' });
      rowY += 16;
    });

    // Total row
    doc.rect(colLeft, rowY, pageW - 80, 20).fillColor('#e8f0fe').fill();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#003580')
      .text('TOTAL', colLeft + 40, rowY + 5)
      .text(receipt.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colRight - 100, rowY + 5, { width: 90, align: 'right' });
    doc.rect(colLeft, tableTop, pageW - 80, rowY - tableTop + 20).strokeColor('#003580').lineWidth(0.8).stroke();

    // Amount in words
    rowY += 30;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#555').text('Amount in Words:', colLeft, rowY);
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#003580').text(receipt.amountInWords, colLeft + 100, rowY);

    // ─── TRANSACTION DETAILS ──────────────────────────────────
    rowY += 20;
    doc.rect(colLeft, rowY, pageW - 80, 12).fillColor('#f5f5f5').fill();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#003580').text('TRANSACTION DETAILS', colLeft + 8, rowY + 2);
    rowY += 14;

    doc.rect(colLeft, rowY, pageW - 80, 44).strokeColor('#ccc').lineWidth(0.5).stroke();
    const txInfo = [
      ['Payment Mode', receipt.transactionMode || 'Unified Payments'],
      ['Transaction No.', receipt.transactionNo || 'N/A'],
      ['Bank Name', receipt.bankName || 'N/A'],
      ['Transaction Date', receipt.transactionDate ? new Date(receipt.transactionDate).toLocaleDateString('en-IN') : 'N/A'],
    ];
    txInfo.forEach(([label, value], i) => {
      const tx = rowY + 4 + i * 10;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#555').text(label + ':', colLeft + 8, tx);
      doc.font('Helvetica').fontSize(8).fillColor('#000').text(value, colLeft + 110, tx);
    });

    // ─── SIGNATURE SECTION ────────────────────────────────────
    rowY += 60;
    doc.moveTo(colLeft, rowY).lineTo(colRight, rowY).strokeColor('#ccc').lineWidth(0.5).stroke();
    rowY += 10;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#003580')
      .text('This is a system-generated receipt.', colLeft, rowY, { width: 250 });

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#000')
      .text('Authorized Signatory', colRight - 130, rowY);
    doc.font('Helvetica').fontSize(8).fillColor('#555')
      .text('Accounts Section, ABV-IIITM Gwalior', colRight - 155, rowY + 14);

    // Footer
    rowY += 50;
    doc.moveTo(colLeft, rowY).lineTo(colRight, rowY).strokeColor('#003580').lineWidth(1.5).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor('#888')
      .text('ABV-IIITM Gwalior | Morena Link Road, Gwalior - 474015 | www.iiitm.ac.in', colLeft, rowY + 6, { width: pageW - 80, align: 'center' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// Generate receipt (called after payment submission)
router.post('/generate', protect, authorize('student'), async (req, res) => {
  try {
    const { type } = req.body; // 'academic' or 'mess'
    const student = await Student.findById(req.user.id);
    const reg = await Registration.findOne({ studentId: req.user.id });
    const payment = await Payment.findOne({ registrationId: reg._id });

    if (!payment) return res.status(404).json({ message: 'No payment found. Submit payment first.' });

    // Build breakdown based on type
    let breakdown, totalAmount;
    if (type === 'academic') {
      breakdown = [
        { particular: 'Tuition Fee', amount: 72000 },
        { particular: 'Library Fee', amount: 2000 },
        { particular: 'Exam Fee', amount: 1500 },
        { particular: 'Registration Fee', amount: 1000 },
        { particular: 'Internet Fee', amount: 2000 },
        { particular: 'Medical Fee', amount: 1500 },
        { particular: 'Cultural Activities Fee', amount: 1000 },
        { particular: 'Hostel Room Rent', amount: 12000 },
      ];
      totalAmount = 93000;
    } else {
      breakdown = [{ particular: 'Hostel Mess Fee', amount: 18000 }];
      totalAmount = 18000;
    }

    const txn = payment.transactions?.[0];

    // Check if receipt already exists
    let receipt = await Receipt.findOne({ studentId: req.user.id, type });

    if (!receipt) {
      receipt = await Receipt.create({
        studentId: req.user.id,
        registrationId: reg._id,
        paymentId: payment._id,
        rollNo: student.rollNo,
        studentName: student.name,
        program: student.program,
        semester: reg.semester,
        academicYear: reg.academicYear,
        type,
        breakdown,
        totalAmount,
        amountInWords: numberToWords(totalAmount),
        transactionMode: 'Unified Payments',
        transactionNo: txn?.utrNo || 'N/A',
        bankName: txn?.bankName || 'N/A',
        transactionDate: txn?.date || new Date(),
        date: new Date(),
      });
    }

    // Generate PDF
    const receiptsDir = path.join(__dirname, '..', 'receipts');
    const pdfPath = path.join(receiptsDir, `${receipt.receiptNo.replace('/', '_')}_${type}.pdf`);

    await generateReceiptPDF(receipt, student, pdfPath);

    receipt.pdfPath = `/receipts/${receipt.receiptNo.replace('/', '_')}_${type}.pdf`;
    await receipt.save();

    res.json({ receipt, pdfUrl: receipt.pdfPath });
  } catch (err) {
    console.error('Receipt generation error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get student's receipts
router.get('/my-receipts', protect, authorize('student'), async (req, res) => {
  try {
    const receipts = await Receipt.find({ studentId: req.user.id });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Download receipt PDF (only for receipt owner or admin)
router.get('/download/:receiptId', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.receiptId);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
    
    // Check if user is the receipt owner or admin
    if (req.user.role !== 'admin' && receipt.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const filePath = path.join(__dirname, '..', receipt.pdfPath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'PDF file not found' });
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload payment receipt (for students)
router.post('/upload-receipt', protect, authorize('student'), uploadPDF, handleUploadError, async (req, res) => {
  try {
    const { utrNumber, amount, paymentDate, bankName, manualEntry } = req.body;
    const receiptFile = req.file;
    
    // Use manual values as defaults
    let finalUTR = utrNumber;
    let finalAmount = amount;
    let finalPaymentDate = paymentDate;
    let finalBankName = bankName || 'Unknown';
    
    // Extract all details from PDF if file uploaded and not manual entry
    if (receiptFile && !manualEntry) {
      try {
        const extracted = await extractReceiptDetailsFromPDF(receiptFile.buffer);
        
        // Use extracted values if available, otherwise keep manual values
        if (extracted.utrNumber) {
          finalUTR = extracted.utrNumber;
          console.log('UTR extracted from PDF:', extracted.utrNumber);
        }
        
        if (extracted.amount) {
          finalAmount = extracted.amount.toString();
          console.log('Amount extracted from PDF:', extracted.amount);
        }
        
        if (extracted.paymentDate) {
          finalPaymentDate = extracted.paymentDate;
          console.log('Payment date extracted from PDF:', extracted.paymentDate);
        }
        
        if (extracted.bankName) {
          finalBankName = extracted.bankName;
          console.log('Bank name extracted from PDF:', extracted.bankName);
        }
        
        if (!extracted.utrNumber && !extracted.amount && !extracted.paymentDate && !extracted.bankName) {
          console.log('Could not extract details from PDF, using manual entry');
        }
      } catch (error) {
        console.error('Error extracting details from PDF:', error);
      }
    }
    
    // Validate required fields
    if (manualEntry) {
      // For manual entry, all fields must be provided
      if (!finalUTR || !finalAmount || !finalPaymentDate) {
        return res.status(400).json({ 
          success: false,
          message: 'UTR number, amount, and payment date are required for manual entry' 
        });
      }
    } else {
      // For PDF upload, if file is uploaded, accept it even if no details are extracted
      // The PDF processing should extract details, but if it fails, we still accept the upload
      if (!receiptFile) {
        // If no file uploaded, require at least one field
        if (!finalUTR && !finalAmount && !finalPaymentDate) {
          return res.status(400).json({ 
            success: false,
            message: 'Please upload a PDF file or provide at least UTR number, amount, or payment date' 
          });
        }
      }
    }
    
    // Check if receipt with this UTR already exists (only if UTR is available)
    if (finalUTR) {
      const existingReceipt = await Receipt.findOne({ transactionNo: finalUTR });
      if (existingReceipt) {
        return res.status(400).json({ 
          success: false,
          message: 'A receipt with this UTR number already exists' 
        });
      }
    }
    
    // Get student details for receipt
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(400).json({ 
        success: false,
        message: 'Student not found' 
      });
    }
    
    // Create new receipt record
    const receiptData = {
      studentId: req.user.id,
      rollNo: student.rollNo,
      studentName: student.name,
      program: student.program,
      semester: student.semester || student.currentSemester,
      academicYear: '2025-26',
      type: 'academic', // Default to academic fee
      transactionNo: finalUTR || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bankName: finalBankName,
      transactionDate: finalPaymentDate ? new Date(finalPaymentDate) : new Date(),
      totalAmount: finalAmount ? parseFloat(finalAmount) : 0,
      amountInWords: finalAmount ? `Rupees ${finalAmount} Only` : 'Amount not specified',
      breakdown: [{
        particular: 'Academic Fee',
        amount: finalAmount ? parseFloat(finalAmount) : 0
      }]
    };
    
    // Add PDF path if file was uploaded
    if (receiptFile && !manualEntry) {
      receiptData.pdfPath = `receipts/${receiptFile.filename}`;
    }
    
    const receipt = new Receipt(receiptData);
    
    await receipt.save();
    
    // Update or create payment record
    await Payment.findOneAndUpdate(
      { studentId: req.user.id },
      {
        studentId: req.user.id,
        status: 'submitted',
        transactions: [{
          amount: finalAmount ? parseFloat(finalAmount) : 0,
          date: finalPaymentDate ? new Date(finalPaymentDate) : new Date(),
          utrNumber: finalUTR || 'Auto-generated',
          bankName: finalBankName,
          receiptId: receipt._id
        }],
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    // Check if any details were extracted from PDF
    const hasExtractedDetails = receiptFile && !manualEntry && (
      (finalUTR && finalUTR !== utrNumber) ||
      (finalAmount && finalAmount !== amount) ||
      (finalPaymentDate && finalPaymentDate !== paymentDate) ||
      (finalBankName && finalBankName !== (bankName || 'Unknown'))
    );
    
    let message = 'Receipt uploaded successfully! Your payment is now pending verification.';
    if (hasExtractedDetails) {
      const extractedInfo = [];
      if (finalUTR && finalUTR !== utrNumber) extractedInfo.push(`UTR: ${finalUTR}`);
      if (finalAmount && finalAmount !== amount) extractedInfo.push(`Amount: ¥${finalAmount}`);
      if (finalPaymentDate && finalPaymentDate !== paymentDate) extractedInfo.push(`Date: ${finalPaymentDate}`);
      if (finalBankName && finalBankName !== (bankName || 'Unknown')) extractedInfo.push(`Bank: ${finalBankName}`);
      
      message = `Details automatically extracted from PDF: ${extractedInfo.join(', ')}. Receipt uploaded successfully!`;
    }
    
    res.json({
      success: true,
      message,
      receipt,
      extractedDetails: hasExtractedDetails ? {
        utrNumber: finalUTR !== utrNumber ? finalUTR : null,
        amount: finalAmount !== amount ? finalAmount : null,
        paymentDate: finalPaymentDate !== paymentDate ? finalPaymentDate : null,
        bankName: finalBankName !== (bankName || 'Unknown') ? finalBankName : null
      } : null
    });
    
  } catch (err) {
    console.error('Receipt upload error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload receipt. Please try again.' 
    });
  }
});

// Get student's uploaded receipts
router.get('/my-receipts', protect, authorize('student'), async (req, res) => {
  try {
    const receipts = await Receipt.find({ studentId: req.user.id })
      .sort({ uploadedAt: -1 });
    
    res.json({
      success: true,
      receipts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all receipts for accounts staff verification
router.get('/all-receipts', protect, authorize('admin', 'verification_staff'), async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const receipts = await Receipt.find(query)
      .populate('studentId', 'name rollNo program semester email')
      .sort({ uploadedAt: -1 });
    
    res.json({
      success: true,
      receipts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify receipt (for accounts staff)
router.post('/verify/:receiptId', protect, authorize('admin', 'verification_staff'), async (req, res) => {
  try {
    const { receiptId } = req.params;
    const { action } = req.body; // 'verify' or 'reject'
    
    if (!['verify', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be verify or reject.'
      });
    }
    
    const receipt = await Receipt.findById(receiptId).populate('studentId');
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found.'
      });
    }
    
    // Update receipt status
    receipt.status = action === 'verify' ? 'verified' : 'rejected';
    receipt.verifiedBy = req.user.id;
    receipt.verifiedAt = new Date();
    await receipt.save();
    
    // Update payment status if verified
    if (action === 'verify') {
      await Payment.findOneAndUpdate(
        { studentId: receipt.studentId._id },
        { 
          status: 'verified',
          verifiedAt: new Date(),
          verificationStatus: 'approved'
        }
      );
      
      // Update registration status
      await Registration.findOneAndUpdate(
        { studentId: receipt.studentId._id },
        { 
          verificationStatus: 'approved',
          paymentVerified: true,
          paymentVerifiedAt: new Date()
        }
      );
    }
    
    res.json({
      success: true,
      message: `Receipt ${action === 'verify' ? 'verified' : 'rejected'} successfully.`,
      receipt
    });
    
  } catch (err) {
    console.error('Receipt verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify receipt. Please try again.'
    });
  }
});

export default router;
