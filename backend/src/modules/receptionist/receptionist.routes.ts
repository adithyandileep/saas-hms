import { Router } from 'express';
import { ReceptionistController } from './receptionist.controller';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new ReceptionistController();

router.post('/', authenticate, requireRoles([Role.SUPERADMIN, Role.ADMIN]), controller.create);
router.get('/', authenticate, controller.getAll);

export default router;
