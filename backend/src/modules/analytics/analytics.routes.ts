import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRoles } from '../../middlewares/auth.middleware';
import { AnalyticsController } from './analytics.controller';

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate, requireRoles([Role.ADMIN, Role.SUPERADMIN]));

router.get('/revenue/daily', controller.getDailyRevenue);
router.get('/revenue/weekly', controller.getWeeklyRevenue);
router.get('/revenue/monthly', controller.getMonthlyRevenue);
router.get('/revenue/yearly', controller.getYearlyRevenue);
router.get('/payment-methods', controller.getPaymentMethods);
router.get('/department-revenue', controller.getDepartmentRevenue);
router.get('/doctor-revenue', controller.getDoctorRevenue);
router.get('/patient-revenue', controller.getPatientRevenue);
router.get('/lab-revenue', controller.getLabRevenue);
router.get('/radiology-revenue', controller.getRadiologyRevenue);
router.get('/cash-flow', controller.getCashFlow);

export default router;
