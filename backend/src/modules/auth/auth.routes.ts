import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/setup-status', controller.checkSetup);
router.post('/setup', controller.setup);
router.get('/me', authenticate, controller.me);

export default router;
