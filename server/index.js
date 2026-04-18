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
const allowedOrigins = [
  'http://localhost:5173',
  'https://abviiitm-frontend.onrender.com',
  'https://abviiitm-backend.onrender.com'
];
app.use(cors({ 
  origin: allowedOrigins, 
  credentials: true 
}));
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

// Serve static frontend first - check multiple possible paths
const frontendPath = path.join(__dirname, '../../client', 'dist');
const alternativePath = path.join(__dirname, 'client', 'dist');
const rootPath = path.join('/opt/render/project/client', 'dist');

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log('Serving frontend from:', frontendPath);
} else if (fs.existsSync(alternativePath)) {
  app.use(express.static(alternativePath));
  console.log('Serving frontend from:', alternativePath);
} else if (fs.existsSync(rootPath)) {
  app.use(express.static(rootPath));
  console.log('Serving frontend from:', rootPath);
} else {
  console.log('Frontend build not found, expected paths:', frontendPath, alternativePath, rootPath);
}

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

// Catch-all handler for frontend routes (SPA support) - MUST be last
app.get('*', (req, res) => {
  const indexPath = fs.existsSync(path.join(__dirname, '../../client', 'dist', 'index.html'))
    ? path.join(__dirname, '../../client', 'dist', 'index.html')
    : fs.existsSync(path.join(__dirname, 'client', 'dist', 'index.html'))
    ? path.join(__dirname, 'client', 'dist', 'index.html')
    : path.join('/opt/render/project/client', 'dist', 'index.html');
  
  res.sendFile(indexPath);
});

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
