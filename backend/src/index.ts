import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { authenticate } from './middlewares/auth.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

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

app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/medical-reports', medicalReportRoutes);

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
