import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { InvoiceController } from './invoice.controller';

const router = Router();
const controller = new InvoiceController();

router.post('/generate/:appointmentId', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN, Role.RECEPTIONIST]), controller.generate);
router.get('/appointment/:appointmentId', authenticate, controller.getByAppointment);
router.get('/patient/:patientId', authenticate, controller.getByPatient);
router.get('/:id', authenticate, controller.getById);
router.patch('/:id/status', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN, Role.RECEPTIONIST]), controller.updateStatus);

export default router;

