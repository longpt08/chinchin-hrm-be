import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.roleName;
    if (!userRole) {
      return next(new AppError('User role not found', 403));
    }
    
    // Managers typically have universal access, but we can stick to explicit arrays
    // Or if manager is universally allowed, we can do `userRole === 'manager'` bypass.
    if (userRole === 'manager' || roles.includes(userRole)) {
      next();
    } else {
      next(new AppError('Forbidden: Insufficient role permissions', 403));
    }
  };
};
