import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new AdminController();

// Dashboard stats reachable by Admin and Superadmin
router.get('/dashboard', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN]), controller.getDashboard);

// Only SuperAdmin can manage other Admins below this line
router.use(authenticate, requireRoles([Role.SUPERADMIN]));

router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
