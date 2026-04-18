import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'ABV-IIITM Registration System is running',
    timestamp: new Date().toISOString()
  });
});

// Serve favicon and static files
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Catch-all handler for frontend routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// Serve static frontend first
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// API Routes
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import subjectRoutes from './routes/subject.js';
import paymentRoutes from './routes/payment.js';
import receiptRoutes from './routes/receipt.js';
import verificationRoutes from './routes/verification.js';
import facultyRoutes from './routes/faculty.js';
import adminRoutes from './routes/admin.js';

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/receipt', receiptRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

// Uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const receiptsDir = path.join(__dirname, 'receipts');
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });
app.use('/receipts', express.static(receiptsDir));

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'ABV-IIITM Registration API Running' }));

// MongoDB
mongoose.connect(process.env.MONGO_URI?.replace('localhost', '127.0.0.1'))
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Starting server without DB (demo mode)...');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  });

export default app;
