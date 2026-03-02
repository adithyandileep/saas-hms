import { Router } from 'express';
import { MedicalReportController } from './medical-report.controller';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new MedicalReportController();

router.post('/', authenticate, requireRoles([Role.SUPERADMIN, Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.PATIENT]), controller.create);
router.get('/patient/:patientId', authenticate, controller.getByPatient);

export default router;
