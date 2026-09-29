import { z } from 'zod';

export const shiftTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Invalid time format'),
  allowedLateMinutes: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
});

export const shiftRegisterSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  shifts: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
      templateId: z.string().uuid('Invalid template ID'),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Invalid time format'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Invalid time format'),
    })
  ).min(1, 'At least one shift is required'),
});
