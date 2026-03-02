import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { authenticate } from './middlewares/auth.middleware';

dotenv.config();

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Required so frontend can fetch images/PDFs

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  message: { message: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
import authRoutes from './modules/auth/auth.routes';
import adminRoutes from './modules/admin/admin.routes';
import doctorRoutes from './modules/doctor/doctor.routes';
import receptionistRoutes from './modules/receptionist/receptionist.routes';
import patientRoutes from './modules/patient/patient.routes';
import bookingRoutes from './modules/booking/booking.routes';
import visitRoutes from './modules/visit/visit.routes';
import settingsRoutes from './modules/settings/settings.routes';
import medicalReportRoutes from './modules/medical-report/medical-report.routes';
import departmentRoutes from './modules/department/department.routes';

app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/medical-reports', medicalReportRoutes);
app.use('/api/departments', departmentRoutes);

// Base Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Hospital Management API is running' });
});

import path from 'path';
import { upload } from './utils/upload';

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Generic File Upload Endpoint
app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
  try {
    const fileReq = req as any;
    if (!fileReq.file) {
      res.status(400).json({ message: 'No file provided' });
      return;
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileReq.file.filename}`;
    res.status(201).json({ url: fileUrl, filename: fileReq.file.originalname });
  } catch (error: any) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Hospital Management API is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
