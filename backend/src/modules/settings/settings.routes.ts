import { Router } from 'express';
import { SettingsController } from './settings.controller';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const controller = new SettingsController();

router.use(authenticate);

// Allow SUPERADMIN and ADMIN to manage organization settings
router.get('/organization', requireRoles([Role.SUPERADMIN, Role.ADMIN]), controller.getOrganization);
router.put('/organization', requireRoles([Role.SUPERADMIN, Role.ADMIN]), controller.updateOrganization);

export default router;
