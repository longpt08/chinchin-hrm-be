import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone is required'),
    roleId: z.string().uuid('Invalid role ID format'),
    employmentType: z.enum(['Full-time', 'Part-time']),
    contractType: z.enum(['Probation', 'Official']),
    onboardDate: z.string().or(z.date()).transform((val) => new Date(val)),
    baseSalary: z.number().min(0),
    probationSalary: z.number().min(0).optional(),
  })
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    roleId: z.string().uuid().optional(),
    employmentType: z.enum(['Full-time', 'Part-time']).optional(),
    contractType: z.enum(['Probation', 'Official']).optional(),
    onboardDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    baseSalary: z.number().min(0).optional(),
    probationSalary: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  })
});
