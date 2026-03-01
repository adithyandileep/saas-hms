import { Router } from 'express';
import { PatientController } from './patient.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new PatientController();

router.post('/register', authenticate, controller.register);
router.get('/', authenticate, controller.getAll);
router.get('/:id', authenticate, controller.getById);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.delete);

export default router;
