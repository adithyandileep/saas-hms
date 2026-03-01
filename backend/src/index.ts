import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

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

app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/settings', settingsRoutes);

// Base Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Hospital Management API is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
