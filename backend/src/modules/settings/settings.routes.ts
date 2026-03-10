import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new SettingsController();

router.use(authenticate);

// Allow all staff roles to read organization settings for document headers
router.get('/organization', requireRoles([Role.SUPERADMIN, Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST]), controller.getOrganization);
router.put('/organization', requireRoles([Role.SUPERADMIN, Role.ADMIN]), controller.updateOrganization);

export default router;
