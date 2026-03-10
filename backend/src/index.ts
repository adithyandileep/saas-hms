import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { authenticate } from './middlewares/auth.middleware';
import { upload } from './utils/upload';

dotenv.config();

import authRoutes from './modules/auth/auth.routes';
import adminRoutes from './modules/admin/admin.routes';
import doctorRoutes from './modules/doctor/doctor.routes';
import receptionistRoutes from './modules/receptionist/receptionist.routes';
import patientRoutes from './modules/patient/patient.routes';
import bookingRoutes from './modules/booking/booking.routes';
import settingsRoutes from './modules/settings/settings.routes';
import medicalReportRoutes from './modules/medical-report/medical-report.routes';
import departmentRoutes from './modules/department/department.routes';
import labRoutes from './modules/lab/lab.routes';
import radiologyRoutes from './modules/radiology/radiology.routes';
import billingRoutes from './modules/billing/billing.routes';
import invoiceRoutes from './modules/invoice/invoice.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
  message: { message: 'Too many requests, please try again later.' },
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/medical-reports', medicalReportRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/radiology', radiologyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

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

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Hospital Management API is running' });
});

app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Hospital Management API is running from 10.03.2026' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
