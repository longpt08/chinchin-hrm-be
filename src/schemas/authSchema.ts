import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(1, 'Phone is required'),
    password: z.string().optional(), // password for manager
    pin: z.string().optional(), // pin for employee
    role: z.enum(['manager', 'employee']),
  }).refine((data) => {
    if (data.role === 'manager' && !data.password) {
      return false;
    }
    if (data.role === 'employee' && !data.pin) {
      return false;
    }
    return true;
  }, {
    message: 'Password is required for manager, PIN is required for employee',
    path: ['body', 'password_or_pin']
  })
});
