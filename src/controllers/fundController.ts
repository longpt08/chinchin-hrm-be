import { Request, Response, NextFunction } from 'express';
import { FundService } from '../services/fundService';
import { z } from 'zod';

const fundLogSchema = z.object({
  type: z.string().min(1, "Type is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
});

export const getPunishmentTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await FundService.getPunishmentTemplates();
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
};

export const getFundLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await FundService.getFundLogs();
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

export const createFundLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = fundLogSchema.parse(req.body);
    const log = await FundService.createFundLog(validatedData);
    res.status(201).json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
    }
    next(error);
  }
};
