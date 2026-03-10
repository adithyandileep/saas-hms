import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { BillingController } from './billing.controller';

const router = Router();
const controller = new BillingController();

router.get('/appointment/:id', authenticate, controller.getByAppointment);
router.get('/patient/:patientId', authenticate, controller.getByPatient);
router.post('/', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN, Role.RECEPTIONIST]), controller.createItem);
router.put('/:id', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN, Role.RECEPTIONIST]), controller.updateItem);
router.delete('/:id', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN]), controller.deleteItem);

export default router;
