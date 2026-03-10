import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { RadiologyController } from './radiology.controller';

const router = Router();
const controller = new RadiologyController();

router.get('/catalog', authenticate, controller.getTests);
router.post('/catalog', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN]), controller.createTest);
router.put('/catalog/:id', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN]), controller.updateTest);
router.patch('/catalog/:id/deactivate', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN]), controller.deactivateTest);
router.get('/requests', authenticate, controller.getRequests);
router.get('/requests/:id', authenticate, controller.getRequestById);
router.post('/requests', authenticate, requireRoles([Role.DOCTOR, Role.SUPERADMIN]), controller.createRequest);
router.patch('/requests/:id/status', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN]), controller.updateRequestStatus);
router.post('/reports', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN]), controller.createReport);
router.post('/requests/:id/report', authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN]), controller.createReport);
router.get('/reports/:id', authenticate, controller.getReport);
router.get('/patient/:patientId', authenticate, controller.getPatientRadiologyData);

export default router;
