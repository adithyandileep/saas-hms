import { Router } from 'express';
import { VisitController } from './visit.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new VisitController();

router.post('/', authenticate, controller.create);
router.get('/:id', authenticate, controller.getById);
router.put('/:id', authenticate, controller.update);

export default router;
