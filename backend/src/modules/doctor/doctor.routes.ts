import { Router } from 'express';
import { DoctorController } from './doctor.controller';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new DoctorController();

// Only ADMIN and SUPERADMIN can create doctors
router.post('/', authenticate, requireRoles([Role.SUPERADMIN, Role.ADMIN]), controller.create);
router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);

export default router;
