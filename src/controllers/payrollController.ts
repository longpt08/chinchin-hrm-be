import { Request, Response, NextFunction } from 'express';
import { PayrollService } from '../services/payrollService';

export class PayrollController {
  static async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const { month, year, userId } = req.query;
      const m = month ? parseInt(month as string, 10) : new Date().getMonth() + 1;
      const y = year ? parseInt(year as string, 10) : new Date().getFullYear();
      
      const calculations = await PayrollService.calculateMonthly(m, y, userId as string);
      
      res.json({ success: true, data: calculations });
    } catch (error) {
      next(error);
    }
  }

  static async addAdjustment(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, type, amount, date, description } = req.body;
      const adjustmentDate = new Date(date);
      const adjustment = await PayrollService.addAdjustment({
        userId,
        type,
        amount: parseFloat(amount),
        date: adjustmentDate,
        description,
      });

      res.status(201).json({ success: true, data: adjustment });
    } catch (error) {
      next(error);
    }
  }

  static async getAdjustments(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, month, year } = req.query;
      const m = month ? parseInt(month as string, 10) : undefined;
      const y = year ? parseInt(year as string, 10) : undefined;

      const adjustments = await PayrollService.getAdjustments({
        userId: userId as string,
        month: m,
        year: y,
      });

      res.json({ success: true, data: adjustments });
    } catch (error) {
      next(error);
    }
  }

  static async savePayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, month, year } = req.body;
      const payslip = await PayrollService.savePayslip(userId, parseInt(month, 10), parseInt(year, 10));

      res.status(201).json({ success: true, data: payslip });
    } catch (error) {
      next(error);
    }
  }

  static async getPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, month, year } = req.query;
      const m = month ? parseInt(month as string, 10) : undefined;
      const y = year ? parseInt(year as string, 10) : undefined;

      const payslips = await PayrollService.getPayslips({
        userId: userId as string,
        month: m,
        year: y,
      });

      res.json({ success: true, data: payslips });
    } catch (error) {
      next(error);
    }
  }
}
