import express from 'express';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect, authorize } from '../middleware/auth.js';
import Receipt from '../models/Receipt.js';
import Payment from '../models/Payment.js';
import Registration from '../models/Registration.js';
import Student from '../models/Student.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Download receipt PDF
router.get('/download/:receiptId', protect, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.receiptId);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
    const filePath = path.join(__dirname, '..', receipt.pdfPath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'PDF file not found' });
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
