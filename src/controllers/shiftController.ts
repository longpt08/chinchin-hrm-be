import { Request, Response, NextFunction } from 'express';
import { ShiftService } from '../services/shiftService';
import { shiftTemplateSchema, shiftRegisterSchema } from '../schemas/shiftSchema';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

const shiftService = new ShiftService();

export class ShiftController {
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await shiftService.getTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = shiftTemplateSchema.parse(req.body);
      const template = await shiftService.createTemplate(data);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError('Validation Error: ' + error.errors.map(e => e.message).join(', '), 400));
      }
      next(error);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = shiftTemplateSchema.partial().parse(req.body);
      const template = await shiftService.updateTemplate(req.params.id, data);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError('Validation Error: ' + error.errors.map(e => e.message).join(', '), 400));
      }
      next(error);
    }
  }

  async getShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const { dateFrom, dateTo, userId, status } = req.query;
      const shifts = await shiftService.getShifts(
        dateFrom as string,
        dateTo as string,
        userId as string,
        status as string
      );
      res.json(shifts);
    } catch (error) {
      next(error);
    }
  }

  async registerShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = shiftRegisterSchema.parse(req.body);
      const shifts = await shiftService.registerShifts(data.userId, data.shifts);
      res.status(201).json(shifts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError('Validation Error: ' + error.errors.map(e => e.message).join(', '), 400));
      }
      next(error);
    }
  }

  async publishShift(req: Request, res: Response, next: NextFunction) {
    try {
      const shift = await shiftService.publishShift(req.params.id);
      res.json(shift);
    } catch (error) {
      next(error);
    }
  }
}
