import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new DepartmentController();

// All department endpoints require authentication
router.use(authenticate);

// Everyone authenticated might need to fetch departments (receptionists for booking, etc)
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Only Admins and Superadmins can create/update/delete departments
router.use(requireRoles([Role.ADMIN, Role.SUPERADMIN]));
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
