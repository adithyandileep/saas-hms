import { Router } from 'express';
import { BookingController } from './booking.controller';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new BookingController();

router.post('/slots', authenticate, requireRoles([Role.SUPERADMIN, Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST]), controller.createSlot);
router.get('/slots/:doctorId', authenticate, controller.getAvailableSlots);
router.post('/book', authenticate, requireRoles([Role.RECEPTIONIST, Role.PATIENT, Role.ADMIN, Role.SUPERADMIN]), controller.bookAppointment);
router.get('/appointments', authenticate, controller.getAppointments);
router.get('/appointments/:id', authenticate, controller.getAppointmentById);
router.post('/appointments/:id/pay', authenticate, controller.payAppointment);
router.patch('/appointments/:id/acknowledge', authenticate, controller.acknowledgeAppointment);

export default router;
