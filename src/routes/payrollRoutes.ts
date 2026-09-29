import { Router } from 'express';
import { PayrollController } from '../controllers/payrollController';

const router = Router();

// Payroll calculation
router.get('/calculate', PayrollController.calculate);

// Salary adjustments
router.post('/adjustments', PayrollController.addAdjustment);
router.get('/adjustments', PayrollController.getAdjustments);

// Payslips
router.post('/payslips', PayrollController.savePayslip);
router.get('/payslips', PayrollController.getPayslips);

export default router;
