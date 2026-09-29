import { Router } from 'express';
import { ShiftController } from '../controllers/shiftController';

const router = Router();
const shiftController = new ShiftController();

router.get('/shift-templates', shiftController.getTemplates.bind(shiftController));
router.post('/shift-templates', shiftController.createTemplate.bind(shiftController));
router.put('/shift-templates/:id', shiftController.updateTemplate.bind(shiftController));

router.get('/shifts', shiftController.getShifts.bind(shiftController));
router.post('/shifts/register', shiftController.registerShifts.bind(shiftController));
router.put('/shifts/:id/publish', shiftController.publishShift.bind(shiftController));

export default router;
